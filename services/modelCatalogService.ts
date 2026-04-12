export interface ModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openai';
}

interface GeminiApiModel {
  name?: string;
  supportedGenerationMethods?: string[];
}

interface OpenAIModel {
  id: string;
}

const GEMINI_FALLBACK_TEXT = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
];

const GEMINI_FALLBACK_IMAGE = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
];

const OPENAI_FALLBACK_TEXT = [
  'gpt-5.2',
  'gpt-5-mini',
  'gpt-4o-2024-11-20',
];

const normalizeModelId = (id: string) => id.replace(/^models\//, '').trim();

export const formatModelName = (id: string) =>
  normalizeModelId(id)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const uniq = (items: string[]) => Array.from(new Set(items));

const scoreModel = (id: string) => {
  const lower = id.toLowerCase();
  let score = 0;
  if (lower.includes('latest')) score += 1000;
  if (lower.includes('preview')) score -= 50;
  if (lower.includes('flash')) score += 120;
  if (lower.includes('pro')) score += 90;
  if (lower.includes('mini')) score += 40;
  const versionMatches = lower.match(/\d+(?:\.\d+)?/g) || [];
  for (const match of versionMatches) score += Number(match) * 10;
  return score;
};

const toOptions = (ids: string[], provider: 'gemini' | 'openai') =>
  uniq(ids)
    .map(normalizeModelId)
    .sort((a, b) => scoreModel(b) - scoreModel(a) || a.localeCompare(b))
    .map((id) => ({ id, name: formatModelName(id), provider }));

export const getFallbackModelCatalog = () => ({
  geminiText: toOptions(GEMINI_FALLBACK_TEXT, 'gemini'),
  geminiImage: toOptions(GEMINI_FALLBACK_IMAGE, 'gemini'),
  openaiText: toOptions(OPENAI_FALLBACK_TEXT, 'openai'),
});

export const fetchGeminiModels = async (apiKey: string) => {
  if (!apiKey.trim()) {
    return {
      text: getFallbackModelCatalog().geminiText,
      image: getFallbackModelCatalog().geminiImage,
    };
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) {
    throw new Error(`Gemini models request failed (${response.status})`);
  }

  const data = await response.json() as { models?: GeminiApiModel[] };
  const models = data.models || [];

  const textIds = models
    .filter((model) => normalizeModelId(model.name || '').startsWith('gemini'))
    .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => normalizeModelId(model.name || ''))
    .filter(Boolean);

  const imageIds = models
    .filter((model) => normalizeModelId(model.name || '').startsWith('gemini'))
    .filter((model) =>
      model.supportedGenerationMethods?.includes('predict') ||
      model.supportedGenerationMethods?.includes('generateImages') ||
      normalizeModelId(model.name || '').includes('image')
    )
    .map((model) => normalizeModelId(model.name || ''))
    .filter(Boolean);

  return {
    text: toOptions(textIds.length ? textIds : GEMINI_FALLBACK_TEXT, 'gemini'),
    image: toOptions(imageIds.length ? imageIds : GEMINI_FALLBACK_IMAGE, 'gemini'),
  };
};

export const fetchOpenAIModels = async (apiKey: string) => {
  if (!apiKey.trim()) {
    return {
      text: getFallbackModelCatalog().openaiText,
    };
  }

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAI models request failed (${response.status})`);
  }

  const data = await response.json() as { data?: OpenAIModel[] };
  const models = data.data || [];

  const textIds = models
    .map((model) => model.id)
    .filter((id) => /^(gpt|o\d)/i.test(id))
    .filter((id) => !/(audio|realtime|transcribe|tts|whisper|embedding|search|moderation|image)/i.test(id));

  return {
    text: toOptions(textIds.length ? textIds : OPENAI_FALLBACK_TEXT, 'openai'),
  };
};
