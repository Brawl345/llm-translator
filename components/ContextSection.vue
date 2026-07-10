<script setup lang="ts">
import { t } from '../lib/i18n';
import { requestContext, state } from './store';
</script>

<template>
  <section class="context">
    <button
      v-if="!state.contextRequested"
      class="context-btn"
      @click="requestContext"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {{ t('additionalContextButton') }}
    </button>

    <template v-else>
      <h3 class="context-heading">{{ t('additionalContextLabel') }}</h3>
      <div
        v-if="state.isContextStreaming && !state.contextText"
        class="loading"
      >
        <span class="spinner" />
        {{ t('gettingContextStatus') }}
      </div>
      <div v-else class="context-text">
        {{ state.contextText
        }}<span v-if="state.isContextStreaming" class="caret" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.context {
  border-top: 1px solid var(--border);
  padding-top: 18px;
}

.context-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 11px 18px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.005em;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.context-btn:hover {
  background: var(--accent-press);
  border-color: var(--accent-press);
}

.context-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.context-heading::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 14px;
}

.context-text {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
}

.caret {
  display: inline-block;
  width: 3px;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--accent);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
