import type { 
    Settings, 
    TranslationError,
    ShowModalMessage 
} from '../shared/types.js';

const CONTEXT_MENU_ID = 'translate-text';

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: 'Translate via LLM',
        contexts: ['selection'],
    });

    // Check if API key is set, if not open options page
    const settings = await getSettings();
    if (!settings.apiKey) {
        chrome.runtime.openOptionsPage();
    }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab?.id) {
        const selectedText = info.selectionText.trim();
        
        if (!selectedText) return;

        await showTranslationModal(tab.id, selectedText, true);
        
        try {
            const translatedText = await translateText(selectedText);
            await showTranslationModal(tab.id, selectedText, false, translatedText);
        } catch (error) {
            const translationError: TranslationError = {
                message: error instanceof Error ? error.message : 'Translation failed',
            };
            await showTranslationModal(tab.id, selectedText, false, undefined, translationError);
        }
    }
});

async function showTranslationModal(
    tabId: number, 
    originalText: string, 
    loading: boolean = false, 
    translatedText?: string,
    error?: TranslationError
): Promise<void> {
    const message: ShowModalMessage = {
        type: 'SHOW_MODAL',
        payload: {
            originalText,
            translatedText,
            loading,
            error,
        },
    };

    await chrome.tabs.sendMessage(tabId, message);
}

async function translateText(text: string): Promise<string> {
    const settings = await getSettings();
    
    if (!settings.apiKey) {
        throw new Error('No API key configured. Please set up your OpenAI API key in the extension options.');
    }

    const systemPrompt = `You are a professional translator. Your task is to translate the given text into German while preserving the original meaning, tone, and context. 

Rules:
1. Always translate to German, regardless of the source language
2. Preserve formatting, punctuation, and special characters
3. Maintain the original tone (formal, casual, technical, etc.)
4. For technical terms, provide the most appropriate German translation
5. Only return the translated German text, no explanations or additional commentary

Translate the following text to German:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: settings.model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: text,
                },
            ],
            max_tokens: 1000,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Translation failed: ${errorMessage}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
        throw new Error('No translation received from the API');
    }

    return translatedText;
}

async function getSettings(): Promise<Settings> {
    const result = await chrome.storage.sync.get(['apiKey', 'model']);
    return {
        apiKey: result.apiKey || '',
        model: result.model || 'gpt-4.1',
    };
}