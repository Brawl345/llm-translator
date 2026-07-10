import { reactive } from 'vue';
import { browser } from 'wxt/browser';
import type {
  AbortRequestMessage,
  ContentMessage,
  GetAdditionalContextMessage,
} from '../lib/messages';

interface ModalState {
  requestId: number | null;
  visible: boolean;
  minimized: boolean;
  originalText: string;
  model: string;
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
    requestId: null,
    visible: false,
    minimized: false,
    originalText: '',
    model: '',
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
  const message: AbortRequestMessage = { type: 'ABORT_REQUEST' };
  browser.runtime.sendMessage(message).catch(() => {});
  resetContent();
}

export function minimize(): void {
  state.minimized = true;
}

export function restore(): void {
  state.minimized = false;
}

export async function requestContext(): Promise<void> {
  if (
    !state.hasTranslation ||
    state.isContextStreaming ||
    state.requestId === null
  ) {
    return;
  }

  state.contextRequested = true;
  state.isContextStreaming = true;
  state.contextDone = false;
  state.contextText = '';

  const message: GetAdditionalContextMessage = {
    type: 'GET_ADDITIONAL_CONTEXT',
    payload: {
      requestId: state.requestId,
      originalText: state.originalText,
      translatedText: state.translation,
    },
  };
  await browser.runtime.sendMessage(message);
}

export function handleMessage(message: ContentMessage): void {
  switch (message.type) {
    case 'SHOW_MODAL': {
      const { requestId, originalText, model, error, isStreaming } =
        message.payload;
      resetContent();
      state.requestId = requestId;
      state.visible = true;
      state.originalText = originalText;
      state.model = model ?? '';
      state.isStreaming = isStreaming ?? false;
      state.error = error ? error.message : null;
      break;
    }
    case 'TRANSLATION_STREAM': {
      const { requestId, chunk, isComplete } = message.payload;
      if (requestId !== state.requestId) break;
      if (isComplete) {
        state.isStreaming = false;
        state.hasTranslation = true;
      } else {
        state.translation += chunk;
      }
      break;
    }
    case 'CONTEXT_STREAM': {
      const { requestId, chunk, isComplete, error } = message.payload;
      if (requestId !== state.requestId) break;
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
