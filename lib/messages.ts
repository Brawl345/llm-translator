export interface TranslationError {
  message: string;
}

export interface ShowModalMessage {
  type: 'SHOW_MODAL';
  payload: {
    requestId: number;
    originalText: string;
    model?: string;
    error?: TranslationError;
    isStreaming?: boolean;
  };
}

export interface TranslationStreamMessage {
  type: 'TRANSLATION_STREAM';
  payload: {
    requestId: number;
    chunk: string;
    isComplete: boolean;
  };
}

export interface ContextStreamMessage {
  type: 'CONTEXT_STREAM';
  payload: {
    requestId: number;
    chunk: string;
    isComplete: boolean;
    error?: TranslationError;
  };
}

export interface GetAdditionalContextMessage {
  type: 'GET_ADDITIONAL_CONTEXT';
  payload: {
    requestId: number;
    originalText: string;
    translatedText: string;
  };
}

export interface AbortRequestMessage {
  type: 'ABORT_REQUEST';
}

/** Messages the background sends to the content script. */
export type ContentMessage =
  | ShowModalMessage
  | TranslationStreamMessage
  | ContextStreamMessage;

/** Messages the content script sends to the background. */
export type BackgroundMessage =
  | GetAdditionalContextMessage
  | AbortRequestMessage;

export type RuntimeMessage = ContentMessage | BackgroundMessage;
