// Usage tracking and API key management service
// Manages OpenAI GPT-5.4 model limits and Gemini fallback

export interface UsageLimits {
  fast: number;   // GPT-5.4 Nano
  web: number;    // GPT-5.4 Mini
  deep: number;   // GPT-5.4
}

export interface UsageState {
  fast: number;
  web: number;
  deep: number;
  isFallback: boolean;
}

// --- CONSTANTS ---
export const MAX_LIMITS: UsageLimits = {
  fast: 25,
  web: 12,
  deep: 3,
};

// Model mapping for each mode
export const MODE_MODELS: Record<string, string> = {
  fast: 'gpt-5.4-nano',
  normal: 'gpt-5.4-mini',   // "web" mode is 'normal' in SearchMode
  pro: 'gpt-5.4',           // "deep" mode is 'pro' in SearchMode
};

// Embedded OpenAI API key (primary)
const EMBEDDED_OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Fallback Gemini API key (when all credits exhausted)
const FALLBACK_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// --- STORAGE ---
const USAGE_STORAGE_KEY = 'saturn_usage_state';
const USAGE_RESET_KEY = 'saturn_usage_reset_date';

const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const getUsageState = (): UsageState => {
  try {
    const resetDate = localStorage.getItem(USAGE_RESET_KEY);
    const today = getTodayKey();

    // Reset usage daily
    if (resetDate !== today) {
      const freshState: UsageState = { fast: 0, web: 0, deep: 0, isFallback: false };
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(freshState));
      localStorage.setItem(USAGE_RESET_KEY, today);
      return freshState;
    }

    const saved = localStorage.getItem(USAGE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load usage state', e);
  }
  return { fast: 0, web: 0, deep: 0, isFallback: false };
};

const saveUsageState = (state: UsageState) => {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(state));
};

// Maps SearchMode to usage key
const modeToUsageKey = (mode: string): keyof UsageLimits | null => {
  switch (mode) {
    case 'fast':
    case 'direct':
      return 'fast';
    case 'normal':
      return 'web';
    case 'pro':
      return 'deep';
    default:
      return null;
  }
};

// --- PUBLIC API ---

/** Returns the active OpenAI key: user-supplied key takes priority */
export const getEmbeddedOpenAIKey = (): string => {
  try {
    const users = JSON.parse(localStorage.getItem('deepsearch_users') || '[]');
    const currentId = localStorage.getItem('deepsearch_current_user_id');
    const user = users.find((u: any) => u.id === currentId) || users[0];
    if (user?.customOpenAIKey?.trim()) return user.customOpenAIKey.trim();
  } catch {}
  return EMBEDDED_OPENAI_KEY;
};

/** Returns the active Gemini key: user-supplied key takes priority */
export const getFallbackGeminiKey = (): string => {
  try {
    const users = JSON.parse(localStorage.getItem('deepsearch_users') || '[]');
    const currentId = localStorage.getItem('deepsearch_current_user_id');
    const user = users.find((u: any) => u.id === currentId) || users[0];
    if (user?.customGeminiKey?.trim()) return user.customGeminiKey.trim();
  } catch {}
  return FALLBACK_GEMINI_KEY;
};

/** Returns the model override for a given mode, or null if none set */
export const getModeModelOverride = (mode: string): string | null => {
  try {
    const users = JSON.parse(localStorage.getItem('deepsearch_users') || '[]');
    const currentId = localStorage.getItem('deepsearch_current_user_id');
    const user = users.find((u: any) => u.id === currentId) || users[0];
    const override = user?.modeModels?.[mode as keyof typeof user.modeModels];
    return override || null;
  } catch {}
  return null;
};

export const getRemainingUsage = (): { fast: number; web: number; deep: number } => {
  const state = getUsageState();
  return {
    fast: Math.max(0, MAX_LIMITS.fast - state.fast),
    web: Math.max(0, MAX_LIMITS.web - state.web),
    deep: Math.max(0, MAX_LIMITS.deep - state.deep),
  };
};

