import type {
    ContextErrorMessage,
    ContextStreamMessage,
    ContextSuccessMessage,
    GetAdditionalContextMessage,
    ShowModalMessage,
    TranslationError,
    TranslationStreamMessage
} from '../shared/types.js';

class TranslationModal {
    private modalContainer: HTMLElement | null = null;
    private shadowRoot: ShadowRoot | null = null;
    private isVisible = false;
    private currentTranslation = '';
    private isStreaming = false;
    private currentOriginalText = '';
    private hasTranslation = false;
    private isContextStreaming = false;
    private currentContext = '';

    constructor() {
        this.createModal();
        this.setupMessageListener();
    }

    private createModal(): void {
        if (this.modalContainer) return;

        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'llm-translator-modal-container';

        this.shadowRoot = this.modalContainer.attachShadow({mode: 'closed'});

        const modal = document.createElement('div');
        modal.id = 'llm-translator-modal';
        modal.innerHTML = `
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
                                <h4 id="context-heading" style="display: none;">${chrome.i18n.getMessage('additionalContextLabel')}</h4>
                                <button class="llm-context-button" id="get-context-btn">${chrome.i18n.getMessage('additionalContextButton')}</button>
                            </div>
                            <div class="llm-text-content" id="context-text" style="display: none;">
                            </div>
                        </div>
                    </div>
                    <div class="llm-modal-footer">
                        <small>${chrome.i18n.getMessage('disclaimerText')}</small>
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
        this.shadowRoot.appendChild(modal);
        document.body.appendChild(this.modalContainer);

        const closeButton = modal.querySelector('.llm-modal-close') as HTMLElement;
        const overlay = modal.querySelector('.llm-modal-overlay') as HTMLElement;
        const contextButton = modal.querySelector('#get-context-btn') as HTMLElement;

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
        if (!this.shadowRoot) return;

        const styles = document.createElement('style');
        styles.textContent = `
            :host {
                all: initial;
            }
            
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
                display: flex;
                flex-direction: column;
            }

            @media (prefers-color-scheme: dark) {
                .llm-modal-container {
                    background: #1a202c;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                }
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
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
                background: #f8fafc;
                flex-shrink: 0;
            }

            @media (prefers-color-scheme: dark) {
                .llm-modal-header {
                    background: #2d3748;
                    border-bottom: 1px solid #4a5568;
                }
            }

            .llm-modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #1a202c;
            }

