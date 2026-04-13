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
import { buildAgentTaskEnvelope, getAgentProfile } from './services/agentProfiles';
import { createAgentEvent } from './services/agentRunService';

const browserContext = new BrowserContext({});
let currentExecutor: Executor | null = null;
let currentRunId: string | null = null;
const MAX_AGENT_RECOVERY_ATTEMPTS = 1;
const AGENT_RECOVERY_DELAY_MS = 1500;

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

const dispatchAgentEvent = (
  runId: string,
  sequence: number,
  event: { actor: string; state: string; details: string; step: number; maxSteps: number; timestamp: number },
) => {
  chrome.runtime.sendMessage({
    type: 'NANO_AGENT_EVENT',
    runId,
    event: createAgentEvent({ runId, sequence, ...event }),
  });
};

const dispatchAgentDone = (runId: string, status: 'success' | 'error' | 'aborted', result?: string) => {
  chrome.runtime.sendMessage({ type: 'NANO_AGENT_DONE', runId, status, result });
};

const dispatchAgentError = (runId: string, error: string) => {
  chrome.runtime.sendMessage({ type: 'NANO_AGENT_ERROR', runId, error });
};

const isTransientAgentIssue = (message: string) =>
  /timeout|timed out|network|fetch|connection|socket|temporar|rate limit|overloaded|503|502|504|ERR_|ECONN|unavailable|deadline|stream/i.test(
    message,
  );

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
      const profileId = message.profile;
      const profile = getAgentProfile(profileId);
      let eventSequence = 0;
      const emitEvent = (event: { actor: string; state: string; details: string; step: number; maxSteps: number; timestamp: number }) =>
        dispatchAgentEvent(runId, ++eventSequence, event);

      currentRunId = runId;
      emitEvent({
        actor: 'system',
        state: 'task.starting',
        details: `Preparing ${profile.label.toLowerCase()} agent environment...`,
        step: 0,
        maxSteps: 0,
        timestamp: Date.now(),
      });

      const tab = await getTargetTab();
      if (!tab?.id) {
        currentRunId = null;
        sendResponse({ ok: false, error: 'No active tab found for the agent.' });
        return;
      }

      const providerId = resolveProvider(model);
      const apiKey = providerId === ProviderTypeEnum.OpenAI ? apiKeys.openai : apiKeys.gemini;
      if (!apiKey) {
        currentRunId = null;
        sendResponse({ ok: false, error: 'Missing API key for the selected Nanobrowser model.' });
        return;
      }

      await ensureProviderConfig(providerId, apiKey, model);
      await ensureAgentModels(providerId, model);

      const providerConfig = await llmProviderStore.getProvider(providerId);
      if (!providerConfig) {
        currentRunId = null;
        sendResponse({ ok: false, error: 'Failed to configure Nanobrowser provider.' });
        return;
      }

      const navigatorLLM = createChatModel(providerConfig, { provider: providerId, modelName: model });
      const plannerLLM = navigatorLLM;

      const settings = await generalSettingsStore.getSettings();
      emitEvent({
        actor: 'system',
        state: 'task.ready',
        details: `Attached to "${tab.title || 'current tab'}". Initializing ${profile.label.toLowerCase()} agent...`,
        step: 0,
        maxSteps: Math.min(settings.maxSteps, profile.runtime.maxSteps),
        timestamp: Date.now(),
      });
      browserContext.updateConfig({
        minimumWaitPageLoadTime: settings.minWaitPageLoad / 1000.0,
        displayHighlights: settings.displayHighlights,
      });

      await browserContext.switchTab(tab.id);
      await injectBuildDomTreeScripts(tab.id);

      const useVision = message.useVision !== undefined ? message.useVision : settings.useVision;
      const packagedTask = buildAgentTaskEnvelope({
        task,
        profile: profile.id,
        trigger: message.trigger === 'auto' ? 'auto' : 'manual',
        pageContext: {
          url: message.pageContext?.url || tab.url || '',
          title: message.pageContext?.title || tab.title || '',
        },
      });
      let recoveryAttempts = 0;

      const finalizeRun = async (status: 'success' | 'error' | 'aborted', result?: string, error?: string) => {
        if (status === 'error') {
          if (error) dispatchAgentError(runId, error);
          else dispatchAgentDone(runId, status, result);
        } else {
          dispatchAgentDone(runId, status, result);
        }
        await currentExecutor?.cleanup();
        currentExecutor = null;
        currentRunId = null;
      };

      const createExecutor = () =>
        new Executor(packagedTask, runId, browserContext, navigatorLLM, {
          plannerLLM,
          agentOptions: {
            maxSteps: Math.min(settings.maxSteps, profile.runtime.maxSteps),
            maxFailures: Math.min(settings.maxFailures, profile.runtime.maxFailures),
            maxActionsPerStep: Math.min(settings.maxActionsPerStep, profile.runtime.maxActionsPerStep),
            retryDelay: profile.runtime.retryDelay,
            useVision,
            useVisionForPlanner: useVision && profile.runtime.usePlannerVision,
            planningInterval: Math.max(1, Math.min(settings.planningInterval, profile.runtime.planningInterval)),
            planOnStart: profile.runtime.planOnStart,
          },
          generalSettings: settings,
        });

      const retryExecution = async (reason: string, step: number, maxSteps: number) => {
        recoveryAttempts += 1;
        emitEvent({
          actor: 'system',
          state: 'task.retrying',
          details: `Transient issue detected (${reason}). Reconnecting and retrying once...`,
          step,
          maxSteps,
          timestamp: Date.now(),
        });
        await currentExecutor?.cleanup();
        currentExecutor = null;
        await new Promise(resolve => setTimeout(resolve, AGENT_RECOVERY_DELAY_MS));
        await browserContext.switchTab(tab.id);
        await injectBuildDomTreeScripts(tab.id);
        startExecution();
      };

      const startExecution = () => {
        const executor = createExecutor();
        currentExecutor = executor;
        executor.clearExecutionEvents();
        executor.subscribeExecutionEvents(async (event) => {
          if (currentExecutor !== executor || currentRunId !== runId) return;

          emitEvent({
            actor: event.actor,
            state: event.state,
            details: event.data.details,
            step: event.data.step,
            maxSteps: event.data.maxSteps,
            timestamp: event.timestamp,
          });

          if (event.state === ExecutionState.TASK_OK) {
            await finalizeRun('success', event.data.details);
            return;
          }

          if (event.state === ExecutionState.TASK_FAIL) {
            if (recoveryAttempts < MAX_AGENT_RECOVERY_ATTEMPTS && isTransientAgentIssue(event.data.details)) {
              await retryExecution(event.data.details, event.data.step, event.data.maxSteps);
              return;
            }
            await finalizeRun('error', event.data.details);
            return;
          }

          if (event.state === ExecutionState.TASK_CANCEL) {
            await finalizeRun('aborted', event.data.details);
          }
        });

        void executor.execute().catch(async (error) => {
          if (currentExecutor !== executor || currentRunId !== runId) return;
          const messageText = error instanceof Error ? error.message : String(error);
          if (recoveryAttempts < MAX_AGENT_RECOVERY_ATTEMPTS && isTransientAgentIssue(messageText)) {
            await retryExecution(messageText, 0, settings.maxSteps);
            return;
          }
          await finalizeRun('error', undefined, messageText);
        });
      };

      startExecution();
      sendResponse({ ok: true });
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
