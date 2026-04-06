# LLM Guidance

This file provides guidance to LLMs when working with code in this repository.

## Overview

Chrome/Firefox web extension that provides context menu translation using OpenAI's API. Features streaming responses,
additional cultural context, and comprehensive internationalization. Code is written in TypeScript, linted with Biome,
and built with ESBuild.

## Architecture

**Message-Driven System**: Extension uses Chrome runtime messaging for communication between service worker, content
script, and options page. All message types and interfaces are defined in `source/shared/types.ts`.

**Key Components**:

- **Service Worker** (`source/service-worker/`): Handles context menu, API calls, streaming responses, input validation,
  and message routing
- **Content Script** (`source/content-script/`): Manages translation modal UI, handles streaming updates, and user
  interactions
- **Options Page** (`source/options/`): Settings management, API key configuration, and model selection
- **Shared Types** (`source/shared/types.ts`): TypeScript interfaces for all message passing and data structures

**Translation Flow**:

1. User selects text → right-click → "Translate via LLM"
2. Service worker validates input length against model context limits
3. Opens modal via content script with streaming loading state
4. Streams translation chunks in real-time using OpenAI streaming API
5. Additional context feature allows cultural/linguistic explanations

**Streaming Architecture**: Both translation and additional context use server-sent event streaming with chunk-based
updates. Content script handles real-time display updates while service worker manages stream parsing.

## Release Process

1. **Determine the next version**: Check `git tag | sort -V | tail -1` for the latest tag and increment accordingly (patch = bugfix, minor = new feature).
2. **Update `public/manifest.json`**: Set `"version"` to the new version number.
3. **Run `npm run release`**: Syncs `package.json`, builds `.crx` and `.xpi` into `output/`, updates `updates.json` and `updates.xml`.
4. **Commit**: Stage and commit `public/manifest.json`, `package.json`, `updates.json`, `updates.xml`, and all changed source files. Use `"$VERSION: <short summary>"` as the commit message.
5. **Tag and push**: Create an annotated tag with the same bullet points as the release notes, then push — ignore rejections for already-existing old tags:
   ```bash
   git tag -a $VERSION -m "$VERSION: <bullet points of changes>" && git push && git push origin $VERSION
   ```
6. **Create GitHub release** using `gh`:
   ```bash
   gh release create $VERSION \
     output/llm-translator-$VERSION.crx \
     output/llm-translator-$VERSION.xpi \
     --title "$VERSION" \
     --notes "<bullet points of changes>"
   ```

- `npm run build`: Production build (always use this, never `npm run dev`)
- `npm run lint:types`: TypeScript type checking
- `npm run lint:code`: Biome code linting
- `npm run web-ext:build`: Build extension package
- `npm run start:chrome` / `npm run start:firefox`: Launch in browser (user runs manually)

## Internationalization

All user-facing strings must be added to `public/_locales/en/messages.json` and accessed via `chrome.i18n.getMessage()`.
Never hardcode strings. German translations use informal (Du) form. HTML placeholder keys use double-underscore format (
`__keyName__`) for programmatic replacement.

## Key Technical Details

**Input Validation**: Text length validation prevents API errors by checking combined system prompt + user text against
model context limits (4 chars/token estimation).

**Model Support**: Dynamic model fetching with dropdown preservation during re-fetch. Filter out certain legacy and
image/audio/tts/search/etc. models

**UI Features**:

- Collapsible original text section
- Streaming response display with loading states
- Additional context button (hidden after successful completion)
- Fixed header/footer layout with scrollable content area

**Error Handling**: Comprehensive error states for API failures, network issues, and input validation with user-friendly
messages.

**Security**: Anti-prompt injection measures in system prompts. API keys stored securely via Chrome storage API.
