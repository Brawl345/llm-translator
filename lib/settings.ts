import { storage } from '#imports';
import {
  DEFAULT_MODEL,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TARGET_LANGUAGE,
  DEFAULT_THEME,
  isReasoningEffort,
  isSupportedModel,
  type ReasoningEffort,
  type SupportedModel,
  type ThemePreference,
} from './constants';

export interface Settings {
  apiKey: string;
  model: SupportedModel;
  reasoningEffort: ReasoningEffort;
  targetLanguage: string;
}

// Keys intentionally match the pre-rewrite storage layout so existing users
// keep their settings after the update. Do not rename them.
export const apiKeyItem = storage.defineItem<string>('sync:apiKey', {
  fallback: '',
});
export const modelItem = storage.defineItem<SupportedModel>('sync:model', {
  fallback: DEFAULT_MODEL,
});
export const reasoningEffortItem = storage.defineItem<ReasoningEffort>(
  'sync:reasoningEffort',
  { fallback: DEFAULT_REASONING_EFFORT },
);
export const targetLanguageItem = storage.defineItem<string>(
  'sync:targetLanguage',
  { fallback: DEFAULT_TARGET_LANGUAGE },
);
export const themeItem = storage.defineItem<ThemePreference>('sync:theme', {
  fallback: DEFAULT_THEME,
});
export const showMigrationNoticeItem = storage.defineItem<boolean>(
  'local:showMigrationNotice',
  { fallback: false },
);

export async function getSettings(): Promise<Settings> {
  const [apiKey, model, reasoningEffort, targetLanguage] = await Promise.all([
    apiKeyItem.getValue(),
    modelItem.getValue(),
    reasoningEffortItem.getValue(),
    targetLanguageItem.getValue(),
  ]);

  return {
    apiKey: typeof apiKey === 'string' ? apiKey : '',
    model: isSupportedModel(model) ? model : DEFAULT_MODEL,
    reasoningEffort: isReasoningEffort(reasoningEffort)
      ? reasoningEffort
      : DEFAULT_REASONING_EFFORT,
    targetLanguage:
      typeof targetLanguage === 'string' && targetLanguage
        ? targetLanguage
        : DEFAULT_TARGET_LANGUAGE,
  };
}

/**
 * Resets invalid model/reasoning-effort values to their defaults and drops the
 * legacy `availableModels` key. Returns whether anything changed so the caller
 * can surface the migration notice.
 */
export async function migrateSettings(): Promise<boolean> {
  let changed = false;

  const model = await modelItem.getValue();
  if (!isSupportedModel(model)) {
    await modelItem.setValue(DEFAULT_MODEL);
    changed = true;
  }

  const reasoningEffort = await reasoningEffortItem.getValue();
  if (!isReasoningEffort(reasoningEffort)) {
    await reasoningEffortItem.setValue(DEFAULT_REASONING_EFFORT);
    changed = true;
  }

  const legacyAvailableModels = await storage.getItem('sync:availableModels');
  if (legacyAvailableModels !== null) {
    await storage.removeItem('sync:availableModels');
    changed = true;
  }

  return changed;
}
