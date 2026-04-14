const openTag = (tag: string) => `<${tag}>`;
const closeTag = (tag: string) => `</${tag}>`;

export const wrapOpenUIContent = (text: string): string =>
  `${openTag('content')}${text}${closeTag('content')}`;

export const wrapOpenUIContext = (json: string): string =>
  `${openTag('context')}${json}${closeTag('context')}`;

const extractLastTagValue = (raw: string, tag: 'content' | 'context'): string | null => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
  const matches = [...raw.matchAll(regex)];
  if (!matches.length) return null;
  return matches[matches.length - 1]?.[1] ?? null;
};

const stripOuterFence = (value: string): string => {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:openui|oui|txt|text|md|markdown)?\s*[\r\n]([\s\S]*?)```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const sanitizeOpenUiCode = (value: string): string => {
  let normalized = value.replace(/\r\n/g, '\n');

  // Coercion constructors are common LLM leakage from JS habits; unwrap to raw expressions.
  normalized = normalized
    .replace(/\bNumber\s*\(/g, '(')
    .replace(/\bString\s*\(/g, '(')
    .replace(/\bBoolean\s*\(/g, '(');

  // Strip unsupported binding wrappers sometimes emitted from examples in other libraries.
  normalized = normalized.replace(/\$binding<\s*(\$?[A-Za-z_][\w$]*)\s*>/g, '$1');

  const lines = normalized.split('\n');
  const assignmentLine = /^\s*[$A-Za-z_][\w$]*\s*=/;
  const statementLike = lines.filter((line) => assignmentLine.test(line) || /^\s*$/.test(line)).length;
  const ratio = lines.length > 0 ? statementLike / lines.length : 0;

  const knownCalls = new Set([
    'Stack', 'Card', 'CardHeader', 'TextContent', 'MarkDownRenderer', 'Callout', 'Button', 'Buttons',
    'Input', 'TextArea', 'SelectItem', 'Select', 'FormControl', 'Form', 'Col', 'Table', 'TabItem', 'Tabs',
    'Tag', 'TagBlock', 'Separator', 'Image', 'ImageBlock', 'ListItem', 'ListBlock',
    'Action',
  ]);

  // Keep only assignment statements and drop lines with obviously unsupported constructs.
  if (ratio >= 0.2) {
    normalized = lines
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        if (!assignmentLine.test(trimmed)) return false;
        if (trimmed.includes('**')) return false;
        if (trimmed.includes(' ? ') || trimmed.includes('?')) return false;
        if (/\b(?:parseInt|parseFloat|Math\.)/.test(trimmed)) return false;

        const rhs = trimmed.split('=').slice(1).join('=').trim();
        const callMatch = rhs.match(/^([A-Za-z_][\w]*)\s*\(/);
        if (!callMatch) return true;
        return knownCalls.has(callMatch[1]);
      })
      .join('\n');
  }

  return normalized.trim();
};

const extractOpenUiBody = (value: string): string => {
  const normalized = stripOuterFence(value);
  const rootMatch = normalized.match(/(^|\n)\s*root\s*=/i);
  if (!rootMatch || typeof rootMatch.index !== 'number') return normalized.trim();
  return sanitizeOpenUiCode(normalized.slice(rootMatch.index));
};

export const isLikelyOpenUILang = (raw: string): boolean => {
  const text = (raw || '').trim();
  if (!text) return false;

  const code = extractOpenUiBody(text);
  const rootPattern = /(^|\n)\s*root\s*=\s*[A-Za-z_][\w]*\s*\(/i;
  return rootPattern.test(code);
};

export const separateOpenUIContent = (raw: string): {
  content: string;
  contextString: string | null;
} => {
  const contextString = extractLastTagValue(raw, 'context');
  const contentTag = extractLastTagValue(raw, 'content');

  let textToParse = raw;
  if (contextString) {
    textToParse = textToParse.replace(/<context>[\s\S]*?<\/context>/g, '').trim();
  }

  let content = contentTag ?? textToParse;
  const fencedOpenUi = content.match(/```(?:openui|oui|txt|text|md|markdown)?\s*[\r\n]([\s\S]*?)```/i);
  if (fencedOpenUi?.[1]) {
    content = fencedOpenUi[1];
  }

  content = extractOpenUiBody(content);
  return { content, contextString };
};

export const parseOpenUIContext = (contextString: string | null): Record<string, unknown> | undefined => {
  if (!contextString) return undefined;

  try {
    const parsed = JSON.parse(contextString);
    if (Array.isArray(parsed)) {
      for (let i = parsed.length - 1; i >= 0; i -= 1) {
        const item = parsed[i];
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return item as Record<string, unknown>;
        }
      }
      return undefined;
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }

  return undefined;
};
