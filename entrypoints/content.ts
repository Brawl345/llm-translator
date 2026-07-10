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
  main(ctx) {
    // The UI is created lazily on the first translation so pages that never
    // use the extension don't pay for a mounted Vue app.
    let mounting: Promise<void> | null = null;

    const ensureUi = (): Promise<void> => {
      mounting ??= createShadowRootUi(ctx, {
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
      }).then((ui) => {
        ui.mount();
      });
      return mounting;
    };

    browser.runtime.onMessage.addListener((message: ContentMessage) => {
      handleMessage(message);
      if (message.type === 'SHOW_MODAL') {
        void ensureUi();
      }
    });
  },
});
