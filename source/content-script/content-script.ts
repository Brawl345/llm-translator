import type { 
    ShowModalMessage, 
    TranslationStreamMessage, 
    ContextSuccessMessage,
    ContextErrorMessage,
    GetAdditionalContextMessage,
    TranslationError 
} from '../shared/types.js';

class TranslationModal {
    private modal: HTMLElement | null = null;
    private isVisible = false;
    private currentTranslation = '';
    private isStreaming = false;
    private currentOriginalText = '';
    private hasTranslation = false;

    constructor() {
        this.createModal();
        this.setupMessageListener();
    }

    private createModal(): void {
        if (this.modal) return;

        this.modal = document.createElement('div');
        this.modal.id = 'llm-translator-modal';
        this.modal.innerHTML = `
            <div class="llm-modal-overlay">
                <div class="llm-modal-container">
                    <div class="llm-modal-header">
                        <h3>${chrome.i18n.getMessage('modalTitle')}</h3>
                        <button class="llm-modal-close" aria-label="${chrome.i18n.getMessage('closeButtonLabel')}">&times;</button>
                    </div>
                    <div class="llm-modal-content">
                        <div class="llm-text-section">
                            <details class="llm-original-details">
                                <summary>${chrome.i18n.getMessage('originalTextLabel')}</summary>
                                <div class="llm-text-content" id="original-text"></div>
                            </details>
                        </div>
                        <div class="llm-text-section">
                            <h4>${chrome.i18n.getMessage('translationLabel')}</h4>
                            <div class="llm-text-content" id="translated-text">
                                <div class="llm-loading">
                                    <div class="llm-spinner"></div>
                                    <span>${chrome.i18n.getMessage('translatingStatus')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="llm-text-section llm-context-section" style="display: none;">
                            <div class="llm-context-header">
                                <h4>${chrome.i18n.getMessage('additionalContextLabel')}</h4>
                                <button class="llm-context-button" id="get-context-btn">${chrome.i18n.getMessage('additionalContextButton')}</button>
                            </div>
                            <div class="llm-text-content" id="context-text" style="display: none;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
        document.body.appendChild(this.modal);

        const closeButton = this.modal.querySelector('.llm-modal-close') as HTMLElement;
        const overlay = this.modal.querySelector('.llm-modal-overlay') as HTMLElement;
        const contextButton = this.modal.querySelector('#get-context-btn') as HTMLElement;

        closeButton.addEventListener('click', () => this.hide());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
            }
        });

        contextButton.addEventListener('click', () => this.requestAdditionalContext());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    private injectStyles(): void {
        if (document.getElementById('llm-translator-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'llm-translator-styles';
        styles.textContent = `
            #llm-translator-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: none;
            }

