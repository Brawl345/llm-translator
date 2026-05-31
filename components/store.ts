import { reactive } from 'vue';
import { browser } from 'wxt/browser';
import type {
  ContentMessage,
  GetAdditionalContextMessage,
} from '../lib/messages';

interface ModalState {
  visible: boolean;
  minimized: boolean;
  originalText: string;
  translation: string;
  isStreaming: boolean;
  hasTranslation: boolean;
  error: string | null;

  contextRequested: boolean;
  isContextStreaming: boolean;
  contextText: string;
  contextDone: boolean;
}

function initialState(): ModalState {
  return {
    visible: false,
    minimized: false,
    originalText: '',
    translation: '',
    isStreaming: false,
    hasTranslation: false,
    error: null,
    contextRequested: false,
    isContextStreaming: false,
    contextText: '',
    contextDone: false,
  };
}

// Module-level singleton shared between the content-script entrypoint (which
// feeds it runtime messages) and the mounted Vue modal (which renders it).
export const state = reactive<ModalState>(initialState());

function resetContent(): void {
  Object.assign(state, initialState());
}

export function close(): void {
  resetContent();
}

export function minimize(): void {
  state.minimized = true;
}

export function restore(): void {
  state.minimized = false;
}

export async function requestContext(): Promise<void> {
  if (!state.hasTranslation || state.isContextStreaming) return;

  state.contextRequested = true;
  state.isContextStreaming = true;
  state.contextDone = false;
  state.contextText = '';

  const message: GetAdditionalContextMessage = {
    type: 'GET_ADDITIONAL_CONTEXT',
    payload: {
      originalText: state.originalText,
      translatedText: state.translation,
    },
  };
  await browser.runtime.sendMessage(message);
}

export function handleMessage(message: ContentMessage): void {
  switch (message.type) {
    case 'SHOW_MODAL': {
      const { originalText, error, isStreaming } = message.payload;
      resetContent();
      state.visible = true;
      state.originalText = originalText;
      state.isStreaming = isStreaming ?? false;
      state.error = error ? error.message : null;
      break;
    }
    case 'TRANSLATION_STREAM': {
      const { chunk, isComplete } = message.payload;
      if (isComplete) {
        state.isStreaming = false;
        state.hasTranslation = true;
      } else {
        state.translation += chunk;
      }
      break;
    }
    case 'CONTEXT_STREAM': {
      const { chunk, isComplete, error } = message.payload;
      if (error) {
        state.isContextStreaming = false;
        state.contextDone = true;
        state.contextText = error.message;
        break;
      }
      if (isComplete) {
        state.isContextStreaming = false;
        state.contextDone = true;
      } else {
        state.contextText += chunk;
      }
      break;
    }
  }
}
