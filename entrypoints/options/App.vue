<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  DEFAULT_MODEL,
  PREDEFINED_LANGUAGES,
  REASONING_EFFORT_LABELS,
  REASONING_EFFORTS,
  type ReasoningEffort,
  SUPPORTED_MODELS,
  type SupportedModel,
} from '../../lib/constants';
import { t } from '../../lib/i18n';
import { checkApiKey } from '../../lib/openai';
import {
  apiKeyItem,
  getSettings,
  modelItem,
  reasoningEffortItem,
  showMigrationNoticeItem,
  targetLanguageItem,
} from '../../lib/settings';

const apiKey = ref('');
const model = ref<SupportedModel>(DEFAULT_MODEL);
const reasoningEffort = ref<ReasoningEffort>('none');
const languageSelection = ref<string>('German');
const customLanguage = ref('');

const checking = ref(false);
const keyValid = ref(false);
const keyMessage = ref<{ text: string; kind: 'success' | 'error' } | null>(
  null,
);
const showMigration = ref(false);

const predefinedValues = PREDEFINED_LANGUAGES.map((l) => l.value);
const isCustom = computed(() => languageSelection.value === 'other');

// Editing the key invalidates the previous "checked" state.
watch(apiKey, () => {
  keyValid.value = false;
  keyMessage.value = null;
});

async function saveAndCheck(): Promise<void> {
  const key = apiKey.value.trim();
  if (!key) {
    keyMessage.value = { text: t('pleaseEnterApiKeyFirst'), kind: 'error' };
    return;
  }
  if (!key.startsWith('sk-')) {
    keyMessage.value = { text: t('invalidApiKeyFormat'), kind: 'error' };
    return;
  }

  checking.value = true;
  keyMessage.value = null;
  try {
    await checkApiKey(key);
    await apiKeyItem.setValue(key);
    keyValid.value = true;
    keyMessage.value = { text: t('apiKeyValidSuccess'), kind: 'success' };
  } catch (error) {
    keyValid.value = false;
    keyMessage.value = {
      text: t('failedToCheckApiKey', error instanceof Error ? error.message : ''),
      kind: 'error',
    };
  } finally {
    checking.value = false;
  }
}

function persistModel(): void {
  void modelItem.setValue(model.value);
}

function persistReasoning(): void {
  void reasoningEffortItem.setValue(reasoningEffort.value);
}

function persistLanguage(): void {
  const value = isCustom.value
    ? customLanguage.value.trim()
    : languageSelection.value;
  if (value) {
    void targetLanguageItem.setValue(value);
  }
}

onMounted(async () => {
  const settings = await getSettings();
  model.value = settings.model;
  reasoningEffort.value = settings.reasoningEffort;

  if (predefinedValues.includes(settings.targetLanguage)) {
    languageSelection.value = settings.targetLanguage;
  } else {
    languageSelection.value = 'other';
    customLanguage.value = settings.targetLanguage;
  }

  // Assign last so the watcher above doesn't fight the initial value.
  apiKey.value = settings.apiKey;

  if (await showMigrationNoticeItem.getValue()) {
    showMigration.value = true;
    await showMigrationNoticeItem.setValue(false);
  }
});
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="head">
        <img src="/icons/48.png" alt="" />
        <h1>{{ t('settingsTitle') }}</h1>
      </header>

      <div v-if="showMigration" class="banner">
        {{ t('migrationNotice') }}
      </div>

      <section class="section">
        <h2>{{ t('apiKeyLabel') }}</h2>
        <p class="hint">{{ t('apiKeyDescription') }}</p>

        <div class="api-row">
          <input
            id="apiKey"
            v-model="apiKey"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('apiKeyPlaceholder')"
            :class="{ invalid: keyMessage?.kind === 'error' }"
            @keyup.enter="saveAndCheck"
          />
          <button
            class="check"
            :class="{ valid: keyValid }"
            :disabled="checking"
            @click="saveAndCheck"
          >
            <span v-if="checking" class="spinner" />
            <svg
              v-else-if="keyValid"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span v-if="!keyValid">{{
              checking ? t('checkingApiKeyButton') : t('saveAndCheckButton')
            }}</span>
          </button>
        </div>

        <p
          v-if="keyMessage"
          class="key-message"
          :class="keyMessage.kind"
        >
          {{ keyMessage.text }}
        </p>

        <a
          class="link"
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener"
        >
          {{ t('getApiKeyLink') }}
        </a>
      </section>

      <section class="section">
        <h2>{{ t('cardModelTitle') }}</h2>

        <label for="model">{{ t('modelLabel') }}</label>
        <select id="model" v-model="model" @change="persistModel">
          <option v-for="m in SUPPORTED_MODELS" :key="m" :value="m">
            {{ m }}
          </option>
        </select>

        <label for="reasoning">{{ t('reasoningEffortLabel') }}</label>
        <select
          id="reasoning"
          v-model="reasoningEffort"
          @change="persistReasoning"
        >
          <option v-for="e in REASONING_EFFORTS" :key="e" :value="e">
            {{ t(REASONING_EFFORT_LABELS[e]) }}
          </option>
        </select>
      </section>

      <section class="section">
        <h2>{{ t('cardLanguageTitle') }}</h2>

        <label for="language">{{ t('targetLanguageLabel') }}</label>
        <select
          id="language"
          v-model="languageSelection"
          @change="persistLanguage"
        >
          <option
            v-for="lang in PREDEFINED_LANGUAGES"
            :key="lang.value"
            :value="lang.value"
          >
            {{ t(lang.messageKey) }}
          </option>
          <option value="other">{{ t('otherLanguage') }}</option>
        </select>

        <template v-if="isCustom">
          <label for="customLanguage">{{ t('customTargetLanguageLabel') }}</label>
          <input
            id="customLanguage"
            v-model="customLanguage"
            type="text"
            maxlength="50"
            :placeholder="t('customTargetLanguagePlaceholder')"
            @change="persistLanguage"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px 16px;
}

.container {
  position: relative;
  max-width: 560px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 30px 30px 12px;
  overflow: hidden;
}

/* Editorial vermillion masthead rule, matching the translation modal */
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
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
}

.head img {
  width: 38px;
  height: 38px;
}

.head h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.banner {
  margin-top: 18px;
  padding: 13px 15px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  line-height: 1.5;
}

.section {
  padding: 24px 0;
  border-top: 1px solid var(--border);
}

.section:first-of-type {
  border-top: none;
  padding-top: 26px;
}

.section h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.section h2::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.hint {
  margin: 6px 0 14px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

label {
  display: block;
  margin: 14px 0 6px;
  font-weight: 600;
  font-size: 13px;
}

input,
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
}

select {
  appearance: none;
  cursor: pointer;
  padding-right: 36px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

input.invalid {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-soft);
}

.api-row {
  display: flex;
  gap: 10px;
}

.api-row input {
  flex: 1;
}

.check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 48px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.005em;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.check:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.check.valid {
  background: var(--online);
  border-color: var(--online);
}

.key-message {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 550;
}

.key-message.success {
  color: var(--online);
}

.key-message.error {
  color: var(--danger);
}

.link {
  display: inline-block;
  margin-top: 12px;
  color: var(--accent);
  font-size: 13px;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
