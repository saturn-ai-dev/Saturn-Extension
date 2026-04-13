import type { AgentProfileId } from '../types';

export interface AgentProfileDefinition {
  id: AgentProfileId;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  suggestions: string[];
  runtime: {
    maxSteps: number;
    maxActionsPerStep: number;
    planningInterval: number;
    maxFailures: number;
    retryDelay: number;
    usePlannerVision: boolean;
    planOnStart: boolean;
  };
}

export const DEFAULT_AGENT_PROFILE: AgentProfileId = 'operator';

export const AGENT_PROFILES: AgentProfileDefinition[] = [
  {
    id: 'operator',
    label: 'Operator',
    shortLabel: 'Operate',
    description: 'Fast browser control for signing in, clicking through flows, and finishing tasks with minimal wandering.',
    badgeClass: 'bg-blue-500/12 text-blue-300 border-blue-400/25',
    suggestions: [
      'Open the pricing page for Notion and summarize the differences between plans.',
      'Go to GitHub, open my notifications, and tell me what needs attention.',
      'Open YouTube Studio and stop when the page needs me to sign in.',
    ],
    runtime: {
      maxSteps: 40,
      maxActionsPerStep: 2,
      planningInterval: 3,
      maxFailures: 2,
      retryDelay: 4,
      usePlannerVision: false,
      planOnStart: false,
    },
  },
  {
    id: 'researcher',
    label: 'Researcher',
    shortLabel: 'Research',
    description: 'Optimized for looking things up, comparing sources, and returning a concise answer without over-operating the browser.',
    badgeClass: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    suggestions: [
      'Find three recent articles about AI browser agents and compare their main claims.',
      'Check the current page and gather the most important facts into a quick brief.',
      'Research the official pricing and feature differences between Cursor and GitHub Copilot.',
    ],
    runtime: {
      maxSteps: 60,
      maxActionsPerStep: 2,
      planningInterval: 2,
      maxFailures: 3,
      retryDelay: 3,
      usePlannerVision: true,
      planOnStart: true,
    },
  },
  {
    id: 'scout',
    label: 'Scout',
    shortLabel: 'Scout',
    description: 'Fast current-page triage for quick answers, blockers, and the next move without wandering into long browser sessions.',
    badgeClass: 'bg-amber-500/12 text-amber-300 border-amber-400/25',
    suggestions: [
      'Check this page and tell me the main thing I should pay attention to.',
      'Open the current site section I need for billing settings and stop if login is required.',
      'Look at this page and give me the quickest answer you can with the visible evidence.',
    ],
    runtime: {
      maxSteps: 18,
      maxActionsPerStep: 1,
      planningInterval: 4,
      maxFailures: 2,
      retryDelay: 2,
      usePlannerVision: false,
      planOnStart: true,
    },
  },
];

export const getAgentProfile = (profile?: AgentProfileId): AgentProfileDefinition =>
  AGENT_PROFILES.find(item => item.id === profile) || AGENT_PROFILES[0];

export const buildAgentTaskEnvelope = ({
  task,
  profile,
  trigger = 'manual',
  pageContext,
}: {
  task: string;
  profile?: AgentProfileId;
  trigger?: 'manual' | 'auto';
  pageContext?: { url?: string; title?: string } | null;
}) => {
  const resolved = getAgentProfile(profile);
  const pageBlock = pageContext?.url
    ? `CURRENT TAB CONTEXT:
- URL: ${pageContext.url}
- Title: ${pageContext.title || 'Unknown'}
`
    : 'CURRENT TAB CONTEXT:\n- Not available\n';

  const modeBlock = resolved.id === 'researcher'
    ? `MODE: Researcher
- Prefer extracting answers from the current page or the smallest number of tabs possible.
- Prefer official or high-signal sources over noisy results.
- Do not keep browsing once the answer is sufficient.
- Return a concise synthesis with source URLs when they are visible on-page.
`
    : resolved.id === 'scout'
    ? `MODE: Scout
- Start from the current tab and visible content before navigating anywhere else.
- Prefer zero or one decisive action over open-ended browsing.
- If the answer is already visible, summarize it and stop.
- If a blocker appears, stop quickly and report the blocker plus the best next move.
`
    : `MODE: Operator
- Focus on completing the requested browser task quickly and safely.
- Prefer the current tab first and use the direct site URL when obvious.
- Avoid unnecessary searches, loops, and repeated clicks.
- If login, payment, or CAPTCHA is required, stop immediately and ask the user to continue manually.
`;

  return `SATURN AGENT TASK
Trigger: ${trigger}
${modeBlock}
${pageBlock}
EXECUTION RULES:
- Stay goal-directed. Do not explore unrelated content.
- Prefer one decisive action over long chains.
- Use the current tab first, then a direct site URL, and only then a search engine.
- If an action fails twice, change approach instead of repeating it again.
- If the requested answer is already visible, finish immediately instead of browsing more.
- Keep the final answer short, concrete, and directly useful.

USER REQUEST:
${task.trim()}`;
};
