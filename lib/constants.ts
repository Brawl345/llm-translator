export type SupportedModel =
  | 'gpt-5.4'
  | 'gpt-5.5'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-nano';

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';

export const SUPPORTED_MODELS: SupportedModel[] = [
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

export const DEFAULT_MODEL: SupportedModel = 'gpt-5.4';
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'none';
export const DEFAULT_TARGET_LANGUAGE = 'German';

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

// Validation: the entire context window, with a rough 4-chars-per-token ratio.
export const CONTEXT_LIMIT_TOKENS = 1047576;
export const CHARS_PER_TOKEN = 4;

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
