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
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || { ok: false, error: 'No response from background.' });
    });
  });
};
