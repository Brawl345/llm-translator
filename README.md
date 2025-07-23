# LLM Translator

LLM Translator is a WebExtension that provides instant translation of selected text using OpenAI's language models. Simply select text on any webpage, right-click, and get a streaming translation with optional cultural context.

Completely coded by [Claude Code](https://www.anthropic.com/claude-code).

## Features

- **Supports all languages**: Choose a target language or specify one yourself
- **Context Menu Translation**: Right-click selected text to translate instantly
- **Streaming Responses**: Real-time translation updates as the AI generates text
- **Additional Context**: Get cultural explanations for idioms, slang, and cultural references
- **Model Flexibility**: Support for various OpenAI models (GPT-4, GPT-4o, etc.)

## Setup

1. Install the extension from the releases section
2. Check the extension options and configure your OpenAI API key. Make sure the key has "read" access to the "models" and "write" access to the "completions" endpoints
3. Select a model from the dropdown (fetched dynamically from your OpenAI account)
4. Select any text on a webpage, right-click, and choose "Translate via LLM"

## Build

1. Clone the repository
2. Install dependencies with `npm ci`
3. Run `npm run build` for production bundling
4. Run `npm run start:firefox` or `npm run start:chrome` for starting the browser with the extension pre-loaded and ready for debugging
5. Build extension packages with `npm run release` or a ZIP with `npm run web-ext:build`

## Development

- `npm run build`: Production build
- `npm run lint:types`: TypeScript type checking
- `npm run lint:code`: Biome code linting


## Privacy

- API keys are stored securely in Chrome's local storage
- Only selected text and necessary prompts are sent to OpenAI
- No tracking, analytics, or data collection
- Translation requests are made directly from your browser to OpenAI's API
