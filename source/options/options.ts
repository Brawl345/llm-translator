interface Settings {
    apiKey: string;
    model: string;
    targetLanguage: string;
}

class OptionsPage {
    private form: HTMLFormElement;
    private apiKeyInput: HTMLInputElement;
    private modelSelect: HTMLSelectElement;
    private targetLanguageSelect: HTMLSelectElement;
    private customTargetLanguageInput: HTMLInputElement;
    private customLanguageField: HTMLElement;
    private saveButton: HTMLButtonElement;
    private fetchModelsButton: HTMLButtonElement;
    private statusDiv: HTMLElement;

    constructor() {
        this.form = document.getElementById('settingsForm') as HTMLFormElement;
        this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        this.modelSelect = document.getElementById('model') as HTMLSelectElement;
        this.targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement;
        this.customTargetLanguageInput = document.getElementById('customTargetLanguage') as HTMLInputElement;
        this.customLanguageField = document.getElementById('customLanguageField') as HTMLElement;
        this.saveButton = document.getElementById('saveBtn') as HTMLButtonElement;
        this.fetchModelsButton = document.getElementById('fetchModelsBtn') as HTMLButtonElement;
        this.statusDiv = document.getElementById('status') as HTMLElement;

        this.localizeUI();
        this.initializeEventListeners();
        this.loadSettings();
    }

