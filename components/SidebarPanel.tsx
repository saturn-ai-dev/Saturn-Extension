import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Save, Trash2, GripVertical, Copy, Download, Clock, Play, Square, ExternalLink, Link2, Music2 } from 'lucide-react';
import type { AgentRun } from '../types';

interface SidebarPanelProps {
    isOpen: boolean;
    appId: string | null;
    onClose: () => void;
    sidebarWidth: number;
    position?: 'left' | 'right';
    agentRun?: AgentRun | null;
    onStartAgent?: (task: string) => void;
    onAbortAgent?: () => void;
}

const DEFAULT_SPOTIFY_URL = 'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6';

const parseSpotifyInput = (input: string) => {
    const value = input.trim();
    if (!value) return null;

    const uriMatch = value.match(/^spotify:(playlist|album|track|episode|show):([a-zA-Z0-9]+)$/i);
    if (uriMatch) {
        const [, type, id] = uriMatch;
        return {
            type: type.toLowerCase(),
            id,
            openUrl: `https://open.spotify.com/${type.toLowerCase()}/${id}`,
            embedUrl: `https://open.spotify.com/embed/${type.toLowerCase()}/${id}?utm_source=generator&theme=0`,
        };
    }

    try {
        const url = new URL(value);
        if (!url.hostname.includes('spotify.com')) return null;
        const parts = url.pathname.split('/').filter(Boolean);
        const entityIndex = parts.findIndex((part) => ['playlist', 'album', 'track', 'episode', 'show'].includes(part));
        if (entityIndex === -1 || !parts[entityIndex + 1]) return null;
        const type = parts[entityIndex];
        const id = parts[entityIndex + 1];
        return {
            type,
            id,
            openUrl: `https://open.spotify.com/${type}/${id}`,
            embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        };
    } catch {
        return null;
    }
};

