
import React, { useState, useMemo } from 'react';
import { Tab, Bookmark, HistoryItem, Role, Message } from '../types';
import { X, History, Search, GitGraph, List, Star, Clock, MessageSquare, Globe, Trash2, Layout, ExternalLink, GitBranch } from 'lucide-react';

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    tabs: Tab[];
    activeTabId: string;
    onSelectTab: (id: string) => void;
    bookmarks: Bookmark[];
    onSelectBookmark: (b: Bookmark) => void;
    history: HistoryItem[];
    onClearHistory: () => void;
    isSidebarVisible: boolean;
    onJumpToMessage: (tabId: string, messageId: string) => void;
}

type ViewMode = 'list' | 'tree' | 'history' | 'bookmarks';

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    isOpen,
    onClose,
    tabs,
    activeTabId,
    onSelectTab,
    bookmarks,
    onSelectBookmark,
    history,
    onClearHistory,
    isSidebarVisible,
    onJumpToMessage
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Filtering ---
    const filteredTabs = useMemo(() => {
        if (!searchTerm) return tabs;
        const lower = searchTerm.toLowerCase();
        return tabs.filter(t => 
            t.title.toLowerCase().includes(lower) || 
            t.messages.some(m => m.content.toLowerCase().includes(lower))
        );
    }, [tabs, searchTerm]);

    const filteredHistory = useMemo(() => {
        if (!searchTerm) return history;
        const lower = searchTerm.toLowerCase();
        return history.filter(h => h.title.toLowerCase().includes(lower) || h.url.toLowerCase().includes(lower));
    }, [history, searchTerm]);

    const filteredBookmarks = useMemo(() => {
        if (!searchTerm) return bookmarks;
        const lower = searchTerm.toLowerCase();
        return bookmarks.filter(b => b.title.toLowerCase().includes(lower));
    }, [bookmarks, searchTerm]);

    // --- Topic Recognition Heuristic ---
    const detectTopicShift = (curr: Message, prev: Message | null): boolean => {
        if (!prev) return false;

        // 1. Time Heuristic: > 5 minutes gap implies new session/topic
        const timeDiff = curr.timestamp - prev.timestamp;
        if (timeDiff > 5 * 60 * 1000) return true;

        // 2. Continuation Heuristic: Check for connecting words
        const continuationWords = ['and', 'but', 'also', 'or', 'so', 'then', 'because', 'why', 'how'];
        const firstWord = curr.content.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, '');
        if (continuationWords.includes(firstWord)) return false; 

        // 3. Semantic Heuristic: Jaccard Similarity on keywords
        const getWords = (str: string) => {
            return new Set(
                str.toLowerCase()
                   .replace(/[^\w\s]/g, '') // Remove punctuation
                   .split(/\s+/)
                   .filter(w => w.length >= 2) // Keep words with 2+ chars
                   .filter(w => !['the', 'and', 'is', 'in', 'at', 'of', 'to', 'for', 'a', 'an', 'it', 'that', 'this'].includes(w)) // Basic stopwords
            );
        };

        const wordsA = getWords(prev.content);
        const wordsB = getWords(curr.content);

        // If strict keyword extraction failed (e.g. mostly stopwords), default to False (keep together) 
        // unless time gap handled above.
        if (wordsA.size === 0 || wordsB.size === 0) return false;

        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);

        const similarity = intersection.size / union.size;

        // Strict splitting: If absolutely no common keywords, split.
        return similarity === 0;
    };

    // --- Renderers ---

    const renderTreeView = () => (
        <div className="relative px-2 py-6">
            {filteredTabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                const isLast = index === filteredTabs.length - 1;
                
                // Filter only USER messages
                const userMessages = tab.messages.filter(m => m.role === Role.USER);
                
                // Group messages by topic branches
                const branches: Message[][] = [];
                let currentBranch: Message[] = [];
                
                userMessages.forEach((msg, i) => {
                    const prev = i > 0 ? userMessages[i-1] : null;
                    if (prev && detectTopicShift(msg, prev)) {
                        branches.push(currentBranch);
                        currentBranch = [msg];
                    } else {
                        currentBranch.push(msg);
                    }
                });
                if (currentBranch.length > 0) branches.push(currentBranch);

                return (
                    <div key={tab.id} className="relative z-10 mb-0 animate-fade-in group/branch">
                        {/* Vertical Connector for the main sequence of tabs */}
                        {!isLast && (
                            <div className="absolute left-[19px] top-10 bottom-[-40px] w-px bg-zen-border/20 z-0"></div>
                        )}

                        {/* Tab Node (Root) */}
                        <div className="flex items-start gap-4 mb-2 relative">
                             <div 
                                onClick={() => onSelectTab(tab.id)}
                                className={`
                                    w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all z-10 relative flex-shrink-0
                                    ${isActive 
                                        ? 'bg-zen-surface border-zen-accent shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.4)] text-zen-text scale-110' 
                                        : 'bg-zen-bg border-zen-border text-zen-muted hover:border-zen-text hover:bg-zen-surface'}
                                `}
                             >
                                <div className="text-[10px] font-bold text-center leading-none tracking-tighter select-none">
                                    {tab.title.substring(0, 2).toUpperCase()}
                                </div>
                             </div>
                             
                             <div onClick={() => onSelectTab(tab.id)} className="cursor-pointer pt-2 min-w-0">
                                  <div className={`text-xs font-bold transition-colors truncate pr-2 ${isActive ? 'text-zen-accent' : 'text-zen-text group-hover/branch:text-zen-text/80'}`}>
                                    {tab.title}
                                  </div>
                                  <div className="text-[9px] text-zen-muted opacity-50 font-mono mt-0.5">
                                    {new Date(tab.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                             </div>
                        </div>

                        {/* Branches Container */}
                        <div className="ml-[19px] border-l border-zen-border/20 pl-0 space-y-6 pb-8 relative pt-0">
                            {branches.map((branch, bIndex) => (
                                <div key={bIndex} className="relative animate-slide-up pl-6">
                                    
                                    {/* Branch Indicator (New Topic) */}
                                    {bIndex > 0 && (
                                        <div className="absolute -left-[1px] top-[-10px] w-6 h-6 flex items-center">
                                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zen-accent opacity-50">
                                                <path d="M1 0V12C1 16 4 19 8 19H12" stroke="currentColor" strokeWidth="1.5" />
                                             </svg>
                                        </div>
                                    )}

                                    {branch.map((msg, mIndex) => (
                                        <div 
                                            key={msg.id}
                                            onClick={() => onJumpToMessage(tab.id, msg.id)}
                                            className="relative group/msg cursor-pointer mb-4 last:mb-0"
                                        >
                                            {/* Node Connector */}
                                            <div className={`absolute -left-[25px] top-[9px] w-4 h-px transition-colors ${bIndex > 0 && mIndex === 0 ? 'bg-zen-accent/50' : 'bg-zen-border/20 group-hover/msg:bg-zen-accent/50'}`}></div>

                                            {/* Message Node Circle */}
                                            <div className={`
                                                absolute -left-[29px] top-[5px] w-2.5 h-2.5 rounded-full border-2 z-10 transition-all duration-300
                                                ${bIndex > 0 && mIndex === 0 ? 'border-zen-accent bg-zen-accent animate-pulse' : 'border-zen-border bg-zen-bg group-hover/msg:border-zen-text'}
                                            `}></div>
                                            
                                            {/* Content */}
                                            <div className="text-xs transition-colors line-clamp-2 leading-relaxed text-zen-muted group-hover/msg:text-zen-text">
                                                {msg.content || (msg.attachment ? <span className="italic">Attachment: {msg.attachment.name}</span> : '...')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            
                            {/* Empty State */}
                            {userMessages.length === 0 && (
                                <div className="text-[10px] text-zen-muted italic opacity-30 pt-4 pl-6">New conversation...</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderListView = () => (
        <div className="space-y-2 px-1">
            {filteredTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all group flex flex-col gap-1
                    ${tab.id === activeTabId 
                        ? 'bg-zen-surface border-zen-accent/50 shadow-md' 
                        : 'bg-zen-bg/50 border-zen-border hover:bg-zen-surface hover:border-zen-border'}`}
                >
                    <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold truncate ${tab.id === activeTabId ? 'text-zen-text' : 'text-zen-muted group-hover:text-zen-text'}`}>
                            {tab.title}
                        </span>
                        {tab.id === activeTabId && <div className="w-2 h-2 rounded-full bg-zen-accent shadow-[0_0_8px_var(--accent-color)]"></div>}
                    </div>
                    <div className="text-[10px] text-zen-muted flex gap-3">
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(tab.createdAt).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3"/> {tab.messages.length}</span>
                    </div>
                </button>
            ))}
        </div>
    );

    const renderHistoryView = () => (
        <div className="space-y-8 relative px-2">
             <div className="absolute left-[23px] top-2 bottom-0 w-px bg-zen-border/30"></div>
            {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zen-muted opacity-50">
                    <History className="w-12 h-12 mb-2 stroke-1" />
                    <span>No history found</span>
                </div>
            ) : (
                Object.entries(filteredHistory.reduce((acc, item) => {
                    const date = new Date(item.timestamp).toLocaleDateString();
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(item);
                    return acc;
                }, {} as Record<string, HistoryItem[]>)).map(([date, items]) => (
                    <div key={date} className="relative z-10 animate-fade-in">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-[10px] font-bold text-zen-muted shadow-sm z-10">
                                {date.split('/')[0]}/{date.split('/')[1]}
                            </div>
                            <div className="h-px flex-1 bg-zen-border/50"></div>
                        </div>
                        <div className="pl-11 space-y-2">
                            {items.map(item => (
                                <a 
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-3 rounded-xl bg-zen-bg/50 border border-zen-border/50 hover:bg-zen-surface hover:border-zen-accent/30 transition-all group"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.type === 'search' ? <Search className="w-3 h-3 text-zen-accent" /> : <Globe className="w-3 h-3 text-blue-400" />}
                                        <div className="text-xs font-bold text-zen-text truncate group-hover:text-zen-accent transition-colors">{item.title}</div>
                                        <ExternalLink className="w-3 h-3 text-zen-muted opacity-0 group-hover:opacity-100 ml-auto" />
                                    </div>
                                    <div className="text-[10px] text-zen-muted truncate opacity-60 font-mono">
                                        {item.url}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ))
            )}
            
            {filteredHistory.length > 0 && (
                <div className="flex justify-center pt-4 pl-8">
                     <button onClick={onClearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                         <Trash2 className="w-3 h-3" /> Clear History
                     </button>
                </div>
            )}
        </div>
    );

    const renderBookmarksView = () => (
        <div className="grid grid-cols-1 gap-2 px-1">
            {filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zen-muted opacity-50">
                    <Star className="w-12 h-12 mb-2 stroke-1" />
                    <span>No bookmarks yet</span>
                </div>
            ) : (
                filteredBookmarks.map(b => (
                    <button 
                        key={b.id}
                        onClick={() => onSelectBookmark(b)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-zen-bg/50 border border-zen-border hover:bg-zen-surface hover:border-yellow-500/50 transition-all group text-left"
                    >
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                            <Star className="w-4 h-4 fill-current" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-zen-text truncate">{b.title}</div>
                            <div className="text-[10px] text-zen-muted truncate font-mono opacity-70">{b.query}</div>
                        </div>
                    </button>
                ))
            )}
        </div>
    );

    return (
        <div className={`
            fixed top-4 bottom-4 w-[400px] bg-zen-surface/95 backdrop-blur-3xl border border-zen-border/50 shadow-2xl z-40 rounded-3xl transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col overflow-hidden
            ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}
            ${isSidebarVisible ? 'left-20' : 'left-4'}
        `}>
            {/* Header */}
            <div className="p-5 border-b border-zen-border bg-zen-bg/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-zen-text font-bold text-lg">
                    <GitGraph className="w-5 h-5 text-zen-accent" />
                    <span>Time Machine</span>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-zen-bg text-zen-muted hover:text-zen-text transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation & Search */}
            <div className="p-4 space-y-4 shrink-0 bg-zen-bg/20">
                {/* Mode Switcher */}
                <div className="flex p-1 bg-zen-bg rounded-xl border border-zen-border">
                    {[
                        { id: 'tree', icon: GitGraph, label: 'Tree' },
                        { id: 'list', icon: Layout, label: 'List' },
                        { id: 'history', icon: History, label: 'History' },
                        { id: 'bookmarks', icon: Star, label: 'Saved' }
                    ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as ViewMode)}
                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                                viewMode === mode.id 
                                ? 'bg-zen-surface text-zen-text shadow-sm' 
                                : 'text-zen-muted hover:text-zen-text'
                            }`}
                        >
                            <mode.icon className="w-3.5 h-3.5" />
                            {mode.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <input
                        type="text"
                        placeholder={viewMode === 'list' || viewMode === 'tree' ? "Search conversations..." : "Search history..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zen-surface border border-zen-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-zen-accent/50 focus:bg-zen-surface/80 text-zen-text placeholder-zen-muted transition-all shadow-inner"
                    />
                    <Search className="w-4 h-4 text-zen-muted absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-zen-text" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
                {viewMode === 'list' && renderListView()}
                {viewMode === 'tree' && renderTreeView()}
                {viewMode === 'history' && renderHistoryView()}
                {viewMode === 'bookmarks' && renderBookmarksView()}
            </div>
        </div>
    );
};

export default HistoryDrawer;
