
import React, { useState, useEffect, useRef, useMemo } from 'react';
import MessageBubble from './components/MessageBubble';
import {
  Tab, Message, Role, SearchMode, Attachment, Theme,
  DownloadItem, UserProfile, Extension, BrowserState,
  HistoryItem, ThreadGroup, AgentRun, AgentEvent
} from './types';
import {
  createNewTab, streamGeminiResponse, generateImage,
  generateVideoWithModel, generateChatTitle, decideAgentUsage
} from './services/geminiService';
import { fetchGeminiModels, fetchOpenAIModels, getFallbackModelCatalog, type ModelOption } from './services/modelCatalogService';
import { sendNanobrowserMessage } from './services/nanobrowserService';
import {
  Plus, History, Settings, Trash2, RotateCcw,
  ArrowUp, Paperclip, FileText, MessageSquare,
  Bot, StickyNote, Calculator, ChevronDown, Check,
  Zap, Globe, BrainCircuit, Target, Image as ImageIcon, Video,
  Play, Square, Clock, Copy, Download, X, Key, ExternalLink, User, Box, Rocket
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppTab = 'chat' | 'agent' | 'notes' | 'calculator';

const DEFAULT_USER: UserProfile = {
  id: 'default', name: 'Guest', theme: 'red', avatarColor: 'bg-red-600',
  enabledExtensions: [], enabledSidebarApps: ['notes', 'calculator', 'agent', 'spotify', 'whatsapp', 'youtube', 'reddit', 'x'],
  customShortcuts: [], preferredModel: 'gemini-flash-latest', preferredImageModel: 'gemini-2.5-flash-image',
  nanobrowserModel: 'gemini-2.5-flash', nanobrowserVision: true, sidebarPosition: 'left',
  sidebarAutoHide: false, sidebarShowStatus: true, sidebarGlassIntensity: 70, autoRenameChats: true
};

const DEFAULT_BROWSER_STATE: BrowserState = { url: '', history: [], currentIndex: -1, isOpen: false, key: 0 };

function getInitialTab(): Tab {
  return { id: createNewTab(), title: 'New Thread', messages: [], createdAt: Date.now(), browserState: { ...DEFAULT_BROWSER_STATE } };
}

// ─── Compact Input ────────────────────────────────────────────────────────────

interface CompactInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  mode: SearchMode;
  setMode: (m: SearchMode) => void;
  onGetContext?: () => void;
  draft?: { text: string; timestamp: number };
}

const MODES: { id: SearchMode; label: string; icon: React.ReactNode }[] = [
  { id: 'fast',   label: 'Fast',   icon: <Zap     className="w-3.5 h-3.5 text-yellow-400" /> },
  { id: 'normal', label: 'Web',    icon: <Globe   className="w-3.5 h-3.5 text-blue-400" />  },
  { id: 'pro',    label: 'Deep',   icon: <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> },
  { id: 'direct', label: 'Direct', icon: <Target  className="w-3.5 h-3.5 text-red-400" />   },
  { id: 'image',  label: 'Image',  icon: <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> },
  { id: 'video',  label: 'Video',  icon: <Video   className="w-3.5 h-3.5 text-orange-400" /> },
];

