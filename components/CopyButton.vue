<script setup lang="ts">
import { ref } from 'vue';
import { t } from '../lib/i18n';

const props = defineProps<{ text: string }>();

const copied = ref(false);
const failed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy(): Promise<void> {
  copied.value = false;
  failed.value = false;
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
  } catch {
    failed.value = true;
  }
  clearTimeout(timer);
  timer = setTimeout(() => {
    copied.value = false;
    failed.value = false;
  }, 2000);
}
</script>

<template>
  <button
    class="copy"
    :class="{ copied, failed }"
    :title="t('copyButtonLabel')"
    @click="copy"
  >
    <svg
      v-if="!copied"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
    <svg
      v-else
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span>{{
      copied
        ? t('copiedStatus')
        : failed
          ? t('copyFailedStatus')
          : t('copyButtonLabel')
    }}</span>
  </button>
</template>

<style scoped>
.copy {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.copy:hover {
  color: var(--text);
  background: var(--surface-hover);
  border-color: var(--text-muted);
}

.copy.copied {
  color: var(--online);
  border-color: var(--online);
  background: var(--online-soft);
}

.copy.failed {
  color: var(--danger);
  border-color: var(--danger);
  background: var(--danger-soft);
}

.copy svg {
  flex-shrink: 0;
}
</style>