            @media (prefers-color-scheme: dark) {
                .llm-modal-header h3 {
                    color: #f7fafc;
                }
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

            @media (prefers-color-scheme: dark) {
                .llm-modal-close {
                    color: #a0aec0;
                }
                
                .llm-modal-close:hover {
                    background: #4a5568;
                    color: #f7fafc;
                }
            }

            .llm-modal-content {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
                min-height: 0;
            }

            .llm-modal-footer {
                padding: 12px 20px;
                border-top: 1px solid #e2e8f0;
                background: #f8fafc;
                text-align: center;
                flex-shrink: 0;
            }

            @media (prefers-color-scheme: dark) {
                .llm-modal-footer {
                    background: #2d3748;
                    border-top: 1px solid #4a5568;
                }
            }

            .llm-modal-footer small {
                color: #718096;
                font-size: 12px;
                margin: 0;
            }

            @media (prefers-color-scheme: dark) {
                .llm-modal-footer small {
                    color: #a0aec0;
                }
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

            @media (prefers-color-scheme: dark) {
                .llm-text-section h4 {
                    color: #e2e8f0;
                }
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

            @media (prefers-color-scheme: dark) {
                .llm-original-details summary {
                    color: #e2e8f0;
                }
                
                .llm-original-details summary:hover {
                    color: #f7fafc;
                }
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

            @media (prefers-color-scheme: dark) {
                .llm-text-content {
                    background: #2d3748;
                    border: 1px solid #4a5568;
                    color: #f7fafc;
                }
            }

            .llm-loading {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #718096;
                font-style: italic;
            }

            @media (prefers-color-scheme: dark) {
                .llm-loading {
                    color: #a0aec0;
                }
            }

            .llm-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #e2e8f0;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                animation: llm-spin 1s linear infinite;
            }

            @media (prefers-color-scheme: dark) {
                .llm-spinner {
                    border: 2px solid #4a5568;
                    border-top: 2px solid #667eea;
                }
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

            @media (prefers-color-scheme: dark) {
                .llm-context-section {
                    border-top: 1px solid #4a5568;
                }
            }

            .llm-context-header {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                margin-bottom: 12px;
            }

            .llm-context-header h4 {
                margin: 0;
                margin-right: auto;
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
                .llm-modal-content,
                .llm-modal-footer {
                    padding: 16px;
                }
            }
        `;

        this.shadowRoot.appendChild(styles);
    }

    private setupMessageListener(): void {
        chrome.runtime.onMessage.addListener((message: ShowModalMessage | TranslationStreamMessage | ContextSuccessMessage | ContextErrorMessage | ContextStreamMessage) => {
            if (message.type === 'SHOW_MODAL') {
                this.show((message as ShowModalMessage).payload);
            } else if (message.type === 'TRANSLATION_STREAM') {
                this.handleStreamChunk((message as TranslationStreamMessage).payload);
            } else if (message.type === 'CONTEXT_SUCCESS') {
                this.handleContextSuccess((message as ContextSuccessMessage).payload);
            } else if (message.type === 'CONTEXT_ERROR') {
                this.handleContextError((message as ContextErrorMessage).payload);
            } else if (message.type === 'CONTEXT_STREAM') {
                this.handleContextStreamChunk((message as ContextStreamMessage).payload);
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
        if (!this.shadowRoot || !this.modalContainer) return;

        const modal = this.shadowRoot.querySelector('#llm-translator-modal') as HTMLElement;
        const originalTextEl = this.shadowRoot.querySelector('#original-text') as HTMLElement;
        const translatedTextEl = this.shadowRoot.querySelector('#translated-text') as HTMLElement;
        const contextSection = this.shadowRoot.querySelector('.llm-context-section') as HTMLElement;

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

        modal.style.display = 'block';
        this.isVisible = true;

        setTimeout(() => {
            const container = this.shadowRoot?.querySelector('.llm-modal-container') as HTMLElement;
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
        if (!this.shadowRoot || !this.isStreaming) return;

        const translatedTextEl = this.shadowRoot.querySelector('#translated-text') as HTMLElement;

        if (payload.isComplete) {
            this.isStreaming = false;
            this.hasTranslation = true;
            // Final update with complete text
            translatedTextEl.textContent = this.currentTranslation;
            // Show context section when streaming is complete
            const contextSection = this.shadowRoot.querySelector('.llm-context-section') as HTMLElement;
            contextSection.style.display = 'block';
        } else {
            // Append the new chunk
            this.currentTranslation += payload.chunk;
            translatedTextEl.textContent = this.currentTranslation;
        }
    }

    private requestAdditionalContext(): void {
        if (!this.hasTranslation || !this.currentOriginalText || !this.currentTranslation || !this.shadowRoot) return;

        const contextButton = this.shadowRoot.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextTextEl = this.shadowRoot.querySelector('#context-text') as HTMLElement;
        const contextHeading = this.shadowRoot.querySelector('#context-heading') as HTMLElement;

        if (!contextButton || !contextTextEl || !contextHeading) return;

        // Initialize context streaming
        this.isContextStreaming = true;
        this.currentContext = '';

        // Disable button and show loading state
        contextButton.disabled = true;
        contextButton.textContent = chrome.i18n.getMessage('gettingContextStatus');
        
        // Show the context heading and area with loading
        contextHeading.style.display = 'block';
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

    private handleContextStreamChunk(payload: {
        originalText: string;
        chunk: string;
        isComplete: boolean;
    }): void {
        if (!this.shadowRoot || !this.isContextStreaming || payload.originalText !== this.currentOriginalText) return;

        const contextTextEl = this.shadowRoot.querySelector('#context-text') as HTMLElement;
        const contextButton = this.shadowRoot.querySelector('#get-context-btn') as HTMLButtonElement;

        if (!contextTextEl || !contextButton) return;

        if (payload.isComplete) {
            this.isContextStreaming = false;
            // Remove button since context is now complete
            contextButton.style.display = 'none';
            // Final update with complete text
            contextTextEl.textContent = this.currentContext;
        } else {
            // Append the new chunk
            this.currentContext += payload.chunk;
            contextTextEl.textContent = this.currentContext;
        }
    }

    private handleContextSuccess(payload: { originalText: string; contextText: string }): void {
        if (!this.shadowRoot || payload.originalText !== this.currentOriginalText) return;

        const contextButton = this.shadowRoot.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextTextEl = this.shadowRoot.querySelector('#context-text') as HTMLElement;
        const contextHeading = this.shadowRoot.querySelector('#context-heading') as HTMLElement;

        if (!contextButton || !contextTextEl || !contextHeading) return;

        // Restore button
        contextButton.disabled = false;
        contextButton.textContent = chrome.i18n.getMessage('additionalContextButton');

        // Show context heading and text
        contextHeading.style.display = 'block';
        contextTextEl.style.display = 'block';
        contextTextEl.textContent = payload.contextText;
    }

    private handleContextError(payload: { originalText: string; error: TranslationError }): void {
        if (!this.shadowRoot || payload.originalText !== this.currentOriginalText) return;

        const contextButton = this.shadowRoot.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextTextEl = this.shadowRoot.querySelector('#context-text') as HTMLElement;
        const contextHeading = this.shadowRoot.querySelector('#context-heading') as HTMLElement;

        if (!contextButton || !contextTextEl || !contextHeading) return;

        // Reset streaming state
        this.isContextStreaming = false;
        this.currentContext = '';

        // Restore button
        contextButton.disabled = false;
        contextButton.textContent = chrome.i18n.getMessage('additionalContextButton');

        // Show context heading and error
        contextHeading.style.display = 'block';
        contextTextEl.style.display = 'block';
        contextTextEl.innerHTML = `
            <div class="llm-error">
                ${payload.error.message}
            </div>
        `;
    }

    private hide(): void {
        if (!this.shadowRoot) return;

        const modal = this.shadowRoot.querySelector('#llm-translator-modal') as HTMLElement;
        if (!modal) return;

        modal.style.display = 'none';
        this.isVisible = false;
        this.hasTranslation = false;
        this.currentOriginalText = '';
        this.currentTranslation = '';
        this.isContextStreaming = false;
        this.currentContext = '';

        // Reset context section
        const contextSection = this.shadowRoot.querySelector('.llm-context-section') as HTMLElement;
        const contextTextEl = this.shadowRoot.querySelector('#context-text') as HTMLElement;
        const contextButton = this.shadowRoot.querySelector('#get-context-btn') as HTMLButtonElement;
        const contextHeading = this.shadowRoot.querySelector('#context-heading') as HTMLElement;
        
        contextSection.style.display = 'none';
        contextHeading.style.display = 'none';
        contextTextEl.style.display = 'none';
        contextTextEl.textContent = '';
        contextButton.disabled = false;
        contextButton.style.display = 'inline-block';
        contextButton.textContent = chrome.i18n.getMessage('additionalContextButton');
    }
}

if (typeof window !== 'undefined' && !window.location.href.includes('chrome-extension://')) {
    new TranslationModal();
}