export const isAllCreditsExhausted = (): boolean => {
  const remaining = getRemainingUsage();
  return remaining.fast === 0 && remaining.web === 0 && remaining.deep === 0;
};

export const isModeExhausted = (mode: string): boolean => {
  const key = modeToUsageKey(mode);
  if (!key) return false;
  const remaining = getRemainingUsage();
  return remaining[key] === 0;
};

export const recordUsage = (mode: string): void => {
  const key = modeToUsageKey(mode);
  if (!key) return;
  const state = getUsageState();
  state[key] = (state[key] || 0) + 1;

  // Check if all credits are now exhausted
  const remaining = getRemainingUsage();
  // Recalculate after incrementing
  const fastRemaining = Math.max(0, MAX_LIMITS.fast - state.fast);
  const webRemaining = Math.max(0, MAX_LIMITS.web - state.web);
  const deepRemaining = Math.max(0, MAX_LIMITS.deep - state.deep);

  if (fastRemaining === 0 && webRemaining === 0 && deepRemaining === 0) {
    state.isFallback = true;
  }

  saveUsageState(state);
};

const isGeminiModel = (m: string) =>
  m.toLowerCase().startsWith('gemini') || m.toLowerCase().includes('gemini');

export const getModelForMode = (mode: string): { model: string; provider: 'openai' | 'gemini'; isFallback: boolean } => {
  // User override takes absolute priority (even over credit exhaustion)
  const override = getModeModelOverride(mode);
  if (override) {
    const provider = isGeminiModel(override) ? 'gemini' : 'openai';
    return { model: override, provider, isFallback: false };
  }

  // If all credits exhausted, use Gemini fallback
  if (isAllCreditsExhausted()) {
    return { model: 'gemini-2.5-flash', provider: 'gemini', isFallback: true };
  }

  // If this specific mode is exhausted, find an alternative
  const key = modeToUsageKey(mode);
  if (key && isModeExhausted(mode)) {
    const remaining = getRemainingUsage();
    if (remaining.fast > 0) return { model: 'gpt-5.4-nano', provider: 'openai', isFallback: false };
    if (remaining.web > 0)  return { model: 'gpt-5.4-mini', provider: 'openai', isFallback: false };
    if (remaining.deep > 0) return { model: 'gpt-5.4',      provider: 'openai', isFallback: false };
    return { model: 'gemini-2.5-flash', provider: 'gemini', isFallback: true };
  }

  switch (mode) {
    case 'fast':
    case 'direct':
      return { model: 'gpt-5.4-nano', provider: 'openai', isFallback: false };
    case 'normal':
      return { model: 'gpt-5.4-mini', provider: 'openai', isFallback: false };
    case 'pro':
      return { model: 'gpt-5.4', provider: 'openai', isFallback: false };
    default:
      return { model: 'gpt-5.4-mini', provider: 'openai', isFallback: false };
  }
};

// Get a human-readable exhaustion message
export const getExhaustionMessage = (mode: string): string | null => {
  if (isAllCreditsExhausted()) {
    return '⚡ All credits exhausted. Running in fallback mode (Gemini). Parallel search, image & video generation are unavailable.';
  }

  if (isModeExhausted(mode)) {
    const remaining = getRemainingUsage();
    const alternatives: string[] = [];
    if (remaining.fast > 0) alternatives.push(`Fast (${remaining.fast} left)`);
    if (remaining.web > 0) alternatives.push(`Web (${remaining.web} left)`);
    if (remaining.deep > 0) alternatives.push(`Deep (${remaining.deep} left)`);

    return `⚠️ Usage limit reached for this mode. Try: ${alternatives.join(', ')}`;
  }

  return null;
};

// Check if features are disabled in fallback mode
export const isFallbackMode = (): boolean => {
  return isAllCreditsExhausted();
};

// Features disabled in fallback
export const isImageGenAvailable = (): boolean => !isFallbackMode();
export const isVideoGenAvailable = (): boolean => !isFallbackMode();
export const isParallelSearchAvailable = (): boolean => !isFallbackMode();
