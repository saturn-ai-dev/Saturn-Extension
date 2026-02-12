const DEFAULT_BASE_URL = 'http://127.0.0.1:3847';
const SESSION_KEY = 'saturn_browser_use_session';

interface TaskStartResponse {
  status: string;
}

interface SessionResponse {
  session_id: string;
}

interface BrowserUseEvent {
  type: string;
  final_result?: string;
  error?: string;
  step?: number;
  url?: string;
  title?: string;
  actions?: string[];
  next_goal?: string;
}

const ensureServerHealthy = async (baseUrl: string) => {
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) {
    throw new Error('Browser Use server not responding.');
  }
};

const createSession = async (baseUrl: string): Promise<string> => {
  const res = await fetch(`${baseUrl}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headless: false })
  });
  if (!res.ok) {
    throw new Error('Failed to create browser session.');
  }
  const data = (await res.json()) as SessionResponse;
  return data.session_id;
};

const ensureSession = async (baseUrl: string): Promise<string> => {
  await ensureServerHealthy(baseUrl);
  const cached = localStorage.getItem(SESSION_KEY);
  if (cached) return cached;
  const sessionId = await createSession(baseUrl);
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
};

export const resetBrowserUseSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const runBrowserUseTask = async (
  task: string,
  options?: { baseUrl?: string; maxSteps?: number; onStep?: (event: BrowserUseEvent) => void }
): Promise<string> => {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
  let sessionId = await ensureSession(baseUrl);

  const startTask = async (id: string) => (
    fetch(`${baseUrl}/session/${id}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, max_steps: options?.maxSteps })
    })
  );

  let startRes = await startTask(sessionId);
  if (startRes.status === 404) {
    resetBrowserUseSession();
    sessionId = await ensureSession(baseUrl);
    startRes = await startTask(sessionId);
  }

  if (!startRes.ok) {
    const text = await startRes.text();
    if (startRes.status === 409) {
      throw new Error('Browser Use session is busy. Try again in a moment.');
    }
    throw new Error(text || 'Failed to start browser task.');
  }

  return new Promise((resolve, reject) => {
    const events = new EventSource(`${baseUrl}/session/${sessionId}/events`);

    const cleanup = () => {
      events.close();
    };

    events.addEventListener('step', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as BrowserUseEvent;
        options?.onStep?.(data);
      } catch {
        // Ignore malformed steps.
      }
    });

    events.addEventListener('done', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as BrowserUseEvent;
        cleanup();
        resolve(data.final_result || '');
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error('Malformed completion payload.'));
      }
    });

    events.addEventListener('error', (event) => {
      cleanup();
      try {
        const data = JSON.parse((event as MessageEvent).data) as BrowserUseEvent;
        reject(new Error(data.error || 'Browser Use error.'));
      } catch {
        reject(new Error('Browser Use connection error.'));
      }
    });
  });
};
