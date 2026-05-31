<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { t } from '../lib/i18n';
import ContextSection from './ContextSection.vue';
import CopyButton from './CopyButton.vue';
import OriginalSection from './OriginalSection.vue';
import { close, minimize, restore, state } from './store';

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && state.visible) {
    close();
  }
}

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
        <div class="container" role="dialog" aria-modal="true">
          <header class="head">
            <div class="head-title">
              <span class="eyebrow">{{ t('modalTitle') }}</span>
              <h2 class="title">{{ t('translationLabel') }}</h2>
            </div>
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
              <div class="block-head">
                <h3 class="label">{{ t('translationLabel') }}</h3>
                <CopyButton
                  v-if="state.hasTranslation && state.translation"
                  :text="state.translation"
                />
              </div>

              <div v-if="state.error" class="error">{{ state.error }}</div>
              <div
                v-else-if="!state.translation && state.isStreaming"
                class="loading"
              >
                <span class="spinner" />
                {{ t('translatingStatus') }}
              </div>
              <div v-else class="translation">
                {{ state.translation
                }}<span v-if="state.isStreaming" class="caret" />
              </div>
            </section>

            <ContextSection v-if="state.hasTranslation" />
          </div>

          <footer class="foot">{{ t('disclaimerText') }}</footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<style>
:host {
  --surface: #faf9f6;
  --surface-2: #f1efe8;
  --surface-hover: #e8e5dc;
  --border: #e3ded2;
  --text: #16161a;
  --text-muted: #6b6960;
  --accent: #ff4d2e;
  --accent-press: #e23d1f;
  --accent-soft: rgba(255, 77, 46, 0.12);
  --danger: #d92d20;
  --danger-soft: rgba(217, 45, 32, 0.1);
  --online: #1f9d55;
  --online-soft: rgba(31, 157, 85, 0.12);
  --scrim: rgba(16, 16, 20, 0.5);
  --shadow:
    0 28px 70px -16px rgba(16, 16, 20, 0.42),
    0 10px 26px -12px rgba(16, 16, 20, 0.28);
  --radius: 14px;
  --radius-sm: 8px;
  --font-body:
    system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Cantarell,
    'Helvetica Neue', sans-serif;
  --font-display:
    'Avenir Next', ui-sans-serif, 'Segoe UI Variable Display', system-ui,
    -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
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
    --surface: #1b1b20;
    --surface-2: #232329;
    --surface-hover: #2d2d35;
    --border: #2f2f37;
    --text: #f4f1ea;
    --text-muted: #9b988e;
    --accent: #ff5c3d;
    --accent-press: #ff7257;
    --accent-soft: rgba(255, 92, 61, 0.16);
    --danger: #ff6b5e;
    --danger-soft: rgba(255, 107, 94, 0.12);
    --online: #34c759;
    --online-soft: rgba(52, 199, 89, 0.16);
    --scrim: rgba(0, 0, 0, 0.6);
    --shadow:
      0 28px 80px -16px rgba(0, 0, 0, 0.72),
      0 10px 26px -12px rgba(0, 0, 0, 0.55);
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

@keyframes llm-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

/* Editorial vermillion masthead rule */
.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 16px;
  flex-shrink: 0;
  animation: llm-rise 0.32s ease both;
}

.head-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--text);
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
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.icon-btn:hover {
  background: var(--surface-hover);
  border-color: var(--border);
  color: var(--text);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 6px 22px 22px;
  overflow-y: auto;
}

.content > * {
  animation: llm-rise 0.34s ease both;
}

.content > *:nth-child(1) {
  animation-delay: 0.05s;
}
.content > *:nth-child(2) {
  animation-delay: 0.11s;
}
.content > *:nth-child(3) {
  animation-delay: 0.17s;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.label {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.label::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.translation {
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: -0.005em;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
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
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-muted);
  flex-shrink: 0;
  animation: llm-rise 0.34s ease 0.2s both;
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
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow: var(--shadow);
  transition: transform 0.16s ease;
}

.restore:hover {
  transform: translateY(-2px);
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
  transition: opacity 0.22s ease;
}

.modal-enter-active .container,
.modal-leave-active .container {
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .container,
.modal-leave-to .container {
  transform: scale(0.96) translateY(14px);
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