const NotesWidget = () => {
    const [note, setNote] = useState(() => localStorage.getItem('saturn_sidebar_notes') || '');
    useEffect(() => { localStorage.setItem('saturn_sidebar_notes', note); }, [note]);

    const handleCopy = () => {
        navigator.clipboard.writeText(note);
    };

    const handleDownload = () => {
        const blob = new Blob([note], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scratchpad-${Date.now()}.txt`;
        a.click();
    };

    const handleTimestamp = () => {
        const ts = `[${new Date().toLocaleTimeString()}] `;
        setNote(prev => prev + ts);
    };

    return (
        <div className="flex flex-col h-full bg-zen-bg p-5">
            <div className="flex-1 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-zen-accent/20 to-transparent rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity" />
                <textarea className="relative w-full h-full bg-zen-surface border border-zen-border rounded-xl p-4 text-sm text-zen-text focus:outline-none focus:border-zen-accent focus:ring-1 focus:ring-zen-accent/50 resize-none font-mono leading-relaxed shadow-inner" placeholder="// Scratchpad initialized..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="mt-3 flex justify-between items-center text-[11px] font-medium text-zen-muted bg-zen-surface/50 p-2 rounded-lg border border-zen-border/50">
                <div className="flex gap-2">
                    <button onClick={handleTimestamp} className="hover:text-zen-text transition-colors flex items-center gap-1 p-1 rounded hover:bg-zen-bg"><Clock className="w-3 h-3" /> TS</button>
                    <button onClick={handleCopy} className="hover:text-zen-text transition-colors flex items-center gap-1 p-1 rounded hover:bg-zen-bg"><Copy className="w-3 h-3" /> Copy</button>
                    <button onClick={handleDownload} className="hover:text-zen-text transition-colors flex items-center gap-1 p-1 rounded hover:bg-zen-bg"><Download className="w-3 h-3" /> Save</button>
                </div>
                <button onClick={() => setNote('')} className="hover:text-red-400 transition-colors flex items-center gap-1 p-1 rounded hover:bg-red-500/10"><Trash2 className="w-3 h-3" /> Clear</button>
            </div>
        </div>
    )
}

const CalculatorWidget = () => {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [history, setHistory] = useState<string[]>([]);

    const normalizeParens = (expr: string) => {
        let balance = 0;
        let out = '';
        for (const ch of expr) {
            if (ch === '(') {
                balance += 1;
                out += ch;
            } else if (ch === ')') {
                if (balance > 0) {
                    balance -= 1;
                    out += ch;
                }
            } else {
                out += ch;
            }
        }
        if (balance > 0) out += ')'.repeat(balance);
        return out;
    };

    const normalizeExpression = (raw: string) => {
        let expr = raw.replace(/[+\-×÷^]+$/g, '');
        expr = normalizeParens(expr);
        expr = expr.replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\^/g, '**')
            .replace(/π/g, Math.PI.toString())
            .replace(/\be\b/g, Math.E.toString());
        return expr;
    };

    const handlePress = async (val: string) => {
        if (val === 'C') {
            setDisplay('0');
            setExpression('');
        }
        else if (val === '=') {
            try {
                // Safe calculation without eval
                const needsDisplay = display !== '0' || /\($/.test(expression);
                const rawExpr = expression + (needsDisplay ? display : '');
                const historyExpr = normalizeParens(rawExpr.replace(/[+\-×÷^]+$/g, ''));
                const expr = normalizeExpression(rawExpr);
                if (!expr) {
                    setDisplay('0');
                    setExpression('');
                    return;
                }

                let iframe = document.getElementById('saturn-sandbox') as HTMLIFrameElement;
                if (!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.id = 'saturn-sandbox';
                    iframe.src = 'sandbox.html';
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                    await new Promise(resolve => iframe.onload = resolve);
                }

                // Prepare code for sandbox
                const code = `
                    const sin = Math.sin; const cos = Math.cos; const tan = Math.tan;
                    const log = Math.log10; const ln = Math.log; const sqrt = Math.sqrt;
                    return ${expr};
                `;

                const msgId = Date.now().toString();

                const handleMessage = (event: MessageEvent) => {
                    if (event.data.id === msgId) {
                        if (event.data.success) {
                            const out = event.data.output.trim();
                            const resMatch = out.match(/> (.*)/);
                            if (resMatch) {
                                const resStr = resMatch[1];
                                const resNum = parseFloat(resStr);
                                const result = Number.isInteger(resNum) ? String(resNum) : resNum.toFixed(8).replace(/\.?0+$/, '');
                                setDisplay(result);
                                setHistory(prev => [`${historyExpr} = ${result}`, ...prev].slice(0, 5));
                            } else {
                                setDisplay('Error');
                            }
                        } else {
                            setDisplay('Error');
                        }
                        window.removeEventListener('message', handleMessage);
                    }
                };

                window.addEventListener('message', handleMessage);
                iframe.contentWindow?.postMessage({ code, id: msgId }, '*');

                setExpression('');
            } catch {
                setDisplay('Error');
            }
        }
        else if (['+', '-', '×', '÷', '^'].includes(val)) {
            setExpression(expression + display + val);
            setDisplay('0');
        }
        else if (['(', ')'].includes(val)) {
            if (display === '0') {
                setExpression(expression + val);
            } else {
                const next = val === '(' ? `${display}*${val}` : `${display}${val}`;
                setExpression(expression + next);
                setDisplay('0');
            }
        }
        else if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(val)) {
            if (display === '0') {
                setExpression(expression + `${val}(`);
            } else {
                setExpression(expression + display + `*${val}(`);
                setDisplay('0');
            }
        }
        else if (val === 'π') {
            setDisplay(String(Math.PI));
        }
        else if (val === '.') {
            if (!display.includes('.')) {
                setDisplay(display === '0' ? '0.' : display + val);
            }
        }
        else {
            setDisplay(display === '0' ? val : display + val);
        }
    };

    const btnClass = "h-14 rounded-xl bg-zen-surface border border-zen-border/50 hover:bg-zen-surface/80 hover:border-zen-accent/30 hover:text-zen-text text-zen-muted font-semibold text-lg transition-all active:scale-95 shadow-sm";
    const opClass = "h-14 rounded-xl bg-zen-bg border border-zen-border text-zen-accent font-bold text-xl hover:bg-zen-accent hover:text-white transition-all shadow-sm";
    const sciClass = "h-14 rounded-xl bg-zen-surface/30 border border-zen-border/30 text-zen-muted text-xs font-bold hover:bg-zen-surface hover:text-zen-text transition-all";

    return (
        <div className="flex flex-col h-full bg-zen-bg p-6 pb-8">
            <div className="bg-zen-surface/50 rounded-2xl p-5 mb-6 border border-zen-border shadow-inner relative overflow-hidden flex flex-col justify-end min-h-[140px]">
                {history.length > 0 && (
                    <div className="absolute top-4 right-5 text-xs text-zen-muted/50 font-mono flex flex-col items-end gap-1 pointer-events-none select-none">
                        {history.slice(0, 2).map((h, i) => <div key={i}>{h}</div>)}
                    </div>
                )}
                <div className="text-right text-zen-muted text-sm font-mono break-all opacity-70 h-6 overflow-hidden mb-1">{expression}</div>
                <div className="text-right text-4xl font-bold text-zen-text truncate font-mono tracking-tight">{display}</div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-zen-accent shadow-[0_0_15px_var(--accent-color)]"></div>
            </div>

            <div className="grid grid-cols-4 gap-3 flex-1 content-end">
                {/* Scientific Row 1 */}
                <button onClick={() => handlePress('sin')} className={sciClass}>sin</button>
                <button onClick={() => handlePress('cos')} className={sciClass}>cos</button>
                <button onClick={() => handlePress('tan')} className={sciClass}>tan</button>
                <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className="h-14 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-sm">DEL</button>

                {/* Scientific Row 2 */}
                <button onClick={() => handlePress('ln')} className={sciClass}>ln</button>
                <button onClick={() => handlePress('log')} className={sciClass}>log</button>
                <button onClick={() => handlePress('sqrt')} className={sciClass}>√</button>
                <button onClick={() => handlePress('C')} className="h-14 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-sm">AC</button>

                {/* Scientific Row 3 */}
                <button onClick={() => handlePress('(')} className={sciClass}>(</button>
                <button onClick={() => handlePress(')')} className={sciClass}>)</button>
                <button onClick={() => handlePress('^')} className={sciClass}>^</button>
                <button onClick={() => handlePress('÷')} className={opClass}>÷</button>

                {/* Numpad */}
                <button onClick={() => handlePress('7')} className={btnClass}>7</button>
                <button onClick={() => handlePress('8')} className={btnClass}>8</button>
                <button onClick={() => handlePress('9')} className={btnClass}>9</button>
                <button onClick={() => handlePress('×')} className={opClass}>×</button>

                <button onClick={() => handlePress('4')} className={btnClass}>4</button>
                <button onClick={() => handlePress('5')} className={btnClass}>5</button>
                <button onClick={() => handlePress('6')} className={btnClass}>6</button>
                <button onClick={() => handlePress('-')} className={opClass}>-</button>

                <button onClick={() => handlePress('1')} className={btnClass}>1</button>
                <button onClick={() => handlePress('2')} className={btnClass}>2</button>
                <button onClick={() => handlePress('3')} className={btnClass}>3</button>
                <button onClick={() => handlePress('+')} className={opClass}>+</button>

                <button onClick={() => handlePress('0')} className="col-span-2 h-14 rounded-xl bg-zen-surface border border-zen-border text-zen-text font-bold text-lg hover:bg-zen-surface/80 shadow-sm">0</button>
                <button onClick={() => handlePress('.')} className={btnClass}>.</button>
                <button onClick={() => handlePress('=')} className="h-14 rounded-xl bg-zen-accent text-white font-bold text-xl shadow-glow hover:bg-zen-accentHover transition-all hover:scale-105 active:scale-95">=</button>
            </div>
        </div>
    )
}

const AgentWidget = ({
    run,
    onStart,
    onAbort
}: {
    run?: AgentRun | null;
    onStart?: (task: string) => void;
    onAbort?: () => void;
}) => {
    const [task, setTask] = useState('');
    const latestEvent = run?.events[run.events.length - 1];
    const isRunning = run?.status === 'running';

    const handleRun = () => {
        if (!task.trim()) return;
        onStart?.(task.trim());
    };

    return (
        <div className="flex flex-col h-full bg-zen-bg p-5 gap-4">
            <div className="p-4 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                <div className="text-xs font-medium text-zen-muted mb-2">Task</div>
                <textarea
                    className="w-full min-h-[120px] bg-zen-bg border border-zen-border rounded-xl p-3 text-sm text-zen-text focus:outline-none focus:border-zen-accent focus:ring-1 focus:ring-zen-accent/50 resize-none"
                    placeholder="Describe what you want the agent to do..."
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                />
                <div className="mt-3 flex items-center gap-2">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${isRunning ? 'bg-zen-border text-zen-muted cursor-not-allowed' : 'bg-zen-accent text-white hover:bg-zen-accentHover'}`}
                    >
                        <Play className="w-3.5 h-3.5" />
                        Run
                    </button>
                    <button
                        onClick={() => onAbort?.()}
                        disabled={!isRunning}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${!isRunning ? 'bg-zen-border text-zen-muted cursor-not-allowed' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                    >
                        <Square className="w-3.5 h-3.5" />
                        Stop
                    </button>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm flex-1 overflow-hidden">
                <div className="text-xs font-medium text-zen-muted mb-2">Status</div>
                <div className="text-sm font-semibold text-zen-text mb-2">
                    {run ? run.status.toUpperCase() : 'IDLE'}
                </div>
                {latestEvent && (
                    <div className="text-xs text-zen-muted mb-3">
                        <div className="font-semibold">{latestEvent.actor} · {latestEvent.state}</div>
                        <div className="mt-1">{latestEvent.details}</div>
                        <div className="mt-1 opacity-70">Step {latestEvent.step + 1} / {latestEvent.maxSteps}</div>
                    </div>
                )}
                {run?.error && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-2">
                        {run.error}
                    </div>
                )}
                <div className="text-[11px] font-medium text-zen-muted mb-2">Log</div>
                <div className="space-y-2 text-xs text-zen-muted max-h-[220px] overflow-y-auto custom-scrollbar">
                    {(run?.events || []).slice(-10).map((evt) => (
                        <div key={evt.id} className="border border-zen-border/40 rounded-lg p-2 bg-zen-bg/40">
                            <div className="font-semibold text-zen-text">{evt.actor} · {evt.state}</div>
                            <div className="opacity-80">{evt.details}</div>
                        </div>
                    ))}
                    {!run?.events?.length && (
                        <div className="text-zen-muted/70">No events yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SpotifyWidget = () => {
    const [input, setInput] = useState(() => localStorage.getItem('saturn_spotify_sidebar_url') || DEFAULT_SPOTIFY_URL);
    const [activeUrl, setActiveUrl] = useState(() => localStorage.getItem('saturn_spotify_sidebar_url') || DEFAULT_SPOTIFY_URL);
    const [error, setError] = useState('');

    const parsed = parseSpotifyInput(activeUrl);

    const applyUrl = () => {
        const next = parseSpotifyInput(input);
        if (!next) {
            setError('Paste a Spotify playlist, album, track, show, or episode link.');
            return;
        }
        setError('');
        setActiveUrl(next.openUrl);
        localStorage.setItem('saturn_spotify_sidebar_url', next.openUrl);
    };

    return (
        <div className="flex flex-col h-full bg-zen-bg p-5 gap-4">
            <div className="p-4 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-green-500/15 text-green-400 flex items-center justify-center">
                        <Music2 className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-zen-text">Spotify</div>
                        <div className="text-[11px] text-zen-muted">Preview playlists and open them in the full app.</div>
                    </div>
                </div>

                <div className="relative mb-3">
                    <Link2 className="w-3.5 h-3.5 text-zen-muted/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste Spotify URL"
                        className="w-full bg-zen-bg border border-zen-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-zen-text outline-none focus:border-green-400 placeholder:text-zen-muted/50"
                    />
                </div>

                <div className="flex gap-2">
                    <button onClick={applyUrl} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-colors">
                        Preview
                    </button>
                    <button
                        onClick={() => {
                            const next = parseSpotifyInput(input) || parsed;
                            if (next) window.open(next.openUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-zen-bg border border-zen-border text-zen-text text-xs font-bold hover:border-green-400/40 hover:text-green-400 transition-colors inline-flex items-center gap-1.5"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                    </button>
                </div>

                {error && <div className="mt-2 text-[11px] text-red-400">{error}</div>}
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border border-zen-border/50 bg-black shadow-deep">
                {parsed ? (
                    <iframe
                        key={parsed.embedUrl}
                        src={parsed.embedUrl}
                        title="Spotify Sidebar Player"
                        width="100%"
                        height="100%"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="w-full h-full border-0 bg-black"
                    />
                ) : (
                    <div className="h-full flex items-center justify-center px-8 text-center text-sm text-zen-muted leading-6">
                        Paste a Spotify link to load a playable preview here.
                    </div>
                )}
            </div>
        </div>
    );
};

const SidebarPanel: React.FC<SidebarPanelProps> = ({ isOpen, appId, onClose, sidebarWidth, position = 'left', agentRun, onStartAgent, onAbortAgent }) => {
    const [key, setKey] = useState(0);
    const handleReload = () => setKey(prev => prev + 1);
    if (!appId) return null;

    let content;
    let title = '';
    let isNative = false;
    let widthClass = 'w-[420px]';

    switch (appId) {
        case 'notes':
            title = 'Scratchpad';
            isNative = true;
            content = <NotesWidget />;
            break;
        case 'calculator':
            title = 'Calculator';
            isNative = true;
            content = <CalculatorWidget />;
            break;
        case 'agent':
            title = 'Agent';
            isNative = true;
            content = <AgentWidget run={agentRun} onStart={onStartAgent} onAbort={onAbortAgent} />;
            break;
        case 'spotify':
            title = 'Spotify';
            isNative = true;
            widthClass = 'w-[460px]';
            content = <SpotifyWidget />;
            break;
        case 'twitch':
            title = 'Twitch';
            widthClass = 'w-[480px]';
            const hostname = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
            content = (
                <iframe key={`twitch-${key}`} src={`https://player.twitch.tv/?channel=monstercat&parent=${hostname}&parent=localhost&muted=false`} height="100%" width="100%" allowFullScreen className="bg-black"></iframe>
            );
            break;
        default: return null;
    }

    const isLeft = appId === 'spotify' ? false : position === 'left';
    const rightOffset = position === 'right' ? `${sidebarWidth + 14}px` : '14px';

    return (
        <div 
            className={`fixed inset-y-0 ${widthClass} bg-zen-surface/95 backdrop-blur-2xl border-zen-border shadow-deep z-40 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isLeft ? 'border-r' : 'border-l'} ${isOpen ? 'translate-x-0' : (isLeft ? '-translate-x-full' : 'translate-x-full')}`}
            style={{ 
                left: isLeft ? `${sidebarWidth + 14}px` : 'auto',
                right: isLeft ? 'auto' : rightOffset
            }}
        >
            <div className="h-14 border-b border-zen-border flex items-center justify-between px-5 bg-zen-bg/50 flex-shrink-0 select-none">
                <span className="font-semibold text-sm text-zen-text flex items-center gap-2"><GripVertical className="w-4 h-4 text-zen-muted" />{title}</span>
                <div className="flex items-center gap-1">
                    {!isNative && (<button onClick={handleReload} className="p-2 hover:bg-zen-bg rounded-lg text-zen-muted hover:text-zen-text transition-colors" title="Reload"><RefreshCw className="w-3.5 h-3.5" /></button>)}
                    <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-zen-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden bg-zen-bg">
                {isNative ? content : (<div className="w-full h-full p-0 bg-black">{content}</div>)}
            </div>
        </div>
    );
};

export default SidebarPanel;
