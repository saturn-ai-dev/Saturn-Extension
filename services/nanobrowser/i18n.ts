export type MessageKey = string;

export function t(key: MessageKey, substitutions?: string | string[]) {
  if (!substitutions) return key;
  if (Array.isArray(substitutions)) return `${key} ${substitutions.join(', ')}`;
  return `${key} ${substitutions}`;
}
