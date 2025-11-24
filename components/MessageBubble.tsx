
import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Role, DownloadItem } from '../types';
import { User, Globe, ExternalLink, Sparkles, Volume2, Download, FileText, Play, X, Youtube, FileType, Copy, Check, Music, Video, Terminal, RotateCcw, Eye, EyeOff } from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface MessageBubbleProps {
    message: Message;
    onDownload?: (item: DownloadItem) => void;
    onNavigate?: (url: string) => void;
}

const getYoutubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
};

const getHostname = (url: string) => {
    try {
        if (!url) return 'source';
        return new URL(url).hostname.replace('www.', '');
    } catch (e) {
        return 'web';
    }
};

const getFaviconUrl = (url: string) => {
    try {
        if (!url) return null;
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    } catch (e) {
        return null;
    }
};

const LinkRenderer = ({ href, children, onNavigate }: any) => {
    const youtubeId = getYoutubeId(href);
    const isYoutube = !!youtubeId;
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onNavigate) onNavigate(href); else window.open(href, '_blank');
    };
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={`inline-flex items-center gap-1 text-zen-accent hover:underline break-all ${isYoutube ? 'font-bold' : ''}`}>
            {children}
            {isYoutube ? <Youtube className="w-3 h-3 ml-1" /> : <ExternalLink className="w-3 h-3 opacity-50" />}
        </a>
    );
};

// Custom Markdown Components
// Custom Markdown Components
const TableRenderer = ({ children }: any) => (
    <div className="overflow-x-auto my-8 rounded-2xl border border-white/10 shadow-2xl bg-white/5 backdrop-blur-md">
        <table className="w-full border-collapse text-sm text-left min-w-[600px]">{children}</table>
    </div>
);

const TableHeadRenderer = ({ children }: any) => (
    <thead className="bg-white/10 text-white font-bold uppercase tracking-wider text-xs border-b border-white/10 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        {children}
    </thead>
);

const TableBodyRenderer = ({ children }: any) => (
    <tbody className="divide-y divide-white/5 text-gray-300">
        {children}
    </tbody>
);

const TableRowRenderer = ({ children }: any) => (
    <tr className="hover:bg-white/5 transition-colors even:bg-white/[0.02] group">{children}</tr>
);

const TableHeaderCellRenderer = ({ children }: any) => (
    <th className="px-6 py-5 font-bold text-white tracking-wide whitespace-nowrap">{children}</th>
);

const TableCellRenderer = ({ children }: any) => (
    <td className="px-6 py-4 border-r border-white/5 last:border-r-0 group-hover:text-white transition-colors">{children}</td>
);

const BlockquoteRenderer = ({ children }: any) => (
    <blockquote className="relative pl-6 py-4 my-6 border-l-4 border-zen-accent bg-gradient-to-r from-zen-accent/10 to-transparent rounded-r-xl text-zen-muted italic">
        <span className="absolute -left-2 -top-2 text-4xl text-zen-accent opacity-40 font-serif">“</span>
        <div className="relative z-10">{children}</div>
    </blockquote>
);

const H1Renderer = ({ children }: any) => (
    <h1 className="text-4xl font-bold text-white mt-10 mb-6 pb-4 border-b border-white/10 flex items-center gap-4 group tracking-tight">
        <div className="w-1.5 h-8 bg-zen-accent rounded-full shadow-[0_0_15px_var(--accent-color)] group-hover:scale-y-110 transition-transform duration-300"></div>
        {children}
    </h1>
);

const H2Renderer = ({ children }: any) => (
    <h2 className="text-2xl font-bold text-white mt-10 mb-5 flex items-center gap-3 group tracking-tight">
        <span className="text-zen-accent/70 text-xl group-hover:text-zen-accent transition-colors">#</span>
        <span className="text-white/90 group-hover:text-white transition-colors">{children}</span>
    </h2>
);

const H3Renderer = ({ children }: any) => (
    <h3 className="text-xl font-bold text-white/90 mt-8 mb-4 flex items-center gap-3 tracking-wide">
        <div className="w-1.5 h-1.5 rounded-full bg-zen-accent"></div>
        {children}
    </h3>
);

