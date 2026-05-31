import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { CONTEXT_MENU_ID } from '../lib/constants';
import { t } from '../lib/i18n';
import type {
  ContextStreamMessage,
  GetAdditionalContextMessage,
  RuntimeMessage,
  ShowModalMessage,
  TranslationError,
  TranslationStreamMessage,
} from '../lib/messages';
import { getAdditionalContextStream, translateTextStream } from '../lib/openai';
import {
  getSettings,
  migrateSettings,
  showMigrationNoticeItem,
} from '../lib/settings';

async function showTranslationModal(
  tabId: number,
  originalText: string,
  options: {
    translatedText?: string;
    error?: TranslationError;
    isStreaming?: boolean;
  } = {},
): Promise<void> {
  const message: ShowModalMessage = {
    type: 'SHOW_MODAL',
    payload: {
      originalText,
      translatedText: options.translatedText,
      error: options.error,
      isStreaming: options.isStreaming,
    },
  };
  await browser.tabs.sendMessage(tabId, message);
}

async function sendTranslationChunk(
  tabId: number,
  originalText: string,
  chunk: string,
  isComplete: boolean,
): Promise<void> {
  const message: TranslationStreamMessage = {
    type: 'TRANSLATION_STREAM',
    payload: { originalText, chunk, isComplete },
  };
  await browser.tabs.sendMessage(tabId, message);
}

async function sendContextChunk(
  tabId: number,
  originalText: string,
  chunk: string,
  isComplete: boolean,
  error?: TranslationError,
): Promise<void> {
  const message: ContextStreamMessage = {
    type: 'CONTEXT_STREAM',
    payload: { originalText, chunk, isComplete, error },
  };
  await browser.tabs.sendMessage(tabId, message);
}

async function handleTranslation(
  selectedText: string,
  tabId: number,
): Promise<void> {
  await showTranslationModal(tabId, selectedText, { isStreaming: true });

  try {
    const settings = await getSettings();
    await translateTextStream(settings, selectedText, (chunk, isComplete) =>
      sendTranslationChunk(tabId, selectedText, chunk, isComplete),
    );
  } catch (error) {
    await showTranslationModal(tabId, selectedText, {
      error: {
        message: error instanceof Error ? error.message : 'Translation failed',
      },
    });
  }
}

async function handleAdditionalContext(
  message: GetAdditionalContextMessage,
  tabId: number,
): Promise<void> {
  const { originalText, translatedText } = message.payload;
  try {
    const settings = await getSettings();
    await getAdditionalContextStream(
      settings,
      originalText,
      translatedText,
      (chunk, isComplete) =>
        sendContextChunk(tabId, originalText, chunk, isComplete),
    );
  } catch (error) {
    await sendContextChunk(tabId, originalText, '', true, {
      message:
        error instanceof Error
          ? error.message
          : 'Failed to get additional context',
    });
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async (details) => {
    browser.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: t('contextMenuTitle'),
      contexts: ['selection'],
    });

    if (details.reason === 'update') {
      const migrated = await migrateSettings();
      if (migrated) {
        await showMigrationNoticeItem.setValue(true);
        await browser.runtime.openOptionsPage();
      }
      return;
    }

    const settings = await getSettings();
    if (!settings.apiKey) {
      await browser.runtime.openOptionsPage();
    }
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (
      info.menuItemId !== CONTEXT_MENU_ID ||
      !info.selectionText ||
      !tab?.id
    ) {
      return;
    }
    const selectedText = info.selectionText.trim();
    if (!selectedText) return;
    await handleTranslation(selectedText, tab.id);
  });

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    try {
      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString().trim() ?? '',
      });

      const selectedText = results[0]?.result;
      if (!selectedText) {
        await showTranslationModal(tab.id, '', {
          error: { message: t('noTextSelectedError') },
        });
        return;
      }

      await handleTranslation(selectedText, tab.id);
    } catch (error) {
      await showTranslationModal(tab.id, '', {
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get selected text',
        },
      });
    }
  });

  browser.runtime.onMessage.addListener((message: RuntimeMessage, sender) => {
    if (message.type === 'GET_ADDITIONAL_CONTEXT' && sender.tab?.id) {
      void handleAdditionalContext(message, sender.tab.id);
    }
  });
});
