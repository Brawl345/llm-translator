export type SupportedModel =
  | 'gpt-5.6-terra'
  | 'gpt-5.6-sol'
  | 'gpt-5.4'
  | 'gpt-5.5'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-nano';

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';

export const SUPPORTED_MODELS: SupportedModel[] = [
  'gpt-5.6-terra',
  'gpt-5.6-sol',
  'gpt-5.4',
  'gpt-5.5',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
];

export const REASONING_EFFORTS: ReasoningEffort[] = [
  'none',
  'low',
  'medium',
  'high',
];

export type ThemePreference = 'auto' | 'light' | 'dark';

export const THEME_PREFERENCES: ThemePreference[] = ['auto', 'light', 'dark'];

export const DEFAULT_MODEL: SupportedModel = 'gpt-5.6-terra';
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'none';
export const DEFAULT_TARGET_LANGUAGE = 'German';
export const DEFAULT_THEME: ThemePreference = 'auto';

// Predefined languages with their i18n message keys. "other" triggers the
// custom free-text input on the options page.
export const PREDEFINED_LANGUAGES: { value: string; messageKey: string }[] = [
  { value: 'German', messageKey: 'germanLanguage' },
  { value: 'English', messageKey: 'englishLanguage' },
  { value: 'French', messageKey: 'frenchLanguage' },
  { value: 'Spanish', messageKey: 'spanishLanguage' },
  { value: 'Italian', messageKey: 'italianLanguage' },
  { value: 'Portuguese', messageKey: 'portugueseLanguage' },
  { value: 'Dutch', messageKey: 'dutchLanguage' },
  { value: 'Russian', messageKey: 'russianLanguage' },
  { value: 'Japanese', messageKey: 'japaneseLanguage' },
  { value: 'Chinese', messageKey: 'chineseLanguage' },
  { value: 'Korean', messageKey: 'koreanLanguage' },
  { value: 'Arabic', messageKey: 'arabicLanguage' },
];

export const REASONING_EFFORT_LABELS: Record<ReasoningEffort, string> = {
  none: 'reasoningEffortNone',
  low: 'reasoningEffortLow',
  medium: 'reasoningEffortMedium',
  high: 'reasoningEffortHigh',
};

export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: 'themeAuto',
  light: 'themeLight',
  dark: 'themeDark',
};

// Cost guards: cap the combined prompt size and the completion budget.
export const MAX_INPUT_CHARS = 50_000;
export const MAX_OUTPUT_TOKENS = 32_768;

export const CONTEXT_MENU_ID = 'translate-text';

export function isSupportedModel(value: unknown): value is SupportedModel {
  return (
    typeof value === 'string' &&
    SUPPORTED_MODELS.includes(value as SupportedModel)
  );
}

export function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return (
    typeof value === 'string' &&
    REASONING_EFFORTS.includes(value as ReasoningEffort)
  );
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    THEME_PREFERENCES.includes(value as ThemePreference)
  );
}
