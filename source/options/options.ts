interface Settings {
    apiKey: string;
    model: string;
}

class OptionsPage {
    private form: HTMLFormElement;
    private apiKeyInput: HTMLInputElement;
    private modelSelect: HTMLSelectElement;
    private saveButton: HTMLButtonElement;
    private fetchModelsButton: HTMLButtonElement;
    private statusDiv: HTMLElement;

    constructor() {
        this.form = document.getElementById('settingsForm') as HTMLFormElement;
        this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        this.modelSelect = document.getElementById('model') as HTMLSelectElement;
        this.saveButton = document.getElementById('saveBtn') as HTMLButtonElement;
        this.fetchModelsButton = document.getElementById('fetchModelsBtn') as HTMLButtonElement;
        this.statusDiv = document.getElementById('status') as HTMLElement;

        this.localizeUI();
        this.initializeEventListeners();
        this.loadSettings();
    }

    private localizeUI(): void {
        document.getElementById('pageTitle')!.textContent = chrome.i18n.getMessage('settingsTitle');
        document.getElementById('settingsLegend')!.textContent = chrome.i18n.getMessage('settingsTitle');
        document.getElementById('apiKeyLabel')!.textContent = chrome.i18n.getMessage('apiKeyLabel');
        this.apiKeyInput.placeholder = chrome.i18n.getMessage('apiKeyPlaceholder');
        document.getElementById('apiKeyDescription')!.innerHTML = 
            chrome.i18n.getMessage('apiKeyDescription') + ' <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">' + 
            chrome.i18n.getMessage('getApiKeyLink') + '</a>';
        this.fetchModelsButton.textContent = chrome.i18n.getMessage('fetchModelsButton');
        document.getElementById('modelLabel')!.textContent = chrome.i18n.getMessage('modelLabel');
        document.getElementById('selectModelOption')!.textContent = chrome.i18n.getMessage('selectModelPlaceholder');
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
    }

    private async loadSettings(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get(['apiKey', 'model', 'availableModels']);
            
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
        } catch (_error) {
            this.showStatus(chrome.i18n.getMessage('failedToLoadSettings'), 'error');
        }
    }

    private async saveSettings(): Promise<void> {
        const apiKey = this.apiKeyInput.value.trim();
        const model = this.modelSelect.value;

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

        this.saveButton.disabled = true;
        this.saveButton.textContent = chrome.i18n.getMessage('savingSettingsButton');

        try {
            const settings: Settings = {
                apiKey,
                model,
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
                
                // Filter for GPT models and sort by name
                const gptModels = models
                    .filter((model: any) => {
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
                    .map((model: any) => model.id)
                    .sort();

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