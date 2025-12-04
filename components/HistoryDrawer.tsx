
import React, { useState, useMemo } from 'react';
import { Tab } from '../types';
import { X, History, Search, Trash2 } from 'lucide-react';

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pastConversations: Tab[];
    onRestoreTab: (id: string) => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    isOpen,
    onClose,
    pastConversations,
    onRestoreTab,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleRestore = (tabId: string) => {
        onRestoreTab(tabId);
        onClose();
    };

    const filteredHistory = useMemo(() => {
        if (!searchTerm.trim()) return pastConversations;
        const lowerTerm = searchTerm.toLowerCase();
        return pastConversations.filter(tab =>
            tab.title.toLowerCase().includes(lowerTerm) ||
            tab.messages.some(m => m.content.toLowerCase().includes(lowerTerm))
        );
    }, [pastConversations, searchTerm]);

    return (
        <div className={`
        fixed top-4 bottom-4 left-24 w-80 bg-zen-surface/95 backdrop-blur-2xl border border-zen-border/50 shadow-2xl z-40 rounded-3xl transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}
    `}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="h-14 border-b border-zen-border flex items-center justify-between px-4 bg-zen-bg/50">
                    <span className="text-sm font-bold tracking-widest text-zen-muted uppercase flex items-center gap-2">
                        <History className="w-4 h-4 text-zen-accent" />
                        History
                    </span>
                    <button onClick={onClose} className="text-zen-muted hover:text-zen-text">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zen-bg/50 border border-zen-border rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-zen-accent text-zen-text placeholder-zen-muted transition-colors"
                        />
                        <Search className="w-3.5 h-3.5 text-zen-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    <div className="space-y-2">
                        {filteredHistory.length === 0 && (
                            <div className="text-center text-xs text-zen-muted py-10 italic opacity-50">
                                {searchTerm ? 'No matches found.' : 'No past conversations.'}
                            </div>
                        )}
                        {filteredHistory.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleRestore(tab.id)}
                                className="w-full text-left p-3 rounded-xl bg-zen-bg/40 border border-zen-border/50 hover:border-zen-accent/30 hover:bg-zen-bg transition-all group"
                            >
                                <div className="text-sm font-medium text-zen-text truncate">{tab.title}</div>
                                <div className="text-xs text-zen-muted opacity-60 truncate">
                                    {new Date(tab.createdAt).toLocaleDateString()} · {tab.messages.length} msgs
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer Status */}
                <div className="p-4 border-t border-zen-border bg-zen-bg/30">
                    <div className="flex items-center justify-between text-[10px] text-zen-muted font-mono">
                        <span>STATUS</span>
                        <span className="text-green-500">OPTIMIZED</span>
                    </div>
                    <div className="w-full h-1 bg-zen-border rounded-full mt-1 overflow-hidden">
                        <div className="w-1/3 h-full bg-zen-accent"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryDrawer;
