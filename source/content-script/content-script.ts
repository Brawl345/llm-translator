import type { ShowModalMessage, TranslationStreamMessage, TranslationError } from '../shared/types.js';

class TranslationModal {
    private modal: HTMLElement | null = null;
    private isVisible = false;
    private currentTranslation = '';
    private isStreaming = false;

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
                            <h4>${chrome.i18n.getMessage('originalTextLabel')}</h4>
                            <div class="llm-text-content" id="original-text"></div>
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
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
        document.body.appendChild(this.modal);

        const closeButton = this.modal.querySelector('.llm-modal-close') as HTMLElement;
        const overlay = this.modal.querySelector('.llm-modal-overlay') as HTMLElement;

        closeButton.addEventListener('click', () => this.hide());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
            }
        });

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
        chrome.runtime.onMessage.addListener((message: ShowModalMessage | TranslationStreamMessage) => {
            if (message.type === 'SHOW_MODAL') {
                this.show((message as ShowModalMessage).payload);
            } else if (message.type === 'TRANSLATION_STREAM') {
                this.handleStreamChunk((message as TranslationStreamMessage).payload);
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

        originalTextEl.textContent = payload.originalText;

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
            translatedTextEl.textContent = payload.translatedText;
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
            // Final update with complete text
            translatedTextEl.textContent = this.currentTranslation;
        } else {
            // Append the new chunk
            this.currentTranslation += payload.chunk;
            translatedTextEl.textContent = this.currentTranslation;
        }
    }

    private hide(): void {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        this.isVisible = false;
    }
}

if (typeof window !== 'undefined' && !window.location.href.includes('chrome-extension://')) {
    new TranslationModal();
}