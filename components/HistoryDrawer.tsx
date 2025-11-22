
import React, { useState } from 'react';
import { Tab, Bookmark, HistoryItem } from '../types';
import { Star, Clock, X, ExternalLink, Disc, History, Globe, Search, Download, Trash2 } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  history?: HistoryItem[];
  onClearHistory?: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  bookmarks,
  onSelectBookmark,
  history = [],
  onClearHistory
}) => {
  const [view, setView] = useState<'tabs' | 'history'>('tabs');
  const [searchQuery, setSearchQuery] = useState('');

  const handleExportHistory = () => {
      const data = JSON.stringify(history, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saturn-history-${Date.now()}.json`;
      a.click();
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`
        fixed inset-y-0 left-16 w-80 bg-zen-surface border-r border-zen-border shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-zen-border flex items-center justify-between px-4 bg-zen-bg/50">
           <span className="text-sm font-bold tracking-widest text-zen-muted uppercase flex items-center gap-2">
             <Disc className="w-4 h-4 text-zen-accent" />
             GX Control
           </span>
           <button onClick={onClose} className="text-zen-muted hover:text-zen-text">
             <X className="w-4 h-4" />
           </button>
        </div>

        {/* Switcher */}
        <div className="p-4 pb-0">
            <div className="flex bg-zen-bg/50 p-1 rounded-lg border border-zen-border/50">
                <button 
                    onClick={() => setView('tabs')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${view === 'tabs' ? 'bg-zen-accent text-white shadow-sm' : 'text-zen-muted hover:text-zen-text'}`}
                >
                    Active
                </button>
                <button 
                    onClick={() => setView('history')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${view === 'history' ? 'bg-zen-accent text-white shadow-sm' : 'text-zen-muted hover:text-zen-text'}`}
                >
                    History
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {view === 'tabs' && (
              <div className="space-y-6 animate-fade-in">
                {/* Active Tabs Section */}
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-zen-text mb-3 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-zen-accent" />
                        Open Tabs
                    </div>
                    <div className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onSelectTab(tab.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors border border-transparent ${activeTabId === tab.id ? 'bg-zen-bg text-zen-text border-zen-border/50' : 'text-zen-muted hover:bg-zen-bg/50 hover:text-zen-text'}`}
                            >
                                {tab.title || "New Thread"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookmarks Section */}
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-zen-text mb-3 uppercase tracking-wider">
                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                        Bookmarks
                    </div>
                    <div className="space-y-1">
                        {bookmarks.length === 0 && (
                            <div className="text-xs text-zen-muted italic px-2">No bookmarks yet.</div>
                        )}
                        {bookmarks.map(bookmark => (
                            <button
                                key={bookmark.id}
                                onClick={() => onSelectBookmark(bookmark)}
                                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors text-zen-muted hover:bg-zen-bg/50 hover:text-zen-text flex items-center gap-2 group"
                            >
                                <span className="truncate flex-1">{bookmark.title}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
              </div>
          )}

          {view === 'history' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-xs font-bold text-zen-text uppercase tracking-wider">
                           <History className="w-3.5 h-3.5 text-zen-accent" />
                           Log
                       </div>
                       <div className="flex gap-1">
                           <button onClick={handleExportHistory} className="p-1.5 rounded text-zen-muted hover:text-zen-text hover:bg-zen-surface" title="Export JSON"><Download className="w-3.5 h-3.5" /></button>
                           <button onClick={onClearHistory} className="p-1.5 rounded text-zen-muted hover:text-red-500 hover:bg-zen-surface" title="Clear History"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative group">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-zen-muted group-focus-within:text-zen-accent transition-colors" />
                      <input
                          type="text"
                          placeholder="Search history..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-zen-bg/50 border border-zen-border rounded-xl pl-10 pr-4 py-2 text-sm text-zen-text placeholder-zen-muted/70 outline-none focus:border-zen-accent/50 focus:bg-zen-bg transition-all"
                      />
                  </div>

                  <div className="space-y-2">
                       {filteredHistory.length === 0 && (
                           <div className="text-center text-xs text-zen-muted py-10 italic opacity-50">
                               {searchQuery ? 'No matching results' : 'No history recorded'}
                           </div>
                       )}
                       {filteredHistory.map((item) => (
                           <div key={item.id} className="p-3 rounded-xl bg-zen-bg/40 border border-zen-border/50 hover:border-zen-accent/30 hover:bg-zen-bg transition-all group">
                               <div className="flex items-center gap-3 mb-1">
                                   <div className={`p-1.5 rounded-lg ${item.type === 'search' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                       {item.type === 'search' ? <Search className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                   </div>
                                   <span className="text-xs text-zen-muted font-mono">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                               <div className="text-sm font-medium text-zen-text truncate pl-1">{item.title}</div>
                               <div className="text-[10px] text-zen-muted truncate pl-1 opacity-60">{item.url}</div>
                           </div>
                       ))}
                  </div>
              </div>
          )}

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
