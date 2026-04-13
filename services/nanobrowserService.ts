import type { AgentProfileId } from '../types';

export interface NanobrowserApiKeys {
  gemini?: string;
  openai?: string;
}

export interface NanobrowserStartMessage {
  type: 'NANO_AGENT_START';
  runId: string;
  task: string;
  model: string;
  apiKeys: NanobrowserApiKeys;
  useVision?: boolean;
  profile?: AgentProfileId;
  trigger?: 'manual' | 'auto';
  pageContext?: {
    url?: string;
    title?: string;
  };
}

export interface NanobrowserAbortMessage {
  type: 'NANO_AGENT_ABORT';
  runId: string;
}

type NanobrowserMessage = NanobrowserStartMessage | NanobrowserAbortMessage;

export const sendNanobrowserMessage = async (message: NanobrowserMessage) => {
  if (!chrome?.runtime?.sendMessage) {
    throw new Error('Nanobrowser is unavailable in this environment.');
  }
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    const timer = window.setTimeout(() => {
      resolve({ ok: false, error: 'Nanobrowser background worker timed out.' });
    }, 8000);

    chrome.runtime.sendMessage(message, (response) => {
      window.clearTimeout(timer);
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message || 'Nanobrowser background worker failed.' });
        return;
      }
      resolve(response || { ok: false, error: 'No response from background.' });
    });
  });
};
