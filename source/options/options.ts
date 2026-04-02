import type { ReasoningEffort, SupportedModel } from '../shared/types.js';

interface Settings {
    apiKey: string;
    model: SupportedModel;
    reasoningEffort: ReasoningEffort;
    targetLanguage: string;
}

const DEFAULT_MODEL: SupportedModel = 'gpt-5.4';
const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'none';
const SUPPORTED_MODELS: SupportedModel[] = ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'];
const REASONING_EFFORTS: ReasoningEffort[] = ['none', 'low', 'medium', 'high'];

class OptionsPage {
    private form: HTMLFormElement;
    private apiKeyInput: HTMLInputElement;
    private modelSelect: HTMLSelectElement;
    private reasoningEffortSelect: HTMLSelectElement;
    private targetLanguageSelect: HTMLSelectElement;
    private customTargetLanguageInput: HTMLInputElement;
    private customLanguageField: HTMLElement;
    private checkApiKeyButton: HTMLButtonElement;
    private saveButton: HTMLButtonElement;
    private migrationNotice: HTMLElement;
    private statusDiv: HTMLElement;

    constructor() {
        this.form = document.getElementById('settingsForm') as HTMLFormElement;
        this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        this.modelSelect = document.getElementById('model') as HTMLSelectElement;
        this.reasoningEffortSelect = document.getElementById('reasoningEffort') as HTMLSelectElement;
        this.targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement;
        this.customTargetLanguageInput = document.getElementById('customTargetLanguage') as HTMLInputElement;
        this.customLanguageField = document.getElementById('customLanguageField') as HTMLElement;
        this.checkApiKeyButton = document.getElementById('checkApiKeyBtn') as HTMLButtonElement;
        this.saveButton = document.getElementById('saveBtn') as HTMLButtonElement;
        this.migrationNotice = document.getElementById('migrationNotice') as HTMLElement;
        this.statusDiv = document.getElementById('status') as HTMLElement;

        this.localizeUI();
        this.initializeEventListeners();
        void this.loadSettings();
    }

    private localizeUI(): void {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = chrome.i18n.getMessage('settingsTitle');

        const migrationNoticeText = document.getElementById('migrationNoticeText');
        if (migrationNoticeText) migrationNoticeText.textContent = chrome.i18n.getMessage('migrationNotice');

        const apiKeyLabel = document.getElementById('apiKeyLabel');
        if (apiKeyLabel) apiKeyLabel.textContent = chrome.i18n.getMessage('apiKeyLabel');

        this.apiKeyInput.placeholder = chrome.i18n.getMessage('apiKeyPlaceholder');

        const apiKeyDescription = document.getElementById('apiKeyDescription');
        if (apiKeyDescription) {
            apiKeyDescription.innerHTML = `${chrome.i18n.getMessage('apiKeyDescription')} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">${chrome.i18n.getMessage('getApiKeyLink')}</a>`;
        }

        this.checkApiKeyButton.textContent = chrome.i18n.getMessage('checkApiKeyButton');

        const cardModelTitle = document.getElementById('cardModelTitle');
        if (cardModelTitle) cardModelTitle.textContent = chrome.i18n.getMessage('cardModelTitle');

        const modelLabel = document.getElementById('modelLabel');
        if (modelLabel) modelLabel.textContent = chrome.i18n.getMessage('modelLabel');

        for (const option of this.modelSelect.options) {
            option.textContent = option.value;
        }

        const reasoningEffortLabel = document.getElementById('reasoningEffortLabel');
        if (reasoningEffortLabel) reasoningEffortLabel.textContent = chrome.i18n.getMessage('reasoningEffortLabel');

        for (const option of this.reasoningEffortSelect.options) {
            option.textContent = chrome.i18n.getMessage(`reasoningEffort${option.value[0].toUpperCase()}${option.value.slice(1)}`);
        }

        const cardLanguageTitle = document.getElementById('cardLanguageTitle');
        if (cardLanguageTitle) cardLanguageTitle.textContent = chrome.i18n.getMessage('cardLanguageTitle');

        const targetLanguageLabel = document.getElementById('targetLanguageLabel');
        if (targetLanguageLabel) targetLanguageLabel.textContent = chrome.i18n.getMessage('targetLanguageLabel');

        const customTargetLanguageLabel = document.getElementById('customTargetLanguageLabel');
        if (customTargetLanguageLabel) customTargetLanguageLabel.textContent = chrome.i18n.getMessage('customTargetLanguageLabel');

        this.customTargetLanguageInput.placeholder = chrome.i18n.getMessage('customTargetLanguagePlaceholder');

        const languageOptions = this.targetLanguageSelect.options;
        for (let index = 0; index < languageOptions.length; index += 1) {
            const option = languageOptions[index];
            const value = option.value;
            if (value === 'German') option.textContent = chrome.i18n.getMessage('germanLanguage');
            else if (value === 'English') option.textContent = chrome.i18n.getMessage('englishLanguage');
            else if (value === 'French') option.textContent = chrome.i18n.getMessage('frenchLanguage');
            else if (value === 'Spanish') option.textContent = chrome.i18n.getMessage('spanishLanguage');
            else if (value === 'Italian') option.textContent = chrome.i18n.getMessage('italianLanguage');
            else if (value === 'Portuguese') option.textContent = chrome.i18n.getMessage('portugueseLanguage');
            else if (value === 'Dutch') option.textContent = chrome.i18n.getMessage('dutchLanguage');
            else if (value === 'Russian') option.textContent = chrome.i18n.getMessage('russianLanguage');
            else if (value === 'Japanese') option.textContent = chrome.i18n.getMessage('japaneseLanguage');
            else if (value === 'Chinese') option.textContent = chrome.i18n.getMessage('chineseLanguage');
            else if (value === 'Korean') option.textContent = chrome.i18n.getMessage('koreanLanguage');
            else if (value === 'Arabic') option.textContent = chrome.i18n.getMessage('arabicLanguage');
            else if (value === 'other') option.textContent = chrome.i18n.getMessage('otherLanguage');
        }

        this.saveButton.textContent = chrome.i18n.getMessage('saveSettingsButton');
    }

