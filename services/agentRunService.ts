import type { AgentEvent, AgentEventKind, AgentEventStatus, AgentRun } from '../types';

const MAX_AGENT_EVENTS = 250;

const normalizeStateToken = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const classifyAgentEvent = (
  state: string,
): { kind: AgentEventKind; status: AgentEventStatus; label: string } => {
  const [scope = 'system', rawStatus = 'info'] = state.split('.');
  const kind = (['task', 'step', 'act'].includes(scope) ? scope : 'system') as 'task' | 'step' | 'act' | 'system';
  const status = (['start', 'ok', 'fail', 'cancel'].includes(rawStatus) ? rawStatus : 'info') as AgentEventStatus;
  const labelParts = [
    kind === 'act' ? 'Action' : `${scope.charAt(0).toUpperCase()}${scope.slice(1)}`,
    normalizeStateToken(rawStatus || 'info'),
  ];

  return {
    kind: kind === 'act' ? 'action' : kind,
    status,
    label: labelParts.join(' ').trim(),
  };
};

export const createAgentEvent = ({
  runId,
  actor,
  state,
  details,
  step,
  maxSteps,
  timestamp = Date.now(),
  sequence = 0,
}: {
  runId: string;
  actor: string;
  state: string;
  details: string;
  step: number;
  maxSteps: number;
  timestamp?: number;
  sequence?: number;
}): AgentEvent => {
  const meta = classifyAgentEvent(state);
  return {
    id: `${runId}-${timestamp}-${sequence}-${state}`,
    actor,
    state,
    details,
    step,
    maxSteps,
    timestamp,
    sequence,
    kind: meta.kind,
    status: meta.status,
    label: meta.label,
  };
};

export const appendAgentEvent = (run: AgentRun | null, runId: string, event: AgentEvent): AgentRun | null => {
  if (!run || run.id !== runId) {
    return run;
  }

  if (run.events.some(existing => existing.id === event.id)) {
    return run;
  }

  const nextEvents = [...run.events, event].sort((left, right) => {
    const leftOrder = left.sequence ?? left.timestamp;
    const rightOrder = right.sequence ?? right.timestamp;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.timestamp - right.timestamp;
  });

  return {
    ...run,
    events: nextEvents.slice(-MAX_AGENT_EVENTS),
  };
};
