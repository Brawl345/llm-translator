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

export interface ShowModalMessage extends Message {
    type: 'SHOW_MODAL';
    payload: {
        originalText: string;
        translatedText?: string;
        loading?: boolean;
        error?: TranslationError;
    };
}