    private initializeEventListeners(): void {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            void this.saveSettings();
        });

        this.checkApiKeyButton.addEventListener('click', () => {
            void this.checkApiKey();
        });

        this.targetLanguageSelect.addEventListener('change', () => {
            this.handleTargetLanguageChange();
        });
    }

    private async loadSettings(): Promise<void> {
        try {
            const [syncResult, localResult] = await Promise.all([
                chrome.storage.sync.get(['apiKey', 'model', 'reasoningEffort', 'targetLanguage']),
                chrome.storage.local.get(['showMigrationNotice']),
            ]);

            if (syncResult.apiKey) {
                this.apiKeyInput.value = syncResult.apiKey;
            }

            this.modelSelect.value = this.isSupportedModel(syncResult.model) ? syncResult.model : DEFAULT_MODEL;
            this.reasoningEffortSelect.value = this.isReasoningEffort(syncResult.reasoningEffort)
                ? syncResult.reasoningEffort
                : DEFAULT_REASONING_EFFORT;

            const targetLanguage = syncResult.targetLanguage || 'German';
            const predefinedLanguages = ['German', 'English', 'French', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Japanese', 'Chinese', 'Korean', 'Arabic'];

            if (predefinedLanguages.includes(targetLanguage)) {
                this.targetLanguageSelect.value = targetLanguage;
            } else {
                this.targetLanguageSelect.value = 'other';
                this.customTargetLanguageInput.value = targetLanguage;
                this.customLanguageField.style.display = 'block';
            }

            if (localResult.showMigrationNotice) {
                this.migrationNotice.style.display = 'block';
                await chrome.storage.local.remove('showMigrationNotice');
            }
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToLoadSettings'), 'error');
        }
    }

    private async saveSettings(): Promise<void> {
        const apiKey = this.apiKeyInput.value.trim();
        const model = this.modelSelect.value;
        const reasoningEffort = this.reasoningEffortSelect.value;
        const targetLanguage = this.getTargetLanguage();

        this.clearFieldErrors();

        let hasError = false;

        if (!apiKey) {
            this.setFieldError(this.apiKeyInput, chrome.i18n.getMessage('pleaseEnterApiKey'));
            hasError = true;
        } else if (!apiKey.startsWith('sk-')) {
            this.setFieldError(this.apiKeyInput, chrome.i18n.getMessage('invalidApiKeyFormat'));
            hasError = true;
        }

        if (!this.isSupportedModel(model)) {
            this.setFieldError(this.modelSelect, chrome.i18n.getMessage('pleaseSelectModel'));
            hasError = true;
        }

        if (!this.isReasoningEffort(reasoningEffort)) {
            this.setFieldError(this.reasoningEffortSelect, chrome.i18n.getMessage('pleaseSelectReasoningEffort'));
            hasError = true;
        }

        if (!targetLanguage) {
            const target = this.targetLanguageSelect.value === 'other'
                ? this.customTargetLanguageInput
                : this.targetLanguageSelect;
            this.setFieldError(target, chrome.i18n.getMessage('pleaseSelectTargetLanguage'));
            hasError = true;
        }

        if (hasError) return;

        this.saveButton.disabled = true;
        this.saveButton.textContent = chrome.i18n.getMessage('savingSettingsButton');

        try {
            const settings: Settings = {
                apiKey,
                model: model as SupportedModel,
                reasoningEffort: reasoningEffort as ReasoningEffort,
                targetLanguage,
            };

            await chrome.storage.sync.set(settings);
            this.showStatus(chrome.i18n.getMessage('settingsSavedSuccess'), 'success');
            this.migrationNotice.style.display = 'none';
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToSaveSettings'), 'error');
        } finally {
            this.saveButton.disabled = false;
            this.saveButton.textContent = chrome.i18n.getMessage('saveSettingsButton');
        }
    }

    private async checkApiKey(): Promise<void> {
        const apiKey = this.apiKeyInput.value.trim();

        if (!apiKey) {
            this.showStatus(chrome.i18n.getMessage('pleaseEnterApiKeyFirst'), 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showStatus(chrome.i18n.getMessage('invalidApiKeyFormat'), 'error');
            return;
        }

        this.checkApiKeyButton.disabled = true;
        this.checkApiKeyButton.textContent = chrome.i18n.getMessage('checkingApiKeyButton');
        this.showStatus(chrome.i18n.getMessage('checkingApiKeyStatus'), 'info');

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                this.showStatus(chrome.i18n.getMessage('apiKeyValidSuccess'), 'success');
                return;
            }

            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            this.showStatus(chrome.i18n.getMessage('failedToCheckApiKey', errorMessage), 'error');
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToCheckApiKeyGeneric'), 'error');
        } finally {
            this.checkApiKeyButton.disabled = false;
            this.checkApiKeyButton.textContent = chrome.i18n.getMessage('checkApiKeyButton');
        }
    }

    private handleTargetLanguageChange(): void {
        if (this.targetLanguageSelect.value === 'other') {
            this.customLanguageField.style.display = 'block';
            return;
        }

        this.customLanguageField.style.display = 'none';
        this.customTargetLanguageInput.value = '';
    }

    private getTargetLanguage(): string {
        if (this.targetLanguageSelect.value === 'other') {
            const customLanguage = this.customTargetLanguageInput.value.trim();
            if (!customLanguage) {
                return '';
            }
            if (!/[a-zA-Z]/.test(customLanguage) || customLanguage.length > 50) {
                return '';
            }
            return customLanguage;
        }

        return this.targetLanguageSelect.value;
    }

    private isSupportedModel(value: unknown): value is SupportedModel {
        return typeof value === 'string' && SUPPORTED_MODELS.includes(value as SupportedModel);
    }

    private isReasoningEffort(value: unknown): value is ReasoningEffort {
        return typeof value === 'string' && REASONING_EFFORTS.includes(value as ReasoningEffort);
    }

    private setFieldError(input: HTMLElement, message: string): void {
        input.classList.add('input--error');
        const existing = input.parentElement?.querySelector('.field-error-msg');
        if (existing) {
            existing.textContent = message;
            return;
        }
        const span = document.createElement('span');
        span.className = 'field-error-msg';
        span.textContent = message;
        input.insertAdjacentElement('afterend', span);
    }

    private clearFieldErrors(): void {
        for (const el of document.querySelectorAll('.input--error')) {
            el.classList.remove('input--error');
        }
        for (const el of document.querySelectorAll('.field-error-msg')) {
            el.remove();
        }
    }

    private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
        this.statusDiv.style.display = 'none';
        this.statusDiv.className = type;
        this.statusDiv.textContent = message;
        // Force reflow so the animation retriggers on repeated calls
        void this.statusDiv.offsetWidth;
        this.statusDiv.style.display = 'block';

        setTimeout(() => {
            this.statusDiv.style.display = 'none';
            this.statusDiv.className = '';
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OptionsPage();
});
