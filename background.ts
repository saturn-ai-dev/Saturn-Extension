/// <reference types="chrome" />

import BrowserContext from '@src/background/browser/context';
import { Executor } from '@src/background/agent/executor';
import { ExecutionState } from '@src/background/agent/event/types';
import { createChatModel } from '@src/background/agent/helper';
import { injectBuildDomTreeScripts } from '@src/background/browser/dom/service';
import {
  agentModelStore,
  generalSettingsStore,
  llmProviderStore,
  AgentNameEnum,
  ProviderTypeEnum,
  type ProviderConfig,
  type ModelConfig,
} from '@extension/storage';

const browserContext = new BrowserContext({});
let currentExecutor: Executor | null = null;
let currentRunId: string | null = null;

chrome.runtime.onInstalled.addListener(() => {
  // Enables the sidebar to open when the extension icon is clicked
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

const resolveProvider = (modelName: string) => {
  if (modelName.startsWith('gpt') || modelName.startsWith('o')) return ProviderTypeEnum.OpenAI;
  return ProviderTypeEnum.Gemini;
};

const ensureProviderConfig = async (providerId: ProviderTypeEnum, apiKey: string, modelName: string) => {
  const config: ProviderConfig = {
    apiKey,
    name: providerId,
    type: providerId,
    modelNames: [modelName],
    createdAt: Date.now(),
  };
  await llmProviderStore.setProvider(providerId, config);
  return config;
};

const ensureAgentModels = async (providerId: string, modelName: string) => {
  const modelConfig: ModelConfig = { provider: providerId, modelName };
  await agentModelStore.setAgentModel(AgentNameEnum.Navigator, modelConfig);
  await agentModelStore.setAgentModel(AgentNameEnum.Planner, modelConfig);
};

const getTargetTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab.url && tab.url.startsWith('http')) return tab;
  const created = await chrome.tabs.create({ url: 'https://www.google.com', active: true });
  return created;
};

const dispatchAgentEvent = (runId: string, event: { actor: string; state: string; details: string; step: number; maxSteps: number; timestamp: number; }) => {
  chrome.runtime.sendMessage({
    type: 'NANO_AGENT_EVENT',
    runId,
    event: {
      id: `${runId}-${event.timestamp}-${event.step}`,
      actor: event.actor,
      state: event.state,
      details: event.details,
      step: event.step,
      maxSteps: event.maxSteps,
      timestamp: event.timestamp,
    },
  });
};

const dispatchAgentDone = (runId: string, status: 'success' | 'error' | 'aborted', result?: string) => {
  chrome.runtime.sendMessage({ type: 'NANO_AGENT_DONE', runId, status, result });
};

const dispatchAgentError = (runId: string, error: string) => {
  chrome.runtime.sendMessage({ type: 'NANO_AGENT_ERROR', runId, error });
};

// Listen for messages from the side panel or content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'NANO_AGENT_START') {
    (async () => {
      console.log('[NANO_AGENT_START]', message);
      if (currentExecutor) {
        sendResponse({ ok: false, error: 'An agent run is already active.' });
        return;
      }

      const runId = message.runId as string;
      const task = message.task as string;
      const model = message.model as string;
      const apiKeys = message.apiKeys || {};

      currentRunId = runId;
      dispatchAgentEvent(runId, {
        actor: 'system',
        state: 'task.starting',
        details: 'Preparing agent environment...',
        step: 0,
        maxSteps: 0,
        timestamp: Date.now(),
      });

      const tab = await getTargetTab();
      if (!tab?.id) {
        sendResponse({ ok: false, error: 'No active tab found for the agent.' });
        return;
      }

      const providerId = resolveProvider(model);
      const apiKey = providerId === ProviderTypeEnum.OpenAI ? apiKeys.openai : apiKeys.gemini;
      if (!apiKey) {
        sendResponse({ ok: false, error: 'Missing API key for the selected Nanobrowser model.' });
        return;
      }

      await ensureProviderConfig(providerId, apiKey, model);
      await ensureAgentModels(providerId, model);

      const providerConfig = await llmProviderStore.getProvider(providerId);
      if (!providerConfig) {
        sendResponse({ ok: false, error: 'Failed to configure Nanobrowser provider.' });
        return;
      }

      const navigatorLLM = createChatModel(providerConfig, { provider: providerId, modelName: model });
      const plannerLLM = navigatorLLM;

      const settings = await generalSettingsStore.getSettings();
      dispatchAgentEvent(runId, {
        actor: 'system',
        state: 'task.ready',
        details: 'Tab attached, initializing executor...',
        step: 0,
        maxSteps: settings.maxSteps,
        timestamp: Date.now(),
      });
      browserContext.updateConfig({
        minimumWaitPageLoadTime: settings.minWaitPageLoad / 1000.0,
        displayHighlights: settings.displayHighlights,
      });

      await browserContext.switchTab(tab.id);
      await injectBuildDomTreeScripts(tab.id);

      const useVision = message.useVision !== undefined ? message.useVision : settings.useVision;
      currentExecutor = new Executor(task, runId, browserContext, navigatorLLM, {
        plannerLLM,
        agentOptions: {
          maxSteps: settings.maxSteps,
          maxFailures: settings.maxFailures,
          maxActionsPerStep: settings.maxActionsPerStep,
          useVision,
          useVisionForPlanner: useVision,
          planningInterval: settings.planningInterval,
        },
        generalSettings: settings,
      });

      currentExecutor.clearExecutionEvents();
      currentExecutor.subscribeExecutionEvents(async (event) => {
        dispatchAgentEvent(runId, {
          actor: event.actor,
          state: event.state,
          details: event.data.details,
          step: event.data.step,
          maxSteps: event.data.maxSteps,
          timestamp: event.timestamp,
        });

        if (event.state === ExecutionState.TASK_OK) {
          dispatchAgentDone(runId, 'success', event.data.details);
          await currentExecutor?.cleanup();
          currentExecutor = null;
          currentRunId = null;
        }

        if (event.state === ExecutionState.TASK_FAIL) {
          dispatchAgentDone(runId, 'error', event.data.details);
          await currentExecutor?.cleanup();
          currentExecutor = null;
          currentRunId = null;
        }

        if (event.state === ExecutionState.TASK_CANCEL) {
          dispatchAgentDone(runId, 'aborted', event.data.details);
          await currentExecutor?.cleanup();
          currentExecutor = null;
          currentRunId = null;
        }
      });

      sendResponse({ ok: true });
      currentExecutor.execute().catch(async (error) => {
        const messageText = error instanceof Error ? error.message : String(error);
        dispatchAgentError(runId, messageText);
        await currentExecutor?.cleanup();
        currentExecutor = null;
        currentRunId = null;
      });
    })().catch((error) => {
      const messageText = error instanceof Error ? error.message : String(error);
      if (currentRunId) {
        dispatchAgentError(currentRunId, messageText);
      }
      currentExecutor = null;
      currentRunId = null;
      sendResponse({ ok: false, error: messageText });
    });
    return true;
  }

  if (message.type === 'NANO_AGENT_ABORT') {
    (async () => {
      if (!currentExecutor) {
        sendResponse({ ok: false, error: 'No running agent to stop.' });
        return;
      }
      await currentExecutor.cancel();
      sendResponse({ ok: true });
    })().catch((error) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  }

  if (message.action === 'getPageContent') {
    // If the sidebar requests content, we can facilitate it if needed,
    // but the sidebar itself can usually run executeScript on the active tab
    // if it has the right permissions (activeTab/scripting).
  }
});
