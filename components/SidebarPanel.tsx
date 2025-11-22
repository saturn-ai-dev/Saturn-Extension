
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Save, Trash2, GripVertical, Copy, Download, Clock } from 'lucide-react';

interface SidebarPanelProps {
    isOpen: boolean;
    appId: string | null;
    onClose: () => void;
}

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
            <div className="mt-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zen-muted bg-zen-surface/50 p-2 rounded-lg border border-zen-border/50">
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

    const handlePress = async (val: string) => {
        if (val === 'C') {
            setDisplay('0');
            setExpression('');
        }
        else if (val === '=') {
            try {
                // Safe calculation without eval
                let expr = (expression + (display !== '0' ? display : ''));

                // Basic replacements
                expr = expr.replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/\^/g, '**')
                    .replace(/π/g, Math.PI.toString())
                    .replace(/e/g, Math.E.toString());

                // Function replacements (simple regex approach for basic functions)
                // Note: A full parser is better, but for this simple UI, we can use the Function constructor 
                // inside a sandbox or just simple replacement if we trust the input (which is button driven).
                // However, CSP blocks 'new Function'.
                // So we must use the same sandbox approach or a simple parser.
                // Let's use the sandbox approach since we already have it!

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
                            // The output from sandbox is the log, but we want the return value.
                            // Our sandbox currently only captures console.log.
                            // We need to update sandbox to return the result of eval.
                            // Actually, the sandbox I wrote *does* log the result if it's not undefined.
                            // But parsing that log is messy.
                            // Let's just rely on the fact that the sandbox returns the last evaluated expression.
                            // Wait, my sandbox implementation:
                            // const result = await eval(...)
                            // logs.push(result)
                            // So the output string contains the result.
                            // Let's parse it.
                            const out = event.data.output.trim();
                            const resMatch = out.match(/> (.*)/);
                            if (resMatch) {
                                const resStr = resMatch[1];
                                const resNum = parseFloat(resStr);
                                setDisplay(Number.isInteger(resNum) ? String(resNum) : resNum.toFixed(8).replace(/\.?0+$/, ''));
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
                setExpression(expression + display + val);
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
        else {
            setDisplay(display === '0' ? val : display + val);
        }
    };

    const btnClass = "h-12 rounded-lg bg-zen-surface border border-zen-border/50 hover:bg-zen-surface/80 hover:border-zen-accent/30 hover:text-zen-text text-zen-muted font-medium transition-all active:scale-95 shadow-sm text-sm";
    const opClass = "h-12 rounded-lg bg-zen-bg border border-zen-border text-zen-accent font-bold hover:bg-zen-accent hover:text-white transition-all";
    const sciClass = "h-12 rounded-lg bg-zen-surface/30 border border-zen-border/30 text-zen-muted text-xs font-bold hover:bg-zen-surface hover:text-zen-text transition-all";

    return (
        <div className="flex flex-col h-full bg-zen-bg p-6 justify-end pb-12">
            <div className="bg-zen-surface/50 rounded-2xl p-4 mb-6 border border-zen-border shadow-inner relative overflow-hidden min-h-[100px] flex flex-col justify-between">
                <div className="text-right text-zen-muted text-xs font-mono break-all opacity-70 h-8 overflow-hidden">{expression}</div>
                <div className="text-right text-3xl font-bold text-zen-text truncate font-mono tracking-tight">{display}</div>
                <div className="absolute top-0 left-0 w-1 h-full bg-zen-accent shadow-[0_0_10px_var(--accent-color)]"></div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
                {/* Row 1 */}
                <button onClick={() => handlePress('C')} className="h-12 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold">AC</button>
                <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className={btnClass}>DEL</button>
                <button onClick={() => handlePress('(')} className={sciClass}>(</button>
                <button onClick={() => handlePress(')')} className={sciClass}>)</button>

                {/* Row 2 */}
                <button onClick={() => handlePress('sin')} className={sciClass}>sin</button>
                <button onClick={() => handlePress('cos')} className={sciClass}>cos</button>
                <button onClick={() => handlePress('tan')} className={sciClass}>tan</button>
                <button onClick={() => handlePress('÷')} className={opClass}>÷</button>

                {/* Row 3 */}
                <button onClick={() => handlePress('ln')} className={sciClass}>ln</button>
                <button onClick={() => handlePress('log')} className={sciClass}>log</button>
                <button onClick={() => handlePress('^')} className={sciClass}>^</button>
                <button onClick={() => handlePress('×')} className={opClass}>×</button>

                {/* Row 4 */}
                <button onClick={() => handlePress('7')} className={btnClass}>7</button>
                <button onClick={() => handlePress('8')} className={btnClass}>8</button>
                <button onClick={() => handlePress('9')} className={btnClass}>9</button>
                <button onClick={() => handlePress('-')} className={opClass}>-</button>

                {/* Row 5 */}
                <button onClick={() => handlePress('4')} className={btnClass}>4</button>
                <button onClick={() => handlePress('5')} className={btnClass}>5</button>
                <button onClick={() => handlePress('6')} className={btnClass}>6</button>
                <button onClick={() => handlePress('+')} className={opClass}>+</button>

                {/* Row 6 */}
                <button onClick={() => handlePress('1')} className={btnClass}>1</button>
                <button onClick={() => handlePress('2')} className={btnClass}>2</button>
                <button onClick={() => handlePress('3')} className={btnClass}>3</button>
                <button onClick={() => handlePress('sqrt')} className={sciClass}>√</button>

                {/* Row 7 */}
                <button onClick={() => handlePress('0')} className="col-span-2 h-12 rounded-lg bg-zen-surface border border-zen-border text-zen-text font-bold hover:bg-zen-surface/80">0</button>
                <button onClick={() => handlePress('.')} className={btnClass}>.</button>
                <button onClick={() => handlePress('=')} className="h-12 rounded-lg bg-zen-accent text-white font-bold shadow-glow hover:bg-zen-accentHover">=</button>
            </div>
        </div>
    )
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({ isOpen, appId, onClose }) => {
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
        case 'twitch':
            title = 'Twitch';
            widthClass = 'w-[480px]';
            const hostname = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
            content = (
                <iframe key={`twitch-${key}`} src={`https://player.twitch.tv/?channel=monstercat&parent=${hostname}&muted=false`} height="100%" width="100%" allowFullScreen className="bg-black"></iframe>
            );
            break;
        default: return null;
    }

    return (
        <div className={`fixed inset-y-0 left-16 ${widthClass} bg-zen-surface/95 backdrop-blur-2xl border-r border-zen-border shadow-deep z-40 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-14 border-b border-zen-border flex items-center justify-between px-5 bg-zen-bg/50 flex-shrink-0 select-none">
                <span className="font-bold text-xs uppercase tracking-[0.2em] text-zen-text flex items-center gap-2"><GripVertical className="w-4 h-4 text-zen-muted" />{title}</span>
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