            .llm-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            }

            .llm-modal-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow: hidden;
                animation: llm-modal-appear 0.2s ease-out;
            }

            @keyframes llm-modal-appear {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .llm-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                border-bottom: 1px solid #e2e8f0;
                background: #f8fafc;
            }

            .llm-modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #1a202c;
            }

            .llm-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #718096;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .llm-modal-close:hover {
                background: #e2e8f0;
                color: #2d3748;
            }

            .llm-modal-content {
                padding: 20px;
                max-height: calc(80vh - 100px);
                overflow-y: auto;
            }

            .llm-text-section {
                margin-bottom: 24px;
            }

            .llm-text-section:last-child {
                margin-bottom: 0;
            }

            .llm-text-section h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                color: #4a5568;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .llm-original-details {
                margin-bottom: 0;
            }

            .llm-original-details[open] {
                margin-bottom: 12px;
            }

            .llm-original-details summary {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #4a5568;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                cursor: pointer;
                user-select: none;
                padding: 4px 0;
                border-radius: 4px;
                transition: color 0.2s;
            }

            .llm-original-details summary:hover {
                color: #2d3748;
            }

            .llm-original-details summary::-webkit-details-marker {
                color: #667eea;
            }

            .llm-original-details[open] summary {
                margin-bottom: 12px;
            }

            .llm-text-content {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                font-size: 15px;
                line-height: 1.6;
                color: #2d3748;
                white-space: pre-wrap;
                word-break: break-word;
                min-height: 60px;
            }

            .llm-loading {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #718096;
                font-style: italic;
            }

            .llm-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #e2e8f0;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                animation: llm-spin 1s linear infinite;
            }

            @keyframes llm-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .llm-error {
                color: #e53e3e;
                font-style: italic;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .llm-error::before {
                content: "⚠";
                font-style: normal;
            }

            .llm-context-section {
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
            }

            .llm-context-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }

            .llm-context-header h4 {
                margin: 0;
            }

            .llm-context-button {
                background: #667eea;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .llm-context-button:hover:not(:disabled) {
                background: #5a67d8;
                transform: translateY(-1px);
            }

            .llm-context-button:active {
                transform: translateY(0);
            }

            .llm-context-button:disabled {
                background: #a0aec0;
                cursor: not-allowed;
                transform: none;
            }

            @media (max-width: 640px) {
                .llm-modal-overlay {
                    padding: 10px;
                }
                
                .llm-modal-container {
                    max-height: 90vh;
                }
                
                .llm-modal-header,
                .llm-modal-content {
                    padding: 16px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    private setupMessageListener(): void {
        chrome.runtime.onMessage.addListener((message: ShowModalMessage | TranslationStreamMessage | ContextSuccessMessage | ContextErrorMessage) => {
            if (message.type === 'SHOW_MODAL') {
                this.show((message as ShowModalMessage).payload);
            } else if (message.type === 'TRANSLATION_STREAM') {
                this.handleStreamChunk((message as TranslationStreamMessage).payload);
            } else if (message.type === 'CONTEXT_SUCCESS') {
                this.handleContextSuccess((message as ContextSuccessMessage).payload);
            } else if (message.type === 'CONTEXT_ERROR') {
                this.handleContextError((message as ContextErrorMessage).payload);
            }
        });
    }

    private show(payload: {
        originalText: string;
        translatedText?: string;
        loading?: boolean;
        error?: TranslationError;
        isStreaming?: boolean;
    }): void {
        if (!this.modal) return;

        const originalTextEl = this.modal.querySelector('#original-text') as HTMLElement;
        const translatedTextEl = this.modal.querySelector('#translated-text') as HTMLElement;
        const contextSection = this.modal.querySelector('.llm-context-section') as HTMLElement;

        originalTextEl.textContent = payload.originalText;
        this.currentOriginalText = payload.originalText;

        if (payload.isStreaming) {
            this.isStreaming = true;
            this.currentTranslation = '';
            translatedTextEl.innerHTML = `
                <div class="llm-loading">
                    <div class="llm-spinner"></div>
                    <span>${chrome.i18n.getMessage('translatingStatus')}</span>
                </div>
            `;
        } else if (payload.loading) {
            translatedTextEl.innerHTML = `
                <div class="llm-loading">
                    <div class="llm-spinner"></div>
                    <span>${chrome.i18n.getMessage('translatingStatus')}</span>
                </div>
            `;
        } else if (payload.error) {
            this.isStreaming = false;
            translatedTextEl.innerHTML = `
                <div class="llm-error">
                    ${payload.error.message}
                </div>
            `;
        } else if (payload.translatedText) {
            this.isStreaming = false;
            this.currentTranslation = payload.translatedText;
            this.hasTranslation = true;
            translatedTextEl.textContent = payload.translatedText;
            contextSection.style.display = 'block';
        }

        this.modal.style.display = 'block';
        this.isVisible = true;

        setTimeout(() => {
            const container = this.modal?.querySelector('.llm-modal-container') as HTMLElement;
            if (container) {
                container.focus();
            }
        }, 100);
    }

    private handleStreamChunk(payload: {
        originalText: string;
        chunk: string;
        isComplete: boolean;
    }): void {
        if (!this.modal || !this.isStreaming) return;

        const translatedTextEl = this.modal.querySelector('#translated-text') as HTMLElement;

        if (payload.isComplete) {
            this.isStreaming = false;
            this.hasTranslation = true;
            // Final update with complete text
            translatedTextEl.textContent = this.currentTranslation;
            // Show context section when streaming is complete
            const contextSection = this.modal.querySelector('.llm-context-section') as HTMLElement;
            contextSection.style.display = 'block';
        } else {
            // Append the new chunk
            this.currentTranslation += payload.chunk;
            translatedTextEl.textContent = this.currentTranslation;
        }
    }

    private requestAdditionalContext(): void {
        if (!this.hasTranslation || !this.currentOriginalText || !this.currentTranslation) return;

        const contextButton = this.modal?.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextTextEl = this.modal?.querySelector('#context-text') as HTMLElement;

        if (!contextButton || !contextTextEl) return;

        // Disable button and show loading state
        contextButton.disabled = true;
        contextButton.textContent = chrome.i18n.getMessage('gettingContextStatus');
        
        // Show the context area with loading
        contextTextEl.style.display = 'block';
        contextTextEl.innerHTML = `
            <div class="llm-loading">
                <div class="llm-spinner"></div>
                <span>${chrome.i18n.getMessage('gettingContextStatus')}</span>
            </div>
        `;

        // Send message to service worker
        const message: GetAdditionalContextMessage = {
            type: 'GET_ADDITIONAL_CONTEXT',
            payload: {
                originalText: this.currentOriginalText,
                translatedText: this.currentTranslation
            }
        };

        chrome.runtime.sendMessage(message);
    }

    private handleContextSuccess(payload: { originalText: string; contextText: string }): void {
        if (!this.modal || payload.originalText !== this.currentOriginalText) return;

        const contextButton = this.modal.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextTextEl = this.modal.querySelector('#context-text') as HTMLElement;

        if (!contextButton || !contextTextEl) return;

        // Restore button
        contextButton.disabled = false;
        contextButton.textContent = chrome.i18n.getMessage('additionalContextButton');

        // Show context
        contextTextEl.textContent = payload.contextText;
    }

    private handleContextError(payload: { originalText: string; error: TranslationError }): void {
        if (!this.modal || payload.originalText !== this.currentOriginalText) return;

        const contextButton = this.modal.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextTextEl = this.modal.querySelector('#context-text') as HTMLElement;

        if (!contextButton || !contextTextEl) return;

        // Restore button
        contextButton.disabled = false;
        contextButton.textContent = chrome.i18n.getMessage('additionalContextButton');

        // Show error
        contextTextEl.innerHTML = `
            <div class="llm-error">
                ${payload.error.message}
            </div>
        `;
    }

    private hide(): void {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        this.isVisible = false;
        this.hasTranslation = false;
        this.currentOriginalText = '';
        this.currentTranslation = '';

        // Reset context section
        const contextSection = this.modal.querySelector('.llm-context-section') as HTMLElement;
        const contextTextEl = this.modal.querySelector('#context-text') as HTMLElement;
        const contextButton = this.modal.querySelector('#get-context-btn') as HTMLButtonElement;
        
        contextSection.style.display = 'none';
        contextTextEl.style.display = 'none';
        contextTextEl.textContent = '';
        contextButton.disabled = false;
        contextButton.textContent = chrome.i18n.getMessage('additionalContextButton');
    }
}

if (typeof window !== 'undefined' && !window.location.href.includes('chrome-extension://')) {
    new TranslationModal();
}