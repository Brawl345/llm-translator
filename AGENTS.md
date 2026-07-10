# LLM Guidance

This file provides guidance to LLMs when working with code in this repository.

## Overview

Chrome/Firefox web extension that provides context menu translation using OpenAI's API. Features streaming responses,
additional cultural context, and comprehensive internationalization. Built with **WXT** + **Vue 3** (TypeScript), linted
and formatted with Biome.

## Architecture

**Message-Driven System**: The background does all network/streaming work; the content script renders. They communicate
via `browser.runtime`/`browser.tabs` messaging. All message types live in `lib/messages.ts`.

**Key Components**:

- **Background** (`entrypoints/background.ts`): context menu + action click, `onInstalled` migration, API streaming,
  message routing.
- **Content Script** (`entrypoints/content.ts`): mounts the Vue modal inside a shadow root via `createShadowRootUi`
  (`cssInjectionMode: 'ui'`) lazily on the first `SHOW_MODAL`; feeds runtime messages into the shared store.
- **Modal components** (`components/`): `TranslationModal.vue` shell + `OriginalSection`, `ContextSection`, `CopyButton`;
  reactive `store.ts` singleton holds modal state.
- **Options Page** (`entrypoints/options/`): redesigned settings form (`App.vue`).
- **Shared libs** (`lib/`): `constants.ts`, `i18n.ts` (`t()` wrapper), `settings.ts` (WXT typed storage),
  `messages.ts`, `openai.ts` (streaming translate/context, `checkApiKey`).

All Vue components use `<script setup>` and `<style scoped>`.

**Translation Flow**:

1. User selects text → right-click "Translate via LLM" (or clicks the toolbar action to translate the page selection).
2. Background validates input length against `MAX_INPUT_CHARS`.
3. Background sends `SHOW_MODAL` (streaming state) to the content script.
4. Background streams translation chunks (`TRANSLATION_STREAM`) from the OpenAI streaming API in real time.
5. Additional context (`GET_ADDITIONAL_CONTEXT` → `CONTEXT_STREAM`) provides cultural/linguistic explanations.

**Storage**: Settings use `storage.defineItem` (`lib/settings.ts`). Do not rename keys so users do not lose their settings.

## Commands:

- `npm run dev` / `npm run dev:firefox`: WXT dev with HMR (user runs manually).
- `npm run build` / `npm run build:firefox`: production build into `.output/`.
- `npm run zip` / `npm run zip:firefox`: store-ready zips.
- `npm run lint:types`: `wxt prepare && vue-tsc --noEmit`.
- `npm run lint:code`: Biome linting (`lint:code-fix` to autofix, `format` to format).

## Internationalization

All user-facing strings must be added to `public/_locales/en/messages.json` (+ `de/`) and accessed via `t()`
(`lib/i18n.ts`, a thin wrapper over `browser.i18n.getMessage`). Never hardcode strings. German translations use the
informal (Du) form. Placeholder substitutions use the `$N$` / `$1` content format.

## Key Technical Details

- **Input Validation**: combined system prompt + user text is checked against `MAX_INPUT_CHARS` (`lib/openai.ts`);
  completions are capped at `MAX_OUTPUT_TOKENS`.
- **Models**: static `SUPPORTED_MODELS` in `lib/constants.ts`; `reasoning_effort` is sent on every request.
- **Streaming lifecycle**: one `AbortController` per tab in the background; a new request, an `ABORT_REQUEST` message
  (modal close), or 60s without data aborts the stream. Stream messages carry a `requestId` the store filters on.
- **UI**: collapsible original text, streaming display with loading/caret states, additional-context button (hidden
  after it's requested), minimize/restore, copy-to-clipboard, Escape/overlay close. Modal is shadow-DOM isolated.
- **Security**: anti-prompt-injection + no-refusal instructions in the system prompts (kept verbatim in `lib/openai.ts`).
  API key stored via the storage API.
