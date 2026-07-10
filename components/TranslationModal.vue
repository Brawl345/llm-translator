<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { t } from '../lib/i18n';
import ContextSection from './ContextSection.vue';
import CopyButton from './CopyButton.vue';
import OriginalSection from './OriginalSection.vue';
import { close, minimize, restore, state } from './store';

const containerRef = ref<HTMLElement | null>(null);

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && state.visible) {
    close();
  }
}

watch(
  () => state.visible && !state.minimized,
  async (open) => {
    if (open) {
      await nextTick();
      containerRef.value?.focus();
    }
  },
  { immediate: true },
);

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="modal-root">
    <button
      v-if="state.visible && state.minimized"
      class="restore"
      :title="t('restoreButtonLabel')"
      @click="restore"
    >
      <span class="restore-tick" />
      {{ t('modalTitle') }}
    </button>

    <transition name="modal">
      <div
        v-if="state.visible && !state.minimized"
        class="overlay"
        @click.self="close"
      >
        <div
          ref="containerRef"
          class="container"
          role="dialog"
          aria-modal="true"
          :aria-label="t('modalTitle')"
          tabindex="-1"
        >
          <header class="head">
            <h2 class="title">{{ t('modalTitle') }}</h2>
            <div class="head-actions">
              <button
                class="icon-btn"
                :title="t('minimizeButtonLabel')"
                @click="minimize"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                class="icon-btn"
                :title="t('closeButtonLabel')"
                @click="close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          <div class="content">
            <OriginalSection
              v-if="state.originalText"
              :text="state.originalText"
            />

            <section class="block">
              <div v-if="state.error" class="error">{{ state.error }}</div>
              <div
                v-else-if="!state.translation && state.isStreaming"
                class="loading"
              >
                <span class="spinner" />
                {{ t('translatingStatus') }}
              </div>
              <template v-else>
                <div class="translation">
                  {{ state.translation
                  }}<span v-if="state.isStreaming" class="caret" />
                </div>
                <div
                  v-if="state.hasTranslation && state.translation"
                  class="block-actions"
                >
                  <CopyButton :text="state.translation" />
                </div>
              </template>
            </section>

            <ContextSection v-if="state.hasTranslation" />
          </div>

          <footer class="foot">
            <span>{{ t('disclaimerText') }}</span>
            <span v-if="state.model" class="foot-model">{{
              state.model
            }}</span>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<style>
:host {
  --surface: #ffffff;
  --surface-2: #f2f6f7;
  --surface-hover: #e7eef0;
  --border: #dde6e9;
  --text: #15191b;
  --text-muted: #5f7077;
  --accent: #0e7e93;
  --accent-soft: rgba(14, 126, 147, 0.1);
  --accent-soft-hover: rgba(14, 126, 147, 0.18);
  --danger: #d92d20;
  --danger-soft: rgba(217, 45, 32, 0.1);
  --online: #1f9d55;
  --online-soft: rgba(31, 157, 85, 0.12);
  --scrim: rgba(10, 20, 23, 0.45);
  --shadow:
    0 24px 60px -16px rgba(10, 25, 30, 0.35),
    0 10px 24px -12px rgba(10, 25, 30, 0.22);
  --radius: 14px;
  --radius-sm: 8px;
  --font-body:
    system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Cantarell,
    'Helvetica Neue', sans-serif;
  font-family: var(--font-body);
}

/* WXT mounts the app inside an isolated <html>/<body> in the shadow root;
   the host font-family is not reliably inherited through it, so set it
   explicitly on the inner document to avoid the page's serif default. */
html,
body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  :host {
    --surface: #171d20;
    --surface-2: #1e262a;
    --surface-hover: #273135;
    --border: #2c383d;
    --text: #eef3f4;
    --text-muted: #93a3aa;
    --accent: #4cbdd1;
    --accent-soft: rgba(76, 189, 209, 0.14);
    --accent-soft-hover: rgba(76, 189, 209, 0.24);
    --danger: #ff6b5e;
    --danger-soft: rgba(255, 107, 94, 0.12);
    --online: #34c759;
    --online-soft: rgba(52, 199, 89, 0.16);
    --scrim: rgba(0, 0, 0, 0.6);
    --shadow:
      0 24px 70px -16px rgba(0, 0, 0, 0.7),
      0 10px 24px -12px rgba(0, 0, 0, 0.5);
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: llm-spin 0.7s linear infinite;
}

.caret {
  display: inline-block;
  width: 3px;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--accent);
  animation: llm-blink 1s step-end infinite;
}

@keyframes llm-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes llm-blink {
  50% {
    opacity: 0;
  }
}
</style>

<style scoped>
.modal-root {
  display: contents;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--scrim);
  backdrop-filter: blur(3px);
  color: var(--text);
}

.container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 620px;
  max-height: 82vh;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.container:focus {
  outline: none;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px 10px;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-muted);
}

.head-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2px 20px 20px;
  overflow-y: auto;
}

.translation {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
}

.block-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 14px;
}

.error {
  padding: 13px 15px;
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
  line-height: 1.5;
}

.foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 20px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-muted);
  flex-shrink: 0;
}

.foot-model {
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.restore {
  position: fixed;
  bottom: 22px;
  right: 22px;
  z-index: 2147483647;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  box-shadow: var(--shadow);
  transition: background 0.15s ease;
}

.restore:hover {
  background: var(--surface-2);
}

.restore-tick {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .overlay {
    padding: 0;
    align-items: flex-end;
  }

  .container {
    max-width: 100%;
    max-height: 90vh;
    border-radius: var(--radius) var(--radius) 0 0;
  }
}
</style>