const UlRenderer = ({ children }: any) => (
    <ul className="my-5 space-y-2 ml-1">{children}</ul>
);

const OlRenderer = ({ children }: any) => (
    <ol className="my-5 space-y-4 pl-2 list-none counter-reset-item">{children}</ol>
);

const LiRenderer = ({ children, ordered }: any) => {
    if (ordered) {
        return (
            <li className="flex items-start gap-4 text-gray-300 leading-relaxed group/li relative pl-2 hover:text-white transition-colors duration-200">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/20 text-[11px] font-bold text-white group-hover/li:border-zen-accent group-hover/li:bg-zen-accent group-hover/li:text-white transition-all duration-200 mt-0.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
                <span className="flex-1">{children}</span>
            </li>
        )
    }
    return (
        <li className="flex items-start gap-4 text-gray-300 leading-relaxed group/li hover:text-white transition-colors duration-200">
            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-white group-hover/li:bg-zen-accent group-hover/li:scale-125 transition-all duration-200 flex-shrink-0 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></span>
            <span className="flex-1">{children}</span>
        </li>
    );
};

const ParagraphRenderer = ({ children }: any) => (
    <p className="mb-6 leading-8 text-gray-300 text-[1.05rem] font-medium tracking-wide">{children}</p>
);

const StrongRenderer = ({ children }: any) => (
    <strong className="font-bold text-white">{children}</strong>
);

const HrRenderer = () => (
    <hr className="my-10 border-none h-px bg-white/10" />
);

const PreRenderer = ({ children }: any) => {
    return <pre className="my-6 rounded-xl bg-[#0d1117] border border-zen-border/40 shadow-xl overflow-hidden">{children}</pre>;
};

const CodeRenderer = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const codeRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (codeRef.current && !inline) {
            // @ts-ignore
            if (window.Prism) window.Prism.highlightElement(codeRef.current);
        }
    }, [children, inline, className]);

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1].toLowerCase() : '';
    // Allow execution for JavaScript/JSX
    const canExecute = ['javascript', 'js', 'jsx'].includes(language);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExecute = async () => {
        if (!canExecute) return;
        setIsExecuting(true);

        // Create invisible iframe for sandbox if not exists
        let iframe = document.getElementById('saturn-sandbox') as HTMLIFrameElement;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'saturn-sandbox';
            iframe.src = 'sandbox.html';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            // Wait for load
            await new Promise(resolve => iframe.onload = resolve);
        }

        const code = String(children);
        const msgId = Date.now().toString();

        const handleMessage = (event: MessageEvent) => {
            if (event.data.id === msgId) {
                setOutput(event.data.output);
                setIsExecuting(false);
                window.removeEventListener('message', handleMessage);
            }
        };

        window.addEventListener('message', handleMessage);
        iframe.contentWindow?.postMessage({ code, id: msgId }, '*');
    };

    if (inline) {
        return <code className="bg-zen-surface px-1.5 py-0.5 rounded-md text-zen-accent font-mono text-sm" {...props}>{children}</code>;
    }

    return (
        <div className="relative group font-sans my-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d1117]/80 backdrop-blur-md transition-all duration-300 hover:border-zen-accent/30 hover:shadow-[0_0_30px_-10px_rgba(var(--accent-color),0.3)]">
            {/* Code Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5 text-xs text-gray-400 select-none backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner" />
                    </div>
                    <span className="uppercase font-bold tracking-widest opacity-60 ml-3 text-[10px]">{language || 'TEXT'}</span>
                </div>
                <div className="flex items-center gap-3">
                    {canExecute && (
                        <button
                            onClick={handleExecute}
                            disabled={isExecuting}
                            className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-md ${isExecuting ? 'text-zen-accent bg-zen-accent/10' : 'hover:bg-white/10 text-zen-accent/80 hover:text-zen-accent'}`}
                        >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="font-bold text-[10px]">{isExecuting ? 'RUNNING...' : 'RUN'}</span>
                        </button>
                    )}
                    <button onClick={handleCopy} className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded-md transition-all text-gray-400 hover:text-white">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-bold">{copied ? 'COPIED' : 'COPY'}</span>
                    </button>
                </div>
            </div>
            {/* Code Body */}
            <div className="p-0 overflow-x-auto custom-scrollbar font-mono text-sm bg-transparent">
                <code ref={codeRef} className={`block p-5 ${className || 'language-text'} !bg-transparent !text-sm !leading-relaxed`} {...props}>
                    {children}
                </code>
            </div>

            {/* Execution Output */}
            {output !== null && (
                <div className="border-t border-white/10 bg-[#0d1117] font-sans">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#161b22]/50 border-b border-white/5">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Terminal className="w-3.5 h-3.5" />
                            Console Output
                        </div>
                        <button
                            onClick={() => setOutput(null)}
                            className="text-[10px] font-bold text-zen-muted hover:text-zen-text bg-zen-surface hover:bg-zen-surface/80 px-2 py-1 rounded border border-zen-border flex items-center gap-1 transition-colors"
                            title="Clear Output"
                        >
                            <RotateCcw className="w-3 h-3" />
                            CLEAR
                        </button>
                    </div>
                    <div className="p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar bg-black/20 border-l-2 border-zen-accent/50 ml-0">
                        {output}
                    </div>
                </div>
            )}
        </div>
    );
};

