import { createShadowRootUi, defineContentScript } from '#imports';
import { createApp } from 'vue';
import { browser } from 'wxt/browser';
import TranslationModal from '../components/TranslationModal.vue';
import { handleMessage } from '../components/store';
import type { ContentMessage } from '../lib/messages';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'llm-translator-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(TranslationModal);
        app.mount(container);
        return app;
      },
      onRemove: (app) => app?.unmount(),
    });

    ui.mount();

    browser.runtime.onMessage.addListener((message: ContentMessage) => {
      handleMessage(message);
    });
  },
});
