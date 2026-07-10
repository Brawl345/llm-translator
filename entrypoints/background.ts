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
import {
  getAdditionalContextStream,
  isAbortError,
  translateTextStream,
} from '../lib/openai';
import {
  getSettings,
  migrateSettings,
  showMigrationNoticeItem,
} from '../lib/settings';

let requestCounter = 0;

// One active stream per tab; starting a new one aborts the previous.
const activeStreams = new Map<number, AbortController>();

function beginStream(tabId: number): AbortController {
  activeStreams.get(tabId)?.abort();
  const controller = new AbortController();
  activeStreams.set(tabId, controller);
  return controller;
}

function endStream(tabId: number, controller: AbortController): void {
  controller.abort();
  if (activeStreams.get(tabId) === controller) {
    activeStreams.delete(tabId);
  }
}

async function showTranslationModal(
  tabId: number,
  requestId: number,
  originalText: string,
  options: {
    model?: string;
    error?: TranslationError;
    isStreaming?: boolean;
  } = {},
): Promise<void> {
  const message: ShowModalMessage = {
    type: 'SHOW_MODAL',
    payload: {
      requestId,
      originalText,
      model: options.model,
      error: options.error,
      isStreaming: options.isStreaming,
    },
  };
  await browser.tabs.sendMessage(tabId, message);
}

async function sendTranslationChunk(
  tabId: number,
  requestId: number,
  chunk: string,
  isComplete: boolean,
): Promise<void> {
  const message: TranslationStreamMessage = {
    type: 'TRANSLATION_STREAM',
    payload: { requestId, chunk, isComplete },
  };
  await browser.tabs.sendMessage(tabId, message);
}

async function sendContextChunk(
  tabId: number,
  requestId: number,
  chunk: string,
  isComplete: boolean,
  error?: TranslationError,
): Promise<void> {
  const message: ContextStreamMessage = {
    type: 'CONTEXT_STREAM',
    payload: { requestId, chunk, isComplete, error },
  };
  await browser.tabs.sendMessage(tabId, message);
}

async function handleTranslation(
  selectedText: string,
  tabId: number,
): Promise<void> {
  const requestId = ++requestCounter;
  const controller = beginStream(tabId);
  const settings = await getSettings();

  try {
    await showTranslationModal(tabId, requestId, selectedText, {
      isStreaming: true,
      model: settings.model,
    });
  } catch {
    // Tab has no content script (restricted page) or is gone.
    endStream(tabId, controller);
    return;
  }

  try {
    await translateTextStream(
      settings,
      selectedText,
      (chunk, isComplete) =>
        sendTranslationChunk(tabId, requestId, chunk, isComplete),
      controller.signal,
    );
  } catch (error) {
    if (!isAbortError(error)) {
      await showTranslationModal(tabId, requestId, selectedText, {
        model: settings.model,
        error: {
          message:
            error instanceof Error ? error.message : 'Translation failed',
        },
      }).catch(() => {});
    }
  } finally {
    endStream(tabId, controller);
  }
}

async function handleAdditionalContext(
  message: GetAdditionalContextMessage,
  tabId: number,
): Promise<void> {
  const { requestId, originalText, translatedText } = message.payload;
  const controller = beginStream(tabId);

  try {
    const settings = await getSettings();
    await getAdditionalContextStream(
      settings,
      originalText,
      translatedText,
      (chunk, isComplete) =>
        sendContextChunk(tabId, requestId, chunk, isComplete),
      controller.signal,
    );
  } catch (error) {
    if (!isAbortError(error)) {
      await sendContextChunk(tabId, requestId, '', true, {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get additional context',
      }).catch(() => {});
    }
  } finally {
    endStream(tabId, controller);
  }
}

async function getTabSelection(tabId: number): Promise<string> {
  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection()?.toString().trim() ?? '',
  });
  return results[0]?.result ?? '';
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
    // info.selectionText collapses line breaks; prefer the live selection.
    const selectedText =
      (await getTabSelection(tab.id).catch(() => '')) ||
      info.selectionText.trim();
    if (!selectedText) return;
    await handleTranslation(selectedText, tab.id);
  });

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    const tabId = tab.id;

    try {
      const selectedText = await getTabSelection(tabId);
      if (!selectedText) {
        await showTranslationModal(tabId, ++requestCounter, '', {
          error: { message: t('noTextSelectedError') },
        });
        return;
      }

      await handleTranslation(selectedText, tabId);
    } catch (error) {
      await showTranslationModal(tabId, ++requestCounter, '', {
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get selected text',
        },
      }).catch(() => {});
    }
  });

  browser.runtime.onMessage.addListener((message: RuntimeMessage, sender) => {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    if (message.type === 'GET_ADDITIONAL_CONTEXT') {
      void handleAdditionalContext(message, tabId);
    } else if (message.type === 'ABORT_REQUEST') {
      activeStreams.get(tabId)?.abort();
    }
  });
});