interface GeneratedFile {
    name: string;
    type: string;
    data: string;
}

const FileCard = ({ file, onDownload, onCopy }: { file: GeneratedFile, onDownload: () => void, onCopy: () => void }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyClick = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col bg-[#0d1117]/90 border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-zen-accent/30 group/file">
            <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-2.5 bg-zen-accent/10 rounded-lg border border-zen-accent/20 text-zen-accent group-hover/file:scale-110 transition-transform duration-300">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                            {file.name}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400 uppercase tracking-wider font-medium">{file.type}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">AI Generated File</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`p-2 rounded-lg transition-all ${showPreview ? 'bg-zen-accent text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Preview Code"
                    >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleCopyClick}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Copy Code"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2 px-3 py-2 bg-zen-text text-zen-bg rounded-lg text-xs font-bold hover:bg-zen-accent hover:text-white transition-all shadow-lg hover:shadow-zen-accent/20 active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {showPreview && (
                <div className="relative border-t border-white/5">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zen-accent/50 to-transparent opacity-50"></div>
                    <div className="max-h-[300px] overflow-auto custom-scrollbar bg-[#0d1117] p-0">
                        <CodeRenderer className={`language-${file.type}`} inline={false}>
                            {file.data}
                        </CodeRenderer>
                    </div>
                </div>
            )}
        </div>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onDownload, onNavigate }) => {
    const isUser = message.role === Role.USER;
    const [isCopied, setIsCopied] = useState(false);

    // Process content to extract hidden files, UI widgets, etc.
    const { cleanContent, files, widgets } = useMemo(() => {
        let text = message.content || "";

        // Extract Files
        const fileRegex = /\$\$\$FILE:::(.+?):::(.+?)\$\$\$(.+?)\$\$\$END_FILE\$\$\$/gs;
        const extractedFiles: GeneratedFile[] = [];
        text = text.replace(fileRegex, (match, name, type, data) => {
            extractedFiles.push({ name, type, data });
            return "";
        });

        // Extract Widgets
        const widgetRegex = /\$\$\$UI:(.+?):::(.+?)\$\$\$/g;
        const extractedWidgets: { type: string, content: string, original: string }[] = [];

        // We don't remove widgets from text here immediately to preserve position if we wanted inline,
        // but for now we append them at the end or handle them separately.
        // Let's remove them from markdown and render them separately
        text = text.replace(widgetRegex, (match, type, content) => {
            extractedWidgets.push({ type, content, original: match });
            return "";
        });

        return { cleanContent: text, files: extractedFiles, widgets: extractedWidgets };
    }, [message.content]);

    const handleSpeak = () => {
        if (!cleanContent) return;
        const utterance = new SpeechSynthesisUtterance(cleanContent);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
    };

    const handleCopyText = () => {
        if (!cleanContent) return;
        navigator.clipboard.writeText(cleanContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownloadPdf = () => {
        if (!cleanContent) return;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Saturn AI Response", 15, 15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const cleanText = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`{3}[\s\S]*?`{3}/g, '[Code Block]').replace(/`([^`]+)`/g, '$1');
        const splitText = doc.splitTextToSize(cleanText, 180);
        let y = 25;
        for (let i = 0; i < splitText.length; i++) {
            if (y > 280) { doc.addPage(); y = 20; }
            doc.text(splitText[i], 15, y);
            y += 7;
        }
        const filename = `saturn-result-${Date.now()}.pdf`;
        doc.save(filename);
        if (onDownload) onDownload({ id: Date.now().toString(), filename, timestamp: Date.now(), type: 'pdf' });
    };

    const handleMediaDownload = async (e: React.MouseEvent, uri: string, type: 'image' | 'video') => {
        e.preventDefault();
        const filename = `generated-${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`;

        try {
            // Check if it's a data URI
            if (uri.startsWith('data:')) {
                const response = await fetch(uri);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            } else {
                // Regular URL (e.g. for video or external images)
                const link = document.createElement('a');
                link.href = uri;
                link.download = filename;
                link.target = "_blank"; // Fallback for some browsers
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            if (onDownload) onDownload({ id: Date.now().toString(), filename, timestamp: Date.now(), type, uri });
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback to simple anchor click if blob conversion fails
            const link = document.createElement('a');
            link.href = uri;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const handleGeneratedFileDownload = (file: GeneratedFile) => {
        try {
            const blob = new Blob([file.data], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            if (onDownload) onDownload({ id: Date.now().toString(), filename: file.name, timestamp: Date.now(), type: 'file' });
        } catch (e) {
            console.error("File download failed:", e);
        }
    };

    const handleCopyFile = (content: string) => {
        navigator.clipboard.writeText(content);
        // We could show a toast here, but for now we'll rely on the button state change if we had one, 
        // or just the user knowing it worked. Let's add a temporary visual feedback in the button.
    };

    const handleWidgetAction = (type: string, content: string) => {
        if (type === 'BUTTON' && onNavigate) {
            // Special handling if button content is a URL-like
            if (content.startsWith('http')) onNavigate(content);
            else if (onDownload) {
                // Simulate sending a message? No, we need a way to send message back
                // For now, we can't send message back easily without prop drilling handleSendMessage
                // But we can try to use a window event or just console log
                console.log("Button clicked:", content);
                // Ideally call onSend(content)
            }
        }
    };

    if (message.iframeUrl) return null;

    const renderAttachment = () => {
        if (!message.attachment) return null;
        const type = message.attachment.mimeType;
        if (type === 'application/pdf') {
            return (
                <div className="flex items-center gap-4 p-4 min-w-[200px] bg-zen-surface rounded-xl border border-zen-border shadow-sm">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><FileType className="w-8 h-8" /></div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-zen-text truncate">{message.attachment.name || "Document.pdf"}</div>
                        <div className="text-xs text-zen-muted uppercase tracking-wider">PDF Document</div>
                    </div>
                </div>
            );
        }
        if (type.startsWith('audio/')) {
            return (
                <div className="flex items-center gap-4 p-4 min-w-[250px] bg-zen-surface rounded-xl border border-zen-border shadow-sm">
                    <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500"><Music className="w-8 h-8" /></div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-zen-text truncate">{message.attachment.name || "Audio Clip"}</div>
                        <audio controls src={message.attachment.preview} className="h-8 w-full mt-2" />
                    </div>
                </div>
            );
        }
        if (type.startsWith('video/')) {
            return (
                <div className="rounded-xl overflow-hidden border border-zen-border shadow-lg bg-black">
                    <video src={message.attachment.preview} controls className="max-w-md max-h-[400px]" />
                </div>
            );
        }
        return <img src={message.attachment.preview} alt="Uploaded" className="max-w-md max-h-[400px] object-cover rounded-xl border border-zen-border" />;
    };

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-10 animate-slide-up group`}>
            <div className={`flex gap-6 max-w-[90%] lg:max-w-[85%] w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-500 group-hover:scale-110 shadow-lg
          ${isUser ? 'glass-panel text-zen-text' : 'bg-zen-text text-zen-bg shadow-glow'}
        `}>
                    {isUser ? <User className="w-5 h-5" /> : (
                        <svg viewBox="0 0 100 100" className="w-6 h-6 animate-spin-slow">
                            <circle cx="50" cy="50" r="20" fill="currentColor" />
                            <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                        </svg>
                    )}
                </div>

                <div className={`flex flex-col gap-1 min-w-0 flex-1 ${isUser ? 'items-end' : 'items-start'}`}>

                    <div className={`text-[10px] font-bold text-zen-muted/50 flex gap-2 items-center tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase ${isUser ? 'block' : 'hidden'}`}>
                        <span>{isUser ? 'YOU' : 'SATURN AI'}</span>
                    </div>

                    {message.attachment && <div className="mb-2">{renderAttachment()}</div>}

                    {files.length > 0 && (
                        <div className="grid gap-3 mb-6 w-full max-w-2xl">
                            {files.map((file, idx) => (
                                <FileCard
                                    key={idx}
                                    file={file}
                                    onDownload={() => handleGeneratedFileDownload(file)}
                                    onCopy={() => handleCopyFile(file.data)}
                                />
                            ))}
                        </div>
                    )}

                    {message.generatedMedia && (
                        <div className="mb-6 w-full max-w-2xl animate-scale-in">
                            <div className="rounded-3xl overflow-hidden border border-zen-border shadow-deep bg-black relative group/media">
                                {message.generatedMedia.type === 'image' ? (
                                    <img src={message.generatedMedia.uri} alt="Generated" className="w-full h-auto max-h-[600px] object-contain" />
                                ) : (
                                    <video src={message.generatedMedia.uri} controls className="w-full h-auto max-h-[600px]" autoPlay loop muted />
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-3 px-1">
                                <span className="text-xs font-bold text-zen-muted flex items-center gap-2 uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 text-zen-accent" />
                                    Generated {message.generatedMedia.type}
                                </span>
                                <button onClick={(e) => handleMediaDownload(e, message.generatedMedia!.uri, message.generatedMedia!.type)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-zen-accent hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95">
                                    <Download className="w-3.5 h-3.5" />
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {(cleanContent || (!isUser && !cleanContent && !message.attachment && !message.generatedMedia)) && (
                        <div className={`
                rounded-3xl text-lg leading-8 relative w-full transition-all duration-500
                ${isUser ? 'bg-zen-surface/80 backdrop-blur-md text-zen-text rounded-tr-sm border border-zen-border hover:shadow-glow-lg px-8 py-6 shadow-lg' : 'text-zen-text rounded-tl-sm border-none px-0 py-0'}
            `}>
                            {isUser ? (
                                <p className="whitespace-pre-wrap font-medium">{cleanContent}</p>
                            ) : (
                                <div className={`markdown-content prose prose-neutral prose-lg max-w-none dark:prose-invert prose-p:leading-relaxed prose-li:marker:text-zen-accent prose-a:text-zen-accent prose-a:no-underline hover:prose-a:underline ${message.isStreaming ? 'opacity-90' : 'opacity-100'}`}>
                                    {cleanContent ? (
                                        <>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: (props) => <LinkRenderer {...props} onNavigate={onNavigate} />,
                                                    table: TableRenderer,
                                                    thead: TableHeadRenderer,
                                                    tbody: TableBodyRenderer,
                                                    tr: TableRowRenderer,
                                                    th: TableHeaderCellRenderer,
                                                    td: TableCellRenderer,
                                                    blockquote: BlockquoteRenderer,
                                                    pre: PreRenderer,
                                                    code: CodeRenderer,
                                                    h1: H1Renderer,
                                                    h2: H2Renderer,
                                                    h3: H3Renderer,
                                                    ul: UlRenderer,
                                                    ol: OlRenderer,
                                                    li: LiRenderer,
                                                    p: ParagraphRenderer,
                                                    hr: HrRenderer,
                                                    strong: StrongRenderer
                                                }}
                                            >
                                                {cleanContent}
                                            </ReactMarkdown>
                                            {message.isStreaming && <span className="inline-block w-2 h-5 bg-zen-accent ml-1 animate-pulse align-middle rounded-full shadow-[0_0_10px_var(--accent-color)]"></span>}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-3 text-zen-muted italic">
                                            <div className="w-2 h-2 bg-zen-accent rounded-full animate-pulse"></div>
                                            <span className="text-xs font-medium tracking-wider">THINKING...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* WIDGETS RENDERING */}
                            {!isUser && widgets.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    {widgets.map((w, i) => (
                                        <div key={i} className="animate-fade-in">
                                            {w.type === 'BUTTON' && (
                                                <button className="w-full py-3 px-4 bg-zen-surface border border-zen-border rounded-xl hover:bg-zen-accent hover:text-white hover:border-transparent transition-all font-bold text-sm shadow-sm active:scale-95 interactive-element">
                                                    {w.content}
                                                </button>
                                            )}
                                            {w.type === 'INFO' && (
                                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-sm flex items-start gap-3">
                                                    <div className="mt-0.5"><Sparkles className="w-4 h-4" /></div>
                                                    <div>{w.content}</div>
                                                </div>
                                            )}
                                            {w.type === 'INPUT' && (
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder={w.content} className="flex-1 bg-zen-bg border border-zen-border rounded-xl px-4 py-2 text-sm focus:border-zen-accent outline-none" />
                                                    <button className="px-4 py-2 bg-zen-text text-zen-bg rounded-xl font-bold text-sm hover:bg-zen-accent hover:text-white transition-colors">Send</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isUser && cleanContent && !message.isStreaming && (
                                <div className="flex gap-2 mt-4 pt-2 border-t border-zen-border/30 transition-opacity duration-300 animate-fade-in">
                                    <button onClick={handleSpeak} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold active:scale-95" title="Read Aloud"><Volume2 className="w-4 h-4" /><span className="hidden sm:inline">Read</span></button>
                                    <button onClick={handleCopyText} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold active:scale-95" title="Copy"><Copy className="w-4 h-4" /><span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span></button>
                                    <button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold active:scale-95" title="Export PDF"><FileText className="w-4 h-4" /><span className="hidden sm:inline">PDF</span></button>
                                </div>
                            )}
                        </div>
                    )}

                    {!isUser && message.sources && message.sources.length > 0 && (
                        <div className="mt-8 w-full pt-4 border-t border-zen-border/30">
                            <div className="flex items-center gap-2 text-xs font-bold text-zen-muted mb-4 uppercase tracking-widest pl-2">
                                <Globe className="w-3.5 h-3.5 text-zen-accent" />
                                Verified Sources
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {message.sources.map((source, idx) => {
                                    const ytId = getYoutubeId(source.uri);
                                    const hostname = getHostname(source.uri);
                                    const favicon = getFaviconUrl(source.uri);

                                    return (
                                        <div key={idx} className="flex flex-col bg-white/5 border border-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-zen-accent/50 hover:shadow-lg group/source hover:-translate-y-1">
                                            <a href={source.uri || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); if (source.uri) { if (onNavigate) onNavigate(source.uri); else window.open(source.uri, '_blank'); } }} className="flex items-center gap-3 p-4 w-full relative overflow-hidden">

                                                {ytId ? (
                                                    <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-zen-border group-hover/source:border-red-500 transition-colors">
                                                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover scale-150" alt="YT" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shadow-md">
                                                                <Play className="w-2.5 h-2.5 text-white fill-current ml-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-zen-bg border border-zen-border group-hover/source:border-zen-accent/50 transition-colors overflow-hidden">
                                                        {favicon ? (
                                                            <>
                                                                <img
                                                                    src={favicon}
                                                                    alt=""
                                                                    className="w-6 h-6 object-contain opacity-90 group-hover/source:opacity-100 transition-opacity"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                                <Globe className="w-5 h-5 text-zen-muted hidden" />
                                                            </>
                                                        ) : (
                                                            <Globe className="w-5 h-5 text-zen-muted" />
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0 text-left z-10">
                                                    <div className="text-sm font-semibold truncate text-zen-text group-hover/source:text-zen-accent transition-colors leading-tight mb-0.5">{source.title || hostname || "Source"}</div>
                                                    <div className="text-[10px] text-zen-muted truncate flex items-center gap-1 opacity-70">
                                                        {hostname}
                                                        {ytId && <span className="bg-red-500 text-white px-1.5 rounded-[3px] text-[8px] uppercase tracking-wider font-bold ml-1">YouTube</span>}
                                                    </div>
                                                </div>
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
