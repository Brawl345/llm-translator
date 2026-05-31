export interface TranslationError {
  message: string;
}

export interface ShowModalMessage {
  type: 'SHOW_MODAL';
  payload: {
    originalText: string;
    translatedText?: string;
    loading?: boolean;
    error?: TranslationError;
    isStreaming?: boolean;
  };
}

export interface TranslationStreamMessage {
  type: 'TRANSLATION_STREAM';
  payload: {
    originalText: string;
    chunk: string;
    isComplete: boolean;
  };
}

export interface ContextStreamMessage {
  type: 'CONTEXT_STREAM';
  payload: {
    originalText: string;
    chunk: string;
    isComplete: boolean;
    error?: TranslationError;
  };
}

export interface GetAdditionalContextMessage {
  type: 'GET_ADDITIONAL_CONTEXT';
  payload: {
    originalText: string;
    translatedText: string;
  };
}

/** Messages the background sends to the content script. */
export type ContentMessage =
  | ShowModalMessage
  | TranslationStreamMessage
  | ContextStreamMessage;

/** Messages the content script sends to the background. */
export type BackgroundMessage = GetAdditionalContextMessage;

export type RuntimeMessage = ContentMessage | BackgroundMessage;
