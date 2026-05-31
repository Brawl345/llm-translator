<script setup lang="ts">
import { t } from '../lib/i18n';

defineProps<{ text: string }>();
</script>

<template>
  <details class="original">
    <summary>
      <svg
        class="chevron"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      {{ t('originalTextLabel') }}
    </summary>
    <div class="body">{{ text }}</div>
  </details>
</template>

<style scoped>
.original {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: color 0.15s ease;
}

summary:hover {
  color: var(--text);
}

summary::-webkit-details-marker {
  display: none;
}

.chevron {
  color: var(--accent);
  transition: transform 0.2s ease;
}

.original[open] .chevron {
  transform: rotate(90deg);
}

.body {
  padding: 2px 14px 13px;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
}
</style>