const CompactInput: React.FC<CompactInputProps> = ({ onSend, disabled, mode, setMode, onGetContext, draft }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draft) {
      setInput(draft.text);
      textareaRef.current?.focus();
    }
  }, [draft]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowModeDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || disabled) return;
    onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAttachments(prev => [...prev, { file, preview: result, base64: result.split(',')[1], mimeType: file.type || 'application/octet-stream', name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setAttachments(prev => [...prev, { file, preview: result, base64: result.split(',')[1], mimeType: file.type, name: `pasted-${Date.now()}.${file.type.split('/')[1]}` }]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const currentMode = MODES.find(m => m.id === mode) || MODES[1];
  const placeholder = mode === 'image' ? 'Describe an image…' : mode === 'video' ? 'Describe a video…' : mode === 'direct' ? 'Ask for a short answer…' : 'Ask anything…';
  const canSend = (input.trim() || attachments.length > 0) && !disabled;

  return (
    <div className="w-full">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex-shrink-0 group">
              {att.mimeType.startsWith('image/') ? (
                <img src={att.preview} alt="" className="h-12 w-12 rounded-lg object-cover border border-zen-border" />
              ) : (
                <div className="h-12 w-12 rounded-lg border border-zen-border bg-zen-surface flex items-center justify-center">
                  <Paperclip className="w-4 h-4 text-zen-muted" />
                </div>
              )}
              <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input row */}
      <div className={`chat-input-shell flex items-end gap-1.5 rounded-[22px] px-2.5 py-2 transition-all duration-200 ${isFocused ? 'border-zen-accent/45 shadow-[0_0_0_1px_rgba(var(--accent-color-rgb),0.12),0_18px_40px_-28px_rgba(var(--accent-color-rgb),0.45)]' : 'hover:border-zen-border/80'}`}>
        {/* Left buttons */}
        <div className="flex items-center gap-0.5 pb-1">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple accept="*/*" />
          <button onClick={() => fileInputRef.current?.click()} disabled={mode === 'image' || mode === 'video'}
            className="p-2 rounded-xl hover:bg-zen-bg/80 text-zen-muted hover:text-zen-text transition-colors disabled:opacity-30" title="Attach">
            <Paperclip className="w-4 h-4" />
          </button>
          {onGetContext && (
            <button onClick={onGetContext} disabled={disabled}
              className="p-2 rounded-xl hover:bg-zen-bg/80 text-zen-muted hover:text-zen-text transition-colors disabled:opacity-30" title="Add page content">
              <FileText className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-zen-text placeholder-zen-muted/60 text-[13px] leading-6 resize-none py-2 px-1 min-h-[38px] max-h-[120px] overflow-y-auto caret-zen-accent disabled:opacity-50"
        />

        {/* Right: mode + send */}
        <div className="flex items-center gap-1 pb-1" ref={dropdownRef}>
          {/* Mode selector — icon only */}
          <div className="relative">
            <button
              onClick={() => setShowModeDropdown(v => !v)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zen-bg/65 hover:bg-zen-bg border border-zen-border/50 hover:border-zen-accent/40 transition-all"
              title={`Mode: ${currentMode.label}`}
            >
              {currentMode.icon}
              <ChevronDown className={`w-2.5 h-2.5 text-zen-muted transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModeDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-44 glass-elevated rounded-2xl shadow-2xl overflow-hidden z-50 p-1 animate-scale-in origin-bottom-right">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setShowModeDropdown(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs ${mode === m.id ? 'bg-zen-bg text-zen-text' : 'text-zen-muted hover:text-zen-text hover:bg-zen-bg/50'}`}>
                    {m.icon}
                    <span className="font-semibold">{m.label}</span>
                    {mode === m.id && <Check className="w-3 h-3 text-zen-accent ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send */}
          <button onClick={handleSend} disabled={!canSend}
            className={`p-2.5 rounded-[14px] transition-all duration-200 flex-shrink-0 ${canSend ? 'bg-zen-text text-zen-bg hover:bg-zen-accent hover:text-white shadow-[0_16px_35px_-22px_rgba(var(--accent-color-rgb),0.9)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95' : 'bg-zen-surface text-zen-muted cursor-not-allowed border border-zen-border'}`}>
            {disabled ? (
              <div className="w-4 h-4 animate-spin">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="20" fill="currentColor" />
                  <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                </svg>
              </div>
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Notes widget ─────────────────────────────────────────────────────────────

const NotesWidget = () => {
  const [note, setNote] = useState(() => localStorage.getItem('saturn_sidebar_notes') || '');
  useEffect(() => { localStorage.setItem('saturn_sidebar_notes', note); }, [note]);
  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <textarea
        className="flex-1 bg-zen-surface border border-zen-border rounded-xl p-3 text-sm text-zen-text focus:outline-none focus:border-zen-accent resize-none font-mono leading-relaxed"
        placeholder="// Scratchpad…"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <div className="flex items-center gap-2 text-xs text-zen-muted">
        <button onClick={() => setNote(prev => prev + `[${new Date().toLocaleTimeString()}] `)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-zen-surface hover:text-zen-text transition-colors border border-transparent hover:border-zen-border">
          <Clock className="w-3.5 h-3.5" /> Timestamp
        </button>
        <button onClick={() => navigator.clipboard.writeText(note)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-zen-surface hover:text-zen-text transition-colors border border-transparent hover:border-zen-border">
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button onClick={() => { const b = new Blob([note], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `note-${Date.now()}.txt`; a.click(); }} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-zen-surface hover:text-zen-text transition-colors border border-transparent hover:border-zen-border">
          <Download className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={() => setNote('')} className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
};

// ─── Calculator widget ────────────────────────────────────────────────────────

const CalculatorWidget = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const normalizeParens = (expr: string) => {
    let balance = 0; let out = '';
    for (const ch of expr) {
      if (ch === '(') { balance++; out += ch; }
      else if (ch === ')') { if (balance > 0) { balance--; out += ch; } }
      else out += ch;
    }
    if (balance > 0) out += ')'.repeat(balance);
    return out;
  };

  const handlePress = async (val: string) => {
    if (val === 'C') { setDisplay('0'); setExpression(''); }
    else if (val === 'DEL') { setDisplay(display.slice(0, -1) || '0'); }
    else if (val === '=') {
      try {
        const rawExpr = expression + (display !== '0' || /\($/.test(expression) ? display : '');
        const histExpr = normalizeParens(rawExpr.replace(/[+\-×÷^]+$/g, ''));
        const expr = histExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**')
          .replace(/π/g, Math.PI.toString()).replace(/\be\b/g, Math.E.toString());
        if (!expr) { setDisplay('0'); setExpression(''); return; }
        let iframe = document.getElementById('saturn-sandbox') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe'); iframe.id = 'saturn-sandbox'; iframe.src = 'sandbox.html'; iframe.style.display = 'none';
          document.body.appendChild(iframe); await new Promise(r => iframe.onload = r);
        }
        const code = `const sin=Math.sin,cos=Math.cos,tan=Math.tan,log=Math.log10,ln=Math.log,sqrt=Math.sqrt; return ${expr};`;
        const msgId = Date.now().toString();
        const handle = (e: MessageEvent) => {
          if (e.data.id !== msgId) return;
          if (e.data.success) {
            const m = e.data.output.trim().match(/> (.*)/);
            if (m) { const n = parseFloat(m[1]); const r = Number.isInteger(n) ? String(n) : n.toFixed(8).replace(/\.?0+$/, ''); setDisplay(r); setHistory(p => [`${histExpr} = ${r}`, ...p].slice(0, 5)); }
            else setDisplay('Error');
          } else setDisplay('Error');
          window.removeEventListener('message', handle);
        };
        window.addEventListener('message', handle);
        iframe.contentWindow?.postMessage({ code, id: msgId }, '*');
        setExpression('');
      } catch { setDisplay('Error'); }
    }
    else if (['+', '-', '×', '÷', '^'].includes(val)) { setExpression(expression + display + val); setDisplay('0'); }
    else if (['(', ')'].includes(val)) {
      if (display === '0') setExpression(expression + val);
      else { setExpression(expression + display + (val === '(' ? `*${val}` : val)); setDisplay('0'); }
    }
    else if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(val)) {
      if (display === '0') setExpression(expression + `${val}(`);
      else { setExpression(expression + display + `*${val}(`); setDisplay('0'); }
    }
    else if (val === 'π') setDisplay(String(Math.PI));
    else if (val === '.') { if (!display.includes('.')) setDisplay(display === '0' ? '0.' : display + '.'); }
    else setDisplay(display === '0' ? val : display + val);
  };

  const btn = "h-11 rounded-xl bg-zen-surface border border-zen-border/50 hover:bg-zen-surface/80 hover:border-zen-accent/30 text-zen-muted font-semibold text-sm transition-all active:scale-95";
  const op  = "h-11 rounded-xl bg-zen-bg border border-zen-border text-zen-accent font-bold text-base hover:bg-zen-accent hover:text-white transition-all active:scale-95";
  const sci = "h-11 rounded-xl bg-zen-surface/30 border border-zen-border/30 text-zen-muted text-xs font-bold hover:bg-zen-surface hover:text-zen-text transition-all active:scale-95";
  const del = "h-11 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs transition-all active:scale-95";

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <div className="bg-zen-surface/50 rounded-xl p-4 border border-zen-border relative overflow-hidden min-h-[90px] flex flex-col justify-end">
        {history.length > 0 && (
          <div className="absolute top-2 right-3 text-[10px] text-zen-muted/50 font-mono flex flex-col items-end gap-0.5 pointer-events-none">
            {history.slice(0, 2).map((h, i) => <div key={i}>{h}</div>)}
          </div>
        )}
        <div className="text-right text-zen-muted text-xs font-mono opacity-60 h-4 overflow-hidden mb-1">{expression}</div>
        <div className="text-right text-3xl font-bold text-zen-text truncate font-mono">{display}</div>
        <div className="absolute top-0 left-0 w-1 h-full bg-zen-accent" />
      </div>
      <div className="grid grid-cols-4 gap-1.5 flex-1 content-end">
        <button onClick={() => handlePress('sin')} className={sci}>sin</button>
        <button onClick={() => handlePress('cos')} className={sci}>cos</button>
        <button onClick={() => handlePress('tan')} className={sci}>tan</button>
        <button onClick={() => handlePress('DEL')} className={del}>DEL</button>
        <button onClick={() => handlePress('ln')}  className={sci}>ln</button>
        <button onClick={() => handlePress('log')} className={sci}>log</button>
        <button onClick={() => handlePress('sqrt')} className={sci}>√</button>
        <button onClick={() => handlePress('C')}   className={del}>AC</button>
        <button onClick={() => handlePress('(')}   className={sci}>(</button>
        <button onClick={() => handlePress(')')}   className={sci}>)</button>
        <button onClick={() => handlePress('^')}   className={sci}>^</button>
        <button onClick={() => handlePress('÷')}   className={op}>÷</button>
        {['7','8','9'].map(n => <button key={n} onClick={() => handlePress(n)} className={btn}>{n}</button>)}
        <button onClick={() => handlePress('×')} className={op}>×</button>
        {['4','5','6'].map(n => <button key={n} onClick={() => handlePress(n)} className={btn}>{n}</button>)}
        <button onClick={() => handlePress('-')} className={op}>-</button>
        {['1','2','3'].map(n => <button key={n} onClick={() => handlePress(n)} className={btn}>{n}</button>)}
        <button onClick={() => handlePress('+')} className={op}>+</button>
        <button onClick={() => handlePress('0')} className={`col-span-2 ${btn}`}>0</button>
        <button onClick={() => handlePress('.')} className={btn}>.</button>
        <button onClick={() => handlePress('=')} className="h-11 rounded-xl bg-zen-accent text-white font-bold text-lg hover:bg-zen-accentHover transition-all active:scale-95 shadow-glow">=</button>
      </div>
    </div>
  );
};

// ─── Agent widget ─────────────────────────────────────────────────────────────

const AgentWidget = ({ run, onStart, onAbort }: { run?: AgentRun | null; onStart?: (t: string) => void; onAbort?: () => void }) => {
  const [task, setTask] = useState('');
  const latestEvent = run?.events[run.events.length - 1];
  const isRunning = run?.status === 'running';
  const eventsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [run?.events]);

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Task input */}
      <div className="rounded-xl bg-zen-surface border border-zen-border/50 p-3 flex-shrink-0">
        <div className="text-[11px] font-medium text-zen-muted mb-2">Task</div>
        <textarea
          className="w-full min-h-[72px] bg-zen-bg border border-zen-border rounded-lg p-2.5 text-sm text-zen-text focus:outline-none focus:border-zen-accent resize-none"
          placeholder="Describe what you want the agent to do…"
          value={task}
          onChange={e => setTask(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button onClick={() => { if (task.trim()) onStart?.(task.trim()); }} disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isRunning ? 'bg-zen-border text-zen-muted cursor-not-allowed' : 'bg-zen-accent text-white hover:bg-zen-accentHover'}`}>
            <Play className="w-3 h-3" /> Run
          </button>
          <button onClick={() => onAbort?.()} disabled={!isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!isRunning ? 'bg-zen-border text-zen-muted cursor-not-allowed' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
            <Square className="w-3 h-3" /> Stop
          </button>
          <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-lg self-center ${run?.status === 'running' ? 'text-yellow-400 bg-yellow-400/10' : run?.status === 'success' ? 'text-green-400 bg-green-400/10' : run?.status === 'error' ? 'text-red-400 bg-red-400/10' : 'text-zen-muted bg-zen-bg'}`}>
            {run ? run.status.toUpperCase() : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Events log */}
      <div className="flex-1 rounded-xl bg-zen-surface border border-zen-border/50 p-3 overflow-hidden flex flex-col">
        <div className="text-[11px] font-medium text-zen-muted mb-2">Log</div>
        {run?.error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-2">{run.error}</div>
        )}
        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
          {(run?.events || []).length === 0 && (
            <div className="text-xs text-zen-muted/60 italic">No events yet.</div>
          )}
          {(run?.events || []).map(evt => (
            <div key={evt.id} className="border border-zen-border/40 rounded-lg p-2 bg-zen-bg/40 text-xs">
              <div className="font-semibold text-zen-text">{evt.actor} · {evt.state}</div>
              <div className="text-zen-muted mt-0.5">{evt.details}</div>
            </div>
          ))}
          <div ref={eventsEndRef} />
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar Settings ─────────────────────────────────────────────────────────

interface SidebarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  updateUser: (patch: Partial<UserProfile>) => void;
  users: UserProfile[];
  onSwitchUser: (id: string) => void;
  onAddUser: (name: string) => void;
  currentTheme: Theme;
  setCurrentTheme: (t: Theme) => void;
  customInstructions: string;
  setCustomInstructions: (s: string) => void;
  customExtensions: Extension[];
  setCustomExtensions: React.Dispatch<React.SetStateAction<Extension[]>>;
}

type SettingsTab = 'general' | 'instructions' | 'personas' | 'profile';

const SidebarSettings: React.FC<SidebarSettingsProps> = ({
  isOpen, onClose, currentUser, updateUser, users, onSwitchUser, onAddUser,
  currentTheme, setCurrentTheme, customInstructions, setCustomInstructions,
  customExtensions, setCustomExtensions,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const fallbackCatalog = getFallbackModelCatalog();
  const [geminiModels, setGeminiModels] = useState<ModelOption[]>(fallbackCatalog.geminiText);
  const [openaiModels, setOpenaiModels] = useState<ModelOption[]>(fallbackCatalog.openaiText);
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState(false);
  const [isLoadingOpenAIModels, setIsLoadingOpenAIModels] = useState(false);
  const [geminiModelsError, setGeminiModelsError] = useState('');
  const [openaiModelsError, setOpenaiModelsError] = useState('');
  const [newExtName, setNewExtName] = useState('');
  const [newExtIcon, setNewExtIcon] = useState('🎭');
  const [newExtInstruct, setNewExtInstruct] = useState('');
  const [isAddingExt, setIsAddingExt] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingGeminiModels(true);
      setGeminiModelsError('');
      try {
        const models = await fetchGeminiModels(geminiKey);
        if (cancelled) return;
        setGeminiModels(models.text);
      } catch (error: any) {
        if (cancelled) return;
        setGeminiModels(fallbackCatalog.geminiText);
        setGeminiModelsError(error?.message || 'Unable to load Gemini models');
      } finally {
        if (!cancelled) setIsLoadingGeminiModels(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [geminiKey]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingOpenAIModels(true);
      setOpenaiModelsError('');
      try {
        const models = await fetchOpenAIModels(openaiKey);
        if (cancelled) return;
        setOpenaiModels(models.text);
      } catch (error: any) {
        if (cancelled) return;
        setOpenaiModels(fallbackCatalog.openaiText);
        setOpenaiModelsError(error?.message || 'Unable to load OpenAI models');
      } finally {
        if (!cancelled) setIsLoadingOpenAIModels(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [openaiKey]);

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general',      label: 'General',      icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'instructions', label: 'Instructions', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'personas',     label: 'Personas',     icon: <Rocket className="w-3.5 h-3.5" /> },
    { id: 'profile',      label: 'Profile',      icon: <User className="w-3.5 h-3.5" /> },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex-shrink-0 ${value ? 'bg-zen-accent' : 'bg-zen-border'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-zen-border/30 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-zen-text">{label}</div>
        {sub && <div className="text-[11px] text-zen-muted leading-tight mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 bg-zen-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zen-border flex-shrink-0">
        <div className="flex items-center gap-2 text-zen-text font-bold text-sm">
          <Settings className="w-4 h-4 text-zen-accent" /> Settings
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zen-surface text-zen-muted hover:text-zen-text transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-zen-border flex-shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors relative ${activeTab === tab.id ? 'text-zen-accent' : 'text-zen-muted hover:text-zen-text'}`}>
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-zen-accent rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* ── GENERAL ── */}
        {activeTab === 'general' && (
          <>
            <div className="text-[11px] font-medium text-zen-muted mb-1">API Keys</div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zen-surface border border-zen-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zen-text">
                    <Key className="w-3.5 h-3.5 text-yellow-400" /> Gemini API Key
                  </div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                    className="text-[10px] text-zen-accent hover:underline flex items-center gap-0.5">
                    Get key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input type="password" value={geminiKey}
                  onChange={e => { setGeminiKey(e.target.value); localStorage.setItem('gemini_api_key', e.target.value); }}
                  placeholder="AIza..." className="w-full bg-zen-bg border border-zen-border rounded-lg px-3 py-2 text-xs font-mono text-zen-text outline-none focus:border-zen-accent placeholder-zen-muted/50" />
              </div>
              <div className="p-3 rounded-xl bg-zen-surface border border-zen-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zen-text">
                    <Key className="w-3.5 h-3.5 text-green-400" /> OpenAI API Key
                  </div>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
                    className="text-[10px] text-zen-accent hover:underline flex items-center gap-0.5">
                    Get key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input type="password" value={openaiKey}
                  onChange={e => { setOpenaiKey(e.target.value); localStorage.setItem('openai_api_key', e.target.value); updateUser({ openaiApiKey: e.target.value }); }}
                  placeholder="sk-..." className="w-full bg-zen-bg border border-zen-border rounded-lg px-3 py-2 text-xs font-mono text-zen-text outline-none focus:border-zen-accent placeholder-zen-muted/50" />
              </div>
            </div>

            <div className="text-[11px] font-medium text-zen-muted mt-4 mb-1">Chat Model</div>
            {geminiModelsError && <div className="mb-2 text-[10px] text-yellow-400">{geminiModelsError}</div>}
            {openaiModelsError && <div className="mb-2 text-[10px] text-yellow-400">{openaiModelsError}</div>}
            <div className="grid grid-cols-2 gap-2">
              {[...geminiModels, ...openaiModels].map(m => (
                <button key={m.id} onClick={() => updateUser({ preferredModel: m.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${currentUser.preferredModel === m.id ? 'bg-zen-bg border-zen-accent' : 'bg-zen-surface border-zen-border hover:bg-zen-bg'}`}>
                  <div className="text-xs font-bold text-zen-text">{m.name}</div>
                  <div className="text-[10px] text-zen-muted font-mono">{m.id}</div>
                </button>
              ))}
            </div>
            {(isLoadingGeminiModels || isLoadingOpenAIModels) && <div className="mt-2 text-[10px] text-zen-muted">Refreshing latest models...</div>}

            <div className="text-[11px] font-medium text-zen-muted mt-4 mb-1">Agent Model</div>
            <div className="grid grid-cols-2 gap-2">
              {[...geminiModels, ...openaiModels].map(m => (
                <button key={m.id} onClick={() => updateUser({ nanobrowserModel: m.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${(currentUser.nanobrowserModel || 'gemini-2.5-flash') === m.id ? 'bg-zen-bg border-zen-accent' : 'bg-zen-surface border-zen-border hover:bg-zen-bg'}`}>
                  <div className="text-xs font-bold text-zen-text">{m.name}</div>
                  <div className="text-[10px] text-zen-muted font-mono">{m.id}</div>
                </button>
              ))}
            </div>

            <div className="mt-2 divide-y divide-zen-border/30 rounded-xl bg-zen-surface border border-zen-border/50 px-3">
              <Row label="Agent Vision" sub="Send screenshots to the agent">
                <Toggle value={currentUser.nanobrowserVision !== false}
                  onChange={() => updateUser({ nanobrowserVision: !(currentUser.nanobrowserVision !== false) })} />
              </Row>
              <Row label="Auto-rename Chats" sub="Name threads using AI">
                <Toggle value={currentUser.autoRenameChats !== false}
                  onChange={() => updateUser({ autoRenameChats: !(currentUser.autoRenameChats !== false) })} />
              </Row>
            </div>

            <div className="text-[11px] font-medium text-zen-muted mt-4 mb-1">Theme</div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'red', color: 'bg-red-600' },
                { id: 'blue', color: 'bg-blue-600' },
                { id: 'charcoal-cosmic', color: 'bg-orange-500' },
                { id: 'galaxy', color: 'bg-fuchsia-600' },
                { id: 'blackbox', color: 'bg-gray-900 border border-gray-700' },
                { id: 'glass', color: 'bg-cyan-500' },
                { id: 'light', color: 'bg-gray-200 border border-gray-300' },
              ].map(t => (
                <button key={t.id} onClick={() => { setCurrentTheme(t.id as Theme); updateUser({ theme: t.id as Theme }); }}
                  className={`w-8 h-8 rounded-full transition-all shadow ${t.color} ${currentTheme === t.id ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-zen-bg' : 'opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          </>
        )}

        {/* ── INSTRUCTIONS ── */}
        {activeTab === 'instructions' && (
          <>
            <div className="text-[11px] font-medium text-zen-muted mb-2">Custom System Instructions</div>
            <p className="text-xs text-zen-muted mb-3">Tell Saturn how to behave — your role, preferred tone, formatting, and any context it should always keep in mind.</p>
            <textarea
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              rows={12}
              placeholder="E.g. I'm a software engineer. Be concise and use code examples. Always respond in markdown..."
              className="w-full bg-zen-surface border border-zen-border rounded-xl px-3 py-2.5 text-xs text-zen-text outline-none focus:border-zen-accent resize-none placeholder-zen-muted/50 custom-scrollbar"
            />
            <div className="text-[10px] text-zen-muted mt-1">{customInstructions.length} characters</div>
          </>
        )}

        {/* ── PERSONAS ── */}
        {activeTab === 'personas' && (
          <>
            <div className="text-[11px] font-medium text-zen-muted mb-2">Custom Personas</div>
            <div className="space-y-2">
              {customExtensions.map(ext => (
                <div key={ext.id} className="flex items-center gap-2 p-3 rounded-xl bg-zen-surface border border-zen-border/50">
                  <span className="text-lg">{ext.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zen-text truncate">{ext.name}</div>
                    <div className="text-[10px] text-zen-muted truncate">{ext.description}</div>
                  </div>
                  <button onClick={() => setCustomExtensions(prev => prev.filter(e => e.id !== ext.id))}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-zen-muted hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {customExtensions.length === 0 && !isAddingExt && (
                <div className="text-xs text-zen-muted/60 italic text-center py-4">No custom personas yet.</div>
              )}
            </div>

            {isAddingExt ? (
              <div className="mt-3 p-3 rounded-xl bg-zen-surface border border-zen-border space-y-2">
                <div className="flex gap-2">
                  <input value={newExtIcon} onChange={e => setNewExtIcon(e.target.value)}
                    className="w-12 text-center bg-zen-bg border border-zen-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-zen-accent" placeholder="🎭" />
                  <input value={newExtName} onChange={e => setNewExtName(e.target.value)}
                    className="flex-1 bg-zen-bg border border-zen-border rounded-lg px-3 py-1.5 text-xs text-zen-text outline-none focus:border-zen-accent placeholder-zen-muted/50" placeholder="Persona name" />
                </div>
                <textarea value={newExtInstruct} onChange={e => setNewExtInstruct(e.target.value)} rows={3}
                  className="w-full bg-zen-bg border border-zen-border rounded-lg px-3 py-1.5 text-xs text-zen-text outline-none focus:border-zen-accent resize-none placeholder-zen-muted/50" placeholder="Instructions for this persona..." />
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (newExtName.trim() && newExtInstruct.trim()) {
                      setCustomExtensions(prev => [...prev, { id: `ext-${Date.now()}`, name: newExtName.trim(), icon: newExtIcon || '🎭', description: newExtInstruct.trim().slice(0, 60), instruction: newExtInstruct.trim() }]);
                      setNewExtName(''); setNewExtIcon('🎭'); setNewExtInstruct(''); setIsAddingExt(false);
                    }
                  }} className="flex-1 py-1.5 bg-zen-accent text-white text-xs font-bold rounded-lg hover:bg-zen-accentHover transition-colors">Save</button>
                  <button onClick={() => setIsAddingExt(false)} className="flex-1 py-1.5 bg-zen-surface border border-zen-border text-xs font-bold rounded-lg text-zen-muted hover:text-zen-text transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingExt(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-zen-border text-xs text-zen-muted hover:text-zen-text hover:border-zen-accent transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Persona
              </button>
            )}
          </>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <>
            <div className="text-[11px] font-medium text-zen-muted mb-2">Profiles</div>
            <div className="space-y-2">
              {users.map(u => (
                <button key={u.id} onClick={() => onSwitchUser(u.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${currentUser.id === u.id ? 'bg-zen-surface border-zen-accent' : 'bg-zen-surface/50 border-zen-border hover:bg-zen-surface'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${u.avatarColor}`}>
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-bold text-zen-text truncate">{u.name}</div>
                    <div className="text-[10px] text-zen-muted">{currentUser.id === u.id ? 'Active' : u.theme}</div>
                  </div>
                  {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-zen-accent flex-shrink-0" />}
                </button>
              ))}
            </div>

            {isAddingUser ? (
              <form onSubmit={e => { e.preventDefault(); if (newUserName.trim()) { onAddUser(newUserName.trim()); setNewUserName(''); setIsAddingUser(false); } }}
                className="mt-3 flex gap-2">
                <input autoFocus value={newUserName} onChange={e => setNewUserName(e.target.value)}
                  className="flex-1 bg-zen-surface border border-zen-border rounded-lg px-3 py-1.5 text-xs text-zen-text outline-none focus:border-zen-accent placeholder-zen-muted/50" placeholder="Profile name..." />
                <button type="submit" className="px-3 py-1.5 bg-zen-accent text-white text-xs font-bold rounded-lg hover:bg-zen-accentHover transition-colors">Add</button>
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-3 py-1.5 bg-zen-surface border border-zen-border rounded-lg text-xs text-zen-muted hover:text-zen-text transition-colors">Cancel</button>
              </form>
            ) : (
              <button onClick={() => setIsAddingUser(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-zen-border text-xs text-zen-muted hover:text-zen-text hover:border-zen-accent transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Profile
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main SidebarApp ──────────────────────────────────────────────────────────

export default function SidebarApp() {
  const [users, setUsers] = useState<UserProfile[]>(() => { try { const s = localStorage.getItem('deepsearch_users'); return s ? JSON.parse(s) : [DEFAULT_USER]; } catch { return [DEFAULT_USER]; } });
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedId = localStorage.getItem('deepsearch_current_user_id');
      const parsedUsers = JSON.parse(localStorage.getItem('deepsearch_users') || '[]') as UserProfile[];
      let user = parsedUsers.find(u => u.id === savedId) || parsedUsers[0] || DEFAULT_USER;
      if (!user.enabledExtensions) user.enabledExtensions = [];
      if (!user.customShortcuts) user.customShortcuts = [];
      if (user.autoRenameChats === undefined) user.autoRenameChats = true;
      if (!user.nanobrowserModel) user.nanobrowserModel = 'gemini-2.5-flash';
      if (user.nanobrowserVision === undefined) user.nanobrowserVision = true;
      return user;
    } catch { return DEFAULT_USER; }
  });
  const [customExtensions, setCustomExtensions] = useState<Extension[]>(() => { try { const s = localStorage.getItem('deepsearch_custom_extensions'); return s ? JSON.parse(s) : []; } catch { return []; } });

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [archivedTabs, setArchivedTabs] = useState<Tab[]>([]);
  const [groups, setGroups] = useState<ThreadGroup[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [draft, setDraft] = useState<{ text: string; timestamp: number } | undefined>(undefined);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);

  const [searchMode, setSearchMode] = useState<SearchMode>('normal');
  const [currentTheme, setCurrentTheme] = useState<Theme>(currentUser.theme);
  const [isIncognito, setIsIncognito] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeAppTab, setActiveAppTab] = useState<AppTab>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Page context — auto-updated whenever the active tab changes
  const [pageContext, setPageContext] = useState<{
    url: string;
    title: string;
    content: string;   // truncated text, may be empty if scripting unavailable
    hasContent: boolean;
    fetchedAt: number;
  } | null>(null);

  // Load from shared localStorage
  useEffect(() => {
    const userId = currentUser.id;
    try {
      const data = JSON.parse(localStorage.getItem(`deepsearch_data_${userId}`) || 'null');
      if (data) {
        if (data.isIncognito) {
          const t = getInitialTab(); setTabs([t]); setActiveTabId(t.id); setArchivedTabs([]); setIsIncognito(true);
        } else {
          const validPrev = (data.tabs || []).filter((t: Tab) => t.messages.length > 0);
          const t = getInitialTab(); setTabs([t]); setActiveTabId(t.id);
          setArchivedTabs([...validPrev, ...(data.archivedTabs || [])]);
          setGroups(data.groups || []); setDownloads(data.downloads || []);
          setGlobalHistory(data.globalHistory || []); setCustomInstructions(data.customInstructions || '');
        }
      } else {
        const t = getInitialTab(); setTabs([t]); setActiveTabId(t.id);
      }
    } catch { const t = getInitialTab(); setTabs([t]); setActiveTabId(t.id); }
    setCurrentTheme(currentUser.theme);
    localStorage.setItem('deepsearch_current_user_id', userId);
  }, []);

  useEffect(() => {
    const storageKey = `deepsearch_data_${currentUser.id}`;
    const data = isIncognito ? { downloads, customInstructions, isIncognito, groups }
      : { tabs, activeTabId, archivedTabs, downloads, globalHistory, customInstructions, isIncognito, groups };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [tabs, archivedTabs, activeTabId, downloads, globalHistory, customInstructions, isIncognito, groups]);

  useEffect(() => { localStorage.setItem('deepsearch_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('deepsearch_custom_extensions', JSON.stringify(customExtensions)); }, [customExtensions]);

  useEffect(() => {
    if (currentUser.theme !== currentTheme) {
      const u = { ...currentUser, theme: currentTheme };
      setCurrentUser(u); setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    }
  }, [currentTheme]);

  useEffect(() => {
    if (isIncognito) { document.documentElement.setAttribute('data-theme', 'incognito'); document.documentElement.classList.add('dark'); }
    else {
      document.documentElement.setAttribute('data-theme', currentTheme);
      currentTheme === 'light' ? document.documentElement.classList.remove('dark') : document.documentElement.classList.add('dark');
    }
  }, [currentTheme, isIncognito]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [tabs, activeTabId]);

  // Auto-fetch page context whenever the active Chrome tab changes
  useEffect(() => {
    const fetchPageContext = async () => {
      try {
        const cr = chrome as any;
        const [tab] = await cr.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url) return;
        // Skip chrome:// and extension pages — scripting won't work there
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
          setPageContext({ url: tab.url, title: tab.title || '', content: '', hasContent: false, fetchedAt: Date.now() });
          return;
        }
        let content = '';
        let hasContent = false;
        try {
          const results = await cr.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Get meaningful text: skip nav/footer noise, cap at 6000 chars
              const selectors = ['article', 'main', '[role="main"]', '.content', '#content', 'body'];
              for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                  const text = (el as HTMLElement).innerText?.trim();
                  if (text && text.length > 200) return text.slice(0, 6000);
                }
              }
              return document.body.innerText?.trim().slice(0, 6000) || '';
            }
          });
          content = results?.[0]?.result || '';
          hasContent = content.length > 50;
        } catch {
          // scripting permission may not be available on some pages — that's fine
        }
        setPageContext({ url: tab.url, title: tab.title || '', content, hasContent, fetchedAt: Date.now() });
      } catch {
        // Not in a Chrome extension context or tabs API unavailable
      }
    };

    fetchPageContext();

    // Re-fetch when the user switches tabs or a tab finishes loading
    let onActivated: any, onUpdated: any;
    try {
      const cr = chrome as any;
      onActivated = () => fetchPageContext();
      onUpdated = (_id: number, info: any) => { if (info.status === 'complete') fetchPageContext(); };
      cr.tabs.onActivated.addListener(onActivated);
      cr.tabs.onUpdated.addListener(onUpdated);
    } catch { /* not in extension context */ }

    return () => {
      try {
        const cr = chrome as any;
        if (onActivated) cr.tabs.onActivated.removeListener(onActivated);
        if (onUpdated) cr.tabs.onUpdated.removeListener(onUpdated);
      } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (currentUser.autoRenameChats === false) return;
    const toRename = tabs.filter(t => t.messages.length > 0 && !t.renameAttempted && (t.title === 'New Thread' || t.title.length <= 33));
    if (!toRename.length) return;
    setTabs(prev => prev.map(t => toRename.find(r => r.id === t.id) ? { ...t, renameAttempted: true } : t));
    toRename.forEach(tab => {
      generateChatTitle(tab.messages).then(newTitle => {
        if (newTitle && newTitle !== 'New Chat' && newTitle !== 'New Thread')
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: newTitle } : t));
      });
    });
  }, [tabs, currentUser.autoRenameChats]);

  // Listen for agent events from the background service worker
  useEffect(() => {
    if (!chrome?.runtime?.onMessage) return;
    const handler = (message: any) => {
      if (!message?.type) return;

      if (message.type === 'NANO_AGENT_EVENT') {
        const event = message.event as AgentEvent;
        const runId = message.runId as string;
        setAgentRun(prev => {
          if (!prev || prev.id !== runId) return prev;
          return { ...prev, events: [...prev.events, event] };
        });
        return;
      }

      if (message.type === 'NANO_AGENT_DONE') {
        const runId = message.runId as string;
        const result = message.result as string | undefined;
        const status = (message.status || 'success') as AgentRun['status'];

        setAgentRun(prev => {
          if (!prev || prev.id !== runId) return prev;
          return { ...prev, status, result, finishedAt: Date.now() };
        });

        // Post result into chat and switch back to the chat tab
        if (result) {
          setTabs(prev => prev.map(tab => {
            if (tab.id !== activeTabId) return tab;
            // Replace the "Starting agent…" placeholder if it's still there, otherwise append
            const msgs = tab.messages;
            const placeholderIdx = msgs.findLastIndex(
              m => m.role === Role.MODEL && m.content.startsWith('Starting agent…')
            );
            const resultMsg: Message = {
              id: Date.now().toString(),
              role: Role.MODEL,
              content: result,
              timestamp: Date.now()
            };
            if (placeholderIdx !== -1) {
              const updated = [...msgs];
              updated[placeholderIdx] = resultMsg;
              return { ...tab, messages: updated };
            }
            return { ...tab, messages: [...msgs, resultMsg] };
          }));
          // Switch to chat tab so the user sees the answer
          setActiveAppTab('chat');
        }
        return;
      }

      if (message.type === 'NANO_AGENT_ERROR') {
        const runId = message.runId as string;
        const error = message.error as string;
        setAgentRun(prev => {
          if (!prev || prev.id !== runId) return prev;
          return { ...prev, status: 'error', error, finishedAt: Date.now() };
        });
        // Surface the error in chat too so the user doesn't have to check the agent tab
        setTabs(prev => prev.map(tab => {
          if (tab.id !== activeTabId) return tab;
          const msgs = tab.messages;
          const placeholderIdx = msgs.findLastIndex(
            m => m.role === Role.MODEL && m.content.startsWith('Starting agent…')
          );
          const errMsg: Message = {
            id: Date.now().toString(),
            role: Role.MODEL,
            content: `Agent encountered an error: ${error}`,
            timestamp: Date.now()
          };
          if (placeholderIdx !== -1) {
            const updated = [...msgs];
            updated[placeholderIdx] = errMsg;
            return { ...tab, messages: updated };
          }
          return { ...tab, messages: [...msgs, errMsg] };
        }));
        setActiveAppTab('chat');
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [activeTabId]);

  // Thread management
  const handleNewThread = () => {
    const cur = tabs.find(t => t.id === activeTabId);
    if (cur && cur.messages.length > 0) setArchivedTabs(prev => [cur, ...prev]);
    const t = getInitialTab(); setTabs([t]); setActiveTabId(t.id);
    setIsHistoryOpen(false); setActiveAppTab('chat');
  };

  const handleRestoreThread = (tabId: string) => {
    const tab = archivedTabs.find(t => t.id === tabId);
    if (!tab) return;
    const cur = tabs.find(t => t.id === activeTabId);
    if (cur && cur.messages.length > 0) setArchivedTabs(prev => [cur, ...prev.filter(t => t.id !== tabId)]);
    else setArchivedTabs(prev => prev.filter(t => t.id !== tabId));
    setTabs([tab]); setActiveTabId(tabId); setIsHistoryOpen(false); setActiveAppTab('chat');
  };

  // Manually inject page context into the draft input (button in CompactInput)
  const handleGetPageContext = async () => {
    try {
      const cr = chrome as any;
      const [tab] = await cr.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const results = await cr.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText?.trim().slice(0, 6000) || ''
      });
      const text = results?.[0]?.result || '';
      if (text) {
        // Update persistent pageContext state too
        setPageContext(prev => prev ? { ...prev, content: text, hasContent: true, fetchedAt: Date.now() } : null);
        setDraft(prev => ({
          text: (prev?.text ? prev.text + '\n\n' : '') + `[Page: ${tab.title}]\n${text}`,
          timestamp: Date.now()
        }));
      }
    } catch (e) { console.warn('Page context unavailable', e); }
  };

  // Agent
  const handleStartAgent = async (task: string) => {
    if (!task.trim() || agentRun?.status === 'running') return;
    const runId = `nano-${Date.now()}`;
    const model = currentUser.nanobrowserModel || 'gemini-2.5-flash';
    const apiKeys = { gemini: localStorage.getItem('gemini_api_key') || '', openai: localStorage.getItem('openai_api_key') || '' };
    setAgentRun({ id: runId, task, status: 'running', events: [{ id: `${runId}-start`, actor: 'system', state: 'task.starting', details: 'Starting agent…', step: 0, maxSteps: 0, timestamp: Date.now() }], startedAt: Date.now() });
    try {
      const res = await sendNanobrowserMessage({ type: 'NANO_AGENT_START', runId, task, model, apiKeys, useVision: currentUser.nanobrowserVision !== false });
      if (!res.ok) setAgentRun(prev => prev?.id === runId ? { ...prev, status: 'error', error: res.error || 'Failed.' } : prev);
    } catch (e) {
      setAgentRun(prev => prev?.id === runId ? { ...prev, status: 'error', error: e instanceof Error ? e.message : String(e) } : prev);
    }
  };

  const handleAbortAgent = async () => {
    if (agentRun?.status !== 'running') return;
    await sendNanobrowserMessage({ type: 'NANO_AGENT_ABORT', runId: agentRun.id });
  };

  // Send message
  const handleSendMessage = async (text: string, attachments?: Attachment[]) => {
    const tabId = activeTabId;
    const trimmed = text.trim();

    if (!isIncognito && trimmed)
      setGlobalHistory(prev => [{ id: `s-${Date.now()}`, title: trimmed.slice(0, 60), url: `query://${trimmed}`, timestamp: Date.now(), type: 'search' }, ...prev].slice(0, 500));

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, content: text, timestamp: Date.now(), attachments };
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const title = t.messages.length === 0 ? (text.slice(0, 30) + (text.length > 30 ? '…' : '')) : t.title;
      return { ...t, title, messages: [...t.messages, userMsg] };
    }));

    const botId = (Date.now() + 1).toString();
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: [...t.messages, { id: botId, role: Role.MODEL, content: '', timestamp: Date.now(), isStreaming: true }] } : t));

    const history = [...(tabs.find(t => t.id === tabId)?.messages || []), userMsg];

    // Build effective instructions: always inject current page context so AI knows what the user is looking at
    const pageContextBlock = pageContext
      ? [
          `\n\n[CURRENT PAGE CONTEXT]`,
          `URL: ${pageContext.url}`,
          `Title: ${pageContext.title}`,
          pageContext.hasContent
            ? `Page content (truncated):\n${pageContext.content}`
            : `(Page text content unavailable — scripting blocked on this page type)`,
          `[END PAGE CONTEXT]`,
          `You can answer questions about this page directly using the content above.`,
          `Only use browser automation if the user explicitly asks you to DO something on the page (click, scroll, fill, submit, navigate, etc.).`
        ].join('\n')
      : '';
    const effectiveInstructions = (customInstructions || '') + pageContextBlock;

    if (searchMode !== 'image' && searchMode !== 'video' && searchMode !== 'simple' && trimmed) {
      const routerPageCtx = pageContext
        ? { url: pageContext.url, title: pageContext.title, hasContent: pageContext.hasContent }
        : undefined;
      const decision = await decideAgentUsage(trimmed, currentUser.preferredModel || 'gemini-flash-latest', routerPageCtx);
      // Only fall back to keyword heuristic when keys are missing/errored AND no page context is available
      // (if we have page context, we have enough info to answer page questions without an agent)
      const hardFallback = (decision.reason === 'error' || decision.reason === 'no_keys') && !pageContext;
      const kw = /(\bopen\b|\bclick\b|\bgo to\b|\bnavigate\b|\bbook\b|\border\b|\bsign in\b|\blogin\b|\bfill out\b|\bsubmit the\b)/i;
      if ((decision.useAgent && decision.task) || (hardFallback && kw.test(trimmed))) {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, isStreaming: false, content: 'Starting agent… Switch to the Agent tab to see live status.' } : m) } : t));
        setActiveAppTab('agent');
        await handleStartAgent(decision.task || trimmed);
        return;
      }
    }

    if (searchMode === 'image') {
      try {
        const imgModel = currentUser.preferredModel?.startsWith('gpt') ? 'chatgpt-image-latest' : (currentUser.preferredImageModel || 'gemini-2.5-flash-image');
        const result = await generateImage(text, imgModel);
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, isStreaming: false, generatedMedia: result } : m) } : t));
      } catch (e) {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, isStreaming: false, content: `Error: ${e instanceof Error ? e.message : e}` } : m) } : t));
      }
    } else if (searchMode === 'video') {
      try {
        const result = await generateVideoWithModel(text, currentUser.preferredModel);
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, isStreaming: false, generatedMedia: result } : m) } : t));
      } catch {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, isStreaming: false, content: 'Error generating video.' } : m) } : t));
      }
    } else {
      const exts = customExtensions.filter(e => (currentUser.enabledExtensions || []).includes(e.id));
      await streamGeminiResponse(history, searchMode, exts, currentUser.preferredModel || 'gemini-flash-latest', effectiveInstructions,
        (chunk, sources) => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, content: m.content + chunk, sources: sources || m.sources } : m) } : t)),
        () => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, isStreaming: false } : m) } : t)),
        (err) => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, messages: t.messages.map(m => m.id === botId ? { ...m, content: m.content + `\n\n*[Error: ${err.message}]*`, isStreaming: false } : m) } : t))
      );
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);
  const isStreaming = activeTab?.messages[activeTab.messages.length - 1]?.isStreaming || false;
  const historyItems = useMemo(() => [...archivedTabs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [archivedTabs]);

  const updateUser = (patch: Partial<UserProfile>) => {
    const u = { ...currentUser, ...patch };
    setCurrentUser(u); setUsers(prev => prev.map(x => x.id === u.id ? u : x));
  };

  // Bottom tab bar config
  const appTabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: 'chat',       label: 'Chat',   icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'agent',      label: 'Agent',  icon: <Bot className="w-4 h-4" />, badge: agentRun?.status === 'running' },
    { id: 'notes',      label: 'Notes',  icon: <StickyNote className="w-4 h-4" /> },
    { id: 'calculator', label: 'Calc',   icon: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="app-shell relative flex flex-col h-[100dvh] bg-zen-bg text-zen-text font-sans overflow-hidden">

      {/* ── Header ── */}
      <div className="glass-elevated flex items-center justify-between px-3 py-2 border-b border-zen-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <svg viewBox="0 0 100 100" className="saturn-brand-logo w-5 h-5 text-zen-accent flex-shrink-0">
            <circle cx="50" cy="50" r="20" fill="currentColor" className="saturn-brand-core" />
            <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="4" className="saturn-brand-ring" />
          </svg>
          <span className="font-bold text-sm text-zen-text tracking-tight">Saturn</span>
          {activeAppTab === 'chat' && activeTab && activeTab.messages.length > 0 && (
            <span className="text-zen-muted text-xs truncate max-w-[100px] opacity-70">{activeTab.title}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={handleNewThread} title="New thread" className="p-1.5 rounded-lg hover:bg-zen-bg text-zen-muted hover:text-zen-text transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setIsHistoryOpen(v => !v)} title="Thread history"
            className={`p-1.5 rounded-lg transition-colors ${isHistoryOpen ? 'bg-zen-bg text-zen-text' : 'hover:bg-zen-bg text-zen-muted hover:text-zen-text'}`}>
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} title="Settings" className="p-1.5 rounded-lg hover:bg-zen-bg text-zen-muted hover:text-zen-text transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Page context pill ── */}
      {pageContext && !pageContext.url.startsWith('chrome://') && !pageContext.url.startsWith('chrome-extension://') && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zen-bg/60 border-b border-zen-border/50 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pageContext.hasContent ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-[10px] text-zen-muted truncate flex-1" title={pageContext.url}>
            {pageContext.title || pageContext.url}
          </span>
          {pageContext.hasContent && (
            <span className="text-[9px] text-green-400/70 font-medium flex-shrink-0">page read</span>
          )}
        </div>
      )}

      {/* ── History drawer ── */}
      {isHistoryOpen && (
        <div className="flex-shrink-0 border-b border-zen-border bg-zen-surface/60 max-h-56 overflow-y-auto">
          {historyItems.length === 0 ? (
            <div className="px-4 py-5 text-center text-zen-muted text-sm">No past threads</div>
          ) : historyItems.map(tab => (
            <div key={tab.id} onClick={() => handleRestoreThread(tab.id)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zen-bg/50 group cursor-pointer">
              <RotateCcw className="w-3 h-3 text-zen-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zen-text truncate">{tab.title}</div>
                <div className="text-[10px] text-zen-muted">
                  {tab.messages.length} msg{tab.messages.length !== 1 ? 's' : ''}
                  {tab.createdAt ? ` · ${new Date(tab.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setArchivedTabs(prev => prev.filter(t => t.id !== tab.id)); }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 text-zen-muted hover:text-red-400 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat */}
        {activeAppTab === 'chat' && (
          <div className="chat-scroll absolute inset-0 overflow-y-auto custom-scrollbar">
            {!activeTab?.messages.length ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-zen-muted px-6 text-center">
                <svg viewBox="0 0 100 100" className="saturn-brand-logo w-10 h-10 text-zen-accent opacity-80">
                  <circle cx="50" cy="50" r="20" fill="currentColor" className="saturn-brand-core" />
                  <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="4" className="saturn-brand-ring" />
                </svg>
                <span className="text-sm text-zen-text">Ask anything</span>
                <span className="text-xs leading-5 max-w-[240px]">Search, summarize the current page, or keep a focused thread without leaving the panel.</span>
              </div>
            ) : (
              <div className="px-3 pt-3 pb-3 flex flex-col gap-1">
                {activeTab.messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg}
                    onDownload={item => setDownloads(prev => [item, ...prev])}
                    onNavigate={url => window.open(url, '_blank')}
                    onEdit={text => setDraft({ text, timestamp: Date.now() })}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Agent */}
        {activeAppTab === 'agent' && (
          <div className="absolute inset-0 overflow-hidden">
            <AgentWidget run={agentRun} onStart={handleStartAgent} onAbort={handleAbortAgent} />
          </div>
        )}

        {/* Notes */}
        {activeAppTab === 'notes' && (
          <div className="absolute inset-0 overflow-hidden">
            <NotesWidget />
          </div>
        )}

        {/* Calculator */}
        {activeAppTab === 'calculator' && (
          <div className="absolute inset-0 overflow-hidden">
            <CalculatorWidget />
          </div>
        )}
      </div>

      {/* ── Input (chat only) ── */}
      {activeAppTab === 'chat' && (
        <div className="chat-compose-dock flex-shrink-0 px-3 pb-2 pt-1.5">
          <CompactInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            mode={searchMode}
            setMode={setSearchMode}
            onGetContext={handleGetPageContext}
            draft={draft}
          />
        </div>
      )}

      {/* ── Bottom tab bar ── */}
      <div className="glass-elevated flex-shrink-0 flex items-stretch border-t border-zen-border">
        {appTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveAppTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors relative ${activeAppTab === tab.id ? 'text-zen-accent bg-zen-bg/50' : 'text-zen-muted hover:text-zen-text hover:bg-zen-bg/30'}`}>
            {tab.badge && <span className="absolute top-1.5 right-1/4 w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            {tab.icon}
            <span>{tab.label}</span>
            {activeAppTab === tab.id && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-zen-accent rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── Settings overlay ── */}
      <SidebarSettings
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser} updateUser={updateUser}
        users={users}
        onSwitchUser={(id: string) => { const u = users.find(x => x.id === id); if (u) { setCurrentUser(u); setCurrentTheme(u.theme); } }}
        onAddUser={(name: string) => { const u: UserProfile = { ...DEFAULT_USER, id: Date.now().toString(), name, avatarColor: 'bg-blue-600' }; setUsers(prev => [...prev, u]); setCurrentUser(u); setCurrentTheme(u.theme); }}
        currentTheme={currentTheme} setCurrentTheme={setCurrentTheme}
        customInstructions={customInstructions} setCustomInstructions={setCustomInstructions}
        customExtensions={customExtensions} setCustomExtensions={setCustomExtensions}
      />
    </div>
  );
}
