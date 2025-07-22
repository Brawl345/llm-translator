export interface Settings {
    apiKey: string;
    model: string;
}

export interface TranslationRequest {
    text: string;
    targetLanguage?: string;
}

export interface TranslationResponse {
    translatedText: string;
    originalText: string;
    model: string;
}

export interface TranslationError {
    message: string;
    code?: string;
}

export type MessageType = 
    | 'TRANSLATE_TEXT'
    | 'TRANSLATION_SUCCESS'
    | 'TRANSLATION_ERROR'
    | 'TRANSLATION_STREAM'
    | 'GET_ADDITIONAL_CONTEXT'
    | 'CONTEXT_SUCCESS'
    | 'CONTEXT_ERROR'
    | 'CONTEXT_STREAM'
    | 'SHOW_MODAL'
    | 'HIDE_MODAL';

export interface Message {
    type: MessageType;
    payload?: unknown;
}

export interface TranslateTextMessage extends Message {
    type: 'TRANSLATE_TEXT';
    payload: TranslationRequest;
}

export interface TranslationSuccessMessage extends Message {
    type: 'TRANSLATION_SUCCESS';
    payload: TranslationResponse;
}

export interface TranslationErrorMessage extends Message {
    type: 'TRANSLATION_ERROR';
    payload: TranslationError;
}

export interface TranslationStreamMessage extends Message {
    type: 'TRANSLATION_STREAM';
    payload: {
        originalText: string;
        chunk: string;
        isComplete: boolean;
    };
}

export interface GetAdditionalContextMessage extends Message {
    type: 'GET_ADDITIONAL_CONTEXT';
    payload: {
        originalText: string;
        translatedText: string;
    };
}

export interface ContextSuccessMessage extends Message {
    type: 'CONTEXT_SUCCESS';
    payload: {
        originalText: string;
        contextText: string;
    };
}

export interface ContextErrorMessage extends Message {
    type: 'CONTEXT_ERROR';
    payload: {
        originalText: string;
        error: TranslationError;
    };
}

export interface ContextStreamMessage extends Message {
    type: 'CONTEXT_STREAM';
    payload: {
        originalText: string;
        chunk: string;
        isComplete: boolean;
    };
}

export interface ShowModalMessage extends Message {
    type: 'SHOW_MODAL';
    payload: {
        originalText: string;
        translatedText?: string;
        loading?: boolean;
        error?: TranslationError;
        isStreaming?: boolean;
    };
}