    private localizeUI(): void {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = chrome.i18n.getMessage('settingsTitle');
        const settingsLegend = document.getElementById('settingsLegend');
        if (settingsLegend) settingsLegend.textContent = chrome.i18n.getMessage('settingsTitle');
        const apiKeyLabel = document.getElementById('apiKeyLabel');
        if (apiKeyLabel) apiKeyLabel.textContent = chrome.i18n.getMessage('apiKeyLabel');
        this.apiKeyInput.placeholder = chrome.i18n.getMessage('apiKeyPlaceholder');
        const apiKeyDescription = document.getElementById('apiKeyDescription');
        if (apiKeyDescription) apiKeyDescription.innerHTML = 
            `${chrome.i18n.getMessage('apiKeyDescription')} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">${chrome.i18n.getMessage('getApiKeyLink')}</a>`;
        this.fetchModelsButton.textContent = chrome.i18n.getMessage('fetchModelsButton');
        const modelLabel = document.getElementById('modelLabel');
        if (modelLabel) modelLabel.textContent = chrome.i18n.getMessage('modelLabel');
        const selectModelOption = document.getElementById('selectModelOption');
        if (selectModelOption) selectModelOption.textContent = chrome.i18n.getMessage('selectModelPlaceholder');
        const targetLanguageLabel = document.getElementById('targetLanguageLabel');
        if (targetLanguageLabel) targetLanguageLabel.textContent = chrome.i18n.getMessage('targetLanguageLabel');
        const customTargetLanguageLabel = document.getElementById('customTargetLanguageLabel');
        if (customTargetLanguageLabel) customTargetLanguageLabel.textContent = chrome.i18n.getMessage('customTargetLanguageLabel');
        this.customTargetLanguageInput.placeholder = chrome.i18n.getMessage('customTargetLanguagePlaceholder');
        
        // Localize language option texts
        const languageOptions = this.targetLanguageSelect.options;
        for (let i = 0; i < languageOptions.length; i++) {
            const option = languageOptions[i];
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
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        this.fetchModelsButton.addEventListener('click', () => {
            this.fetchModels();
        });

        this.targetLanguageSelect.addEventListener('change', () => {
            this.handleTargetLanguageChange();
        });
    }

    private async loadSettings(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get(['apiKey', 'model', 'targetLanguage', 'availableModels']);
            
            if (result.apiKey) {
                this.apiKeyInput.value = result.apiKey;
            }

            // Load previously fetched models
            if (result.availableModels && Array.isArray(result.availableModels) && result.availableModels.length > 0) {
                this.populateModelDropdown(result.availableModels);
            }
            
            if (result.model) {
                // Create option element for saved model if it doesn't exist
                const existingOption = Array.from(this.modelSelect.options).find(
                    option => option.value === result.model
                );
                if (!existingOption) {
                    const option = document.createElement('option');
                    option.value = result.model;
                    option.textContent = result.model;
                    this.modelSelect.appendChild(option);
                }
                this.modelSelect.value = result.model;
            }

            // Set default target language to German for backward compatibility
            const targetLanguage = result.targetLanguage || 'German';
            const predefinedLanguages = ['German', 'English', 'French', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Japanese', 'Chinese', 'Korean', 'Arabic'];
            
            if (predefinedLanguages.includes(targetLanguage)) {
                this.targetLanguageSelect.value = targetLanguage;
            } else {
                this.targetLanguageSelect.value = 'other';
                this.customTargetLanguageInput.value = targetLanguage;
                this.customLanguageField.style.display = 'block';
            }
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToLoadSettings'), 'error');
        }
    }

    private async saveSettings(): Promise<void> {
        const apiKey = this.apiKeyInput.value.trim();
        const model = this.modelSelect.value;
        const targetLanguage = this.getTargetLanguage();

        if (!apiKey) {
            this.showStatus(chrome.i18n.getMessage('pleaseEnterApiKey'), 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showStatus(chrome.i18n.getMessage('invalidApiKeyFormat'), 'error');
            return;
        }

        if (!model) {
            this.showStatus(chrome.i18n.getMessage('pleaseSelectModel'), 'error');
            return;
        }

        if (!targetLanguage) {
            this.showStatus(chrome.i18n.getMessage('pleaseSelectTargetLanguage'), 'error');
            return;
        }

        this.saveButton.disabled = true;
        this.saveButton.textContent = chrome.i18n.getMessage('savingSettingsButton');

        try {
            const settings: Settings = {
                apiKey,
                model,
                targetLanguage,
            };

            await chrome.storage.sync.set(settings);
            this.showStatus(chrome.i18n.getMessage('settingsSavedSuccess'), 'success');
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToSaveSettings'), 'error');
        } finally {
            this.saveButton.disabled = false;
            this.saveButton.textContent = chrome.i18n.getMessage('saveSettingsButton');
        }
    }

    private async fetchModels(): Promise<void> {
        const apiKey = this.apiKeyInput.value.trim();

        if (!apiKey) {
            this.showStatus(chrome.i18n.getMessage('pleaseEnterApiKeyFirst'), 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showStatus(chrome.i18n.getMessage('invalidApiKeyFormat'), 'error');
            return;
        }

        this.fetchModelsButton.disabled = true;
        this.fetchModelsButton.textContent = chrome.i18n.getMessage('fetchingModelsButton');
        this.showStatus(chrome.i18n.getMessage('fetchingModelsStatus'), 'info');

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const models = data.data || [];
                
                // Filter for GPT models and sort by created date
                const gptModels = models
                    .filter((model: { id: string; created: number }) => {
                        const modelId = model.id.toLowerCase();
                        return modelId.includes('gpt') &&
                               !modelId.includes('image') &&
                               !modelId.includes('gpt-3.5') &&
                               !modelId.includes('audio') &&
                               !modelId.includes('transcribe') &&
                               !modelId.includes('search') &&
                               !modelId.includes('tts') &&
                               !modelId.includes('realtime');
                    })
                    .sort((a: { created: number }, b: { created: number }) => b.created - a.created)
                    .map((model: { id: string }) => model.id);

                if (gptModels.length === 0) {
                    this.showStatus(chrome.i18n.getMessage('noGptModelsFound'), 'error');
                    return;
                }

                // Store the fetched models for future use
                await chrome.storage.sync.set({ availableModels: gptModels });

                this.populateModelDropdown(gptModels);
                this.showStatus(chrome.i18n.getMessage('modelsFoundSuccess', String(gptModels.length)), 'success');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
                this.showStatus(chrome.i18n.getMessage('failedToFetchModels', errorMessage), 'error');
            }
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToFetchModelsGeneric'), 'error');
        } finally {
            this.fetchModelsButton.disabled = false;
            this.fetchModelsButton.textContent = chrome.i18n.getMessage('fetchModelsButton');
        }
    }

    private populateModelDropdown(models: string[]): void {
        // Remember currently selected model
        const currentModel = this.modelSelect.value;
        
        // Clear existing options except the placeholder
        this.modelSelect.innerHTML = `<option value="">${chrome.i18n.getMessage('selectModelPlaceholder')}</option>`;
        
        // Add available models to dropdown
        models.forEach((modelId: string) => {
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = modelId;
            this.modelSelect.appendChild(option);
        });
        
        // Restore selection if the model is still available
        if (currentModel && models.includes(currentModel)) {
            this.modelSelect.value = currentModel;
        }
    }

    private handleTargetLanguageChange(): void {
        if (this.targetLanguageSelect.value === 'other') {
            this.customLanguageField.style.display = 'block';
        } else {
            this.customLanguageField.style.display = 'none';
            this.customTargetLanguageInput.value = '';
        }
    }

    private getTargetLanguage(): string {
        if (this.targetLanguageSelect.value === 'other') {
            const customLanguage = this.customTargetLanguageInput.value.trim();
            if (!customLanguage) {
                return '';
            }
            // Basic validation: must contain at least one letter and be reasonable length
            if (!/[a-zA-Z]/.test(customLanguage) || customLanguage.length > 50) {
                return '';
            }
            return customLanguage;
        }
        return this.targetLanguageSelect.value;
    }

    private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
        this.statusDiv.textContent = message;
        this.statusDiv.style.display = 'block';
        
        if (type === 'success') {
            this.statusDiv.style.backgroundColor = '#d4edda';
            this.statusDiv.style.color = '#155724';
            this.statusDiv.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            this.statusDiv.style.backgroundColor = '#f8d7da';
            this.statusDiv.style.color = '#721c24';
            this.statusDiv.style.border = '1px solid #f5c6cb';
        } else {
            this.statusDiv.style.backgroundColor = '#d1ecf1';
            this.statusDiv.style.color = '#0c5460';
            this.statusDiv.style.border = '1px solid #bee5eb';
        }
        
        setTimeout(() => {
            this.statusDiv.style.display = 'none';
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OptionsPage();
});