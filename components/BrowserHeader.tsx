
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, Star, MoreVertical, ShieldCheck, Download, User as UserIcon, Plus, FileText, Image as ImageIcon, Video, Puzzle, Check, X, Trash2, Globe, ShieldAlert } from 'lucide-react';
import { Tab, DownloadItem, UserProfile, Extension } from '../types';

interface BrowserHeaderProps {
  activeTab: Tab | undefined;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenSettings: () => void;
  onSearch: (query: string) => void;
  onNavigate: (url: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  downloads: DownloadItem[];
  users: UserProfile[];
  currentUser: UserProfile;
  onSwitchUser: (userId: string) => void;
  onAddUser: (name: string) => void;
  availableExtensions: Extension[];
  onToggleExtension: (id: string) => void;
  onCreateExtension?: (ext: Extension) => void;
  onDeleteExtension?: (id: string) => void;
  
  // Navigation Props
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
}

const BrowserHeader: React.FC<BrowserHeaderProps> = ({ 
  activeTab, 
  toggleSidebar, 
  isSidebarOpen, 
  onOpenSettings, 
  onSearch,
  onNavigate,
  isBookmarked,
  onToggleBookmark,
  downloads,
  users,
  currentUser,
  onSwitchUser,
  onAddUser,
  availableExtensions,
  onToggleExtension,
  onCreateExtension,
  onDeleteExtension,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onReload
}) => {
  const [input, setInput] = useState('');
  const [showDownloads, setShowDownloads] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  // Extension Creation State
  const [isCreatingExt, setIsCreatingExt] = useState(false);
  const [newExtName, setNewExtName] = useState('');
  const [newExtIcon, setNewExtIcon] = useState('🧩');
  const [newExtDesc, setNewExtDesc] = useState('');
  const [newExtInstruct, setNewExtInstruct] = useState('');

  const downloadRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const extensionRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setShowDownloads(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setIsAddingUser(false);
      }
      if (extensionRef.current && !extensionRef.current.contains(event.target as Node)) {
        // Only close if not clicking inside the creation form
        setShowExtensions(false);
        setIsCreatingExt(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync input with active tab browser state
  useEffect(() => {
    const state = activeTab?.browserState;
    
    if (state?.displayUrl) {
        setInput(state.displayUrl);
        return;
    }

    if (state?.isOpen && state.url) {
        setInput(state.url);
        return;
    }

    if (activeTab?.title) {
      const cleanTitle = activeTab.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setInput(activeTab.title.startsWith('http') ? activeTab.title : `saturn://${cleanTitle}`);
    } else {
      setInput('saturn://new-tab');
    }
  }, [activeTab?.browserState?.url, activeTab?.browserState?.displayUrl, activeTab?.browserState?.isOpen, activeTab?.browserState?.key, activeTab?.title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const trimmed = input.trim();
      
      // Enhanced URL Detection for web surfing capability
      const isUrl = /^(http(s)?:\/\/)|(www\.)|([-a-zA-Z0-9@:%._\+~#=]{2,256}\.(com|org|net|edu|gov|io|ai|co|uk|ca|de|jp|fr|au)\b)/i.test(trimmed);

      if (isUrl) {
        let url = trimmed;
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        onNavigate(url);
      } else {
        // Treat as search query
        onSearch(trimmed.replace('saturn://', ''));
      }
    }
  };

  const handleProxyLoad = () => {
      if (input && !input.startsWith('saturn://')) {
          // Use Google Translate as a reliable web proxy for browsing iframes
          const currentUrl = input.startsWith('http') ? input : `https://${input}`;
          const proxied = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(currentUrl)}`;
          onNavigate(proxied);
      }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
        onAddUser(newUserName.trim());
        setNewUserName('');
        setIsAddingUser(false);
    }
  };

  const handleCreateExtensionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newExtName.trim() && newExtInstruct.trim() && onCreateExtension) {
          const newExt: Extension = {
              id: `ext-${Date.now()}`,
              name: newExtName.trim(),
              icon: newExtIcon.trim() || '🧩',
              description: newExtDesc.trim() || 'Custom extension',
              instruction: newExtInstruct.trim()
          };
          onCreateExtension(newExt);
          // Reset
          setNewExtName('');
          setNewExtIcon('🧩');
          setNewExtDesc('');
          setNewExtInstruct('');
          setIsCreatingExt(false);
      }
  };

  const getDownloadIcon = (type: string) => {
      switch(type) {
          case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
          case 'video': return <Video className="w-4 h-4 text-pink-400" />;
          default: return <FileText className="w-4 h-4 text-blue-400" />;
      }
  };

  const enabledCount = currentUser.enabledExtensions?.length || 0;

  return (
    <div className="h-14 bg-zen-bg border-b border-zen-border flex items-center px-4 gap-4 select-none shrink-0 transition-colors duration-300 relative z-30 app-drag">
      
      {/* Navigation Controls */}
      <div className="flex items-center gap-2 text-zen-muted app-no-drag">
        <button 
            onClick={onBack}
            disabled={!canGoBack}
            className="p-2 hover:bg-zen-surface rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button 
            onClick={onForward}
            disabled={!canGoForward}
            className="p-2 hover:bg-zen-surface rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Go Forward"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button 
            onClick={onReload}
            className="p-2 hover:bg-zen-surface rounded-lg transition-colors"
            title="Reload Frame"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
         <button 
            onClick={handleProxyLoad}
            className="p-2 hover:bg-zen-surface rounded-lg transition-colors text-zen-muted hover:text-yellow-500"
            title="Unblock Site (Proxy View)"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Omnibox / Address Bar */}
      <div className="flex-1 flex justify-center max-w-3xl mx-auto app-no-drag">
        <div className="w-full h-9 bg-zen-surface/50 border border-zen-border rounded-full flex items-center px-1.5 gap-2 text-sm group focus-within:border-zen-accent/50 focus-within:bg-zen-surface focus-within:shadow-lg focus-within:shadow-zen-accent/5 transition-all relative overflow-hidden">
            
            {/* Site Info */}
            <div className="flex items-center gap-1.5 text-green-500 hover:bg-zen-bg/50 rounded-full px-3 py-1 cursor-pointer transition-colors ml-1">
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-bold hidden sm:block">SECURE</span>
            </div>

            {/* Input Field */}
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-zen-text/90 font-medium text-sm placeholder-zen-muted selection:bg-zen-accent/30 px-2 outline-none h-full"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              placeholder="Search or type a URL (e.g. google.com)"
            />

            {/* Actions */}
            <div className="flex items-center gap-1 pr-1">
                {/* Manual Go Button for URLs if detection fails */}
                <button 
                  onClick={() => {
                      let url = input.trim();
                      if (!url.startsWith('http')) url = 'https://' + url;
                      onNavigate(url);
                  }}
                  className="p-1.5 rounded-full text-zen-muted hover:bg-zen-bg hover:text-zen-text"
                  title="Go to website"
                >
                    <Globe className="w-4 h-4" />
                </button>
                <button 
                  onClick={onToggleBookmark}
                  className={`p-1.5 rounded-full transition-all ${isBookmarked ? 'text-yellow-500 bg-yellow-500/10' : 'text-zen-muted hover:bg-zen-bg hover:text-zen-text'}`}
                  title={isBookmarked ? "Remove Bookmark" : "Bookmark this tab"}
                >
                  <Star className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
                </button>
            </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 app-no-drag">
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zen-accent/10 border border-zen-accent/20">
            <ShieldCheck className="w-3 h-3 text-zen-accent" />
            <span className="text-[10px] font-bold text-zen-accent">PRO</span>
        </div>

        {/* Extensions Dropdown */}
        <div className="relative" ref={extensionRef}>
            <button 
                onClick={() => {
                    setShowExtensions(!showExtensions);
                    setIsCreatingExt(false);
                }}
                className={`p-2 rounded-full transition-colors relative ${showExtensions ? 'bg-zen-surface text-zen-text' : 'text-zen-muted hover:text-zen-text hover:bg-zen-surface'}`}
                title="Extensions"
            >
                <Puzzle className="w-4 h-4" />
                {enabledCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-zen-bg"></span>
                )}
            </button>

            {showExtensions && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-zen-surface border border-zen-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in flex flex-col">
                    
                    {/* Header */}
                    <div className="p-3 border-b border-zen-border/50 text-xs font-bold text-zen-muted uppercase tracking-wider flex justify-between items-center bg-zen-bg/50">
                        <span>{isCreatingExt ? 'Create Extension' : 'Extensions'}</span>
                        {!isCreatingExt && <span className="bg-zen-bg px-2 py-0.5 rounded text-[10px] border border-zen-border">{enabledCount} Active</span>}
                        {isCreatingExt && (
                            <button onClick={() => setIsCreatingExt(false)} className="hover:text-zen-text"><X className="w-3.5 h-3.5" /></button>
                        )}
                    </div>
                    
                    {isCreatingExt ? (
                         <div className="p-4 space-y-3">
                             <div className="flex gap-2">
                                 <input 
                                    className="w-12 bg-zen-bg border border-zen-border rounded-lg text-center py-2 text-xl focus:border-zen-accent outline-none"
                                    placeholder="🧩"
                                    maxLength={2}
                                    value={newExtIcon}
                                    onChange={e => setNewExtIcon(e.target.value)}
                                 />
                                 <input 
                                    className="flex-1 bg-zen-bg border border-zen-border rounded-lg px-3 py-2 text-sm focus:border-zen-accent outline-none text-zen-text placeholder-zen-muted"
                                    placeholder="Extension Name"
                                    value={newExtName}
                                    onChange={e => setNewExtName(e.target.value)}
                                    autoFocus
                                 />
                             </div>
                             <input 
                                className="w-full bg-zen-bg border border-zen-border rounded-lg px-3 py-2 text-xs focus:border-zen-accent outline-none text-zen-text placeholder-zen-muted"
                                placeholder="Short Description"
                                value={newExtDesc}
                                onChange={e => setNewExtDesc(e.target.value)}
                             />
                             <textarea 
                                className="w-full h-24 bg-zen-bg border border-zen-border rounded-lg px-3 py-2 text-xs focus:border-zen-accent outline-none text-zen-text placeholder-zen-muted resize-none"
                                placeholder="Be specific! E.g., 'You are a 17th century pirate. Always use nautical terms and end sentences with Arrr.'"
                                value={newExtInstruct}
                                onChange={e => setNewExtInstruct(e.target.value)}
                             />
                             <button 
                                onClick={handleCreateExtensionSubmit}
                                disabled={!newExtName || !newExtInstruct}
                                className="w-full bg-zen-text text-zen-bg font-bold py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                             >
                                 Install Extension
                             </button>
                         </div>
                    ) : (
                        <>
                            <div className="max-h-80 overflow-y-auto">
                                {availableExtensions.length === 0 && (
                                    <div className="p-6 text-center text-zen-muted text-sm">
                                        No extensions installed.
                                    </div>
                                )}
                                {availableExtensions.map(ext => {
                                    const isEnabled = currentUser.enabledExtensions?.includes(ext.id);
                                    return (
                                        <div key={ext.id} className="p-3 hover:bg-zen-bg flex items-center gap-3 border-b border-zen-border/30 last:border-0 group transition-colors relative">
                                            <div className="text-xl w-8 h-8 flex items-center justify-center bg-zen-bg rounded-lg border border-zen-border/50 group-hover:border-zen-border">{ext.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-zen-text font-medium">{ext.name}</div>
                                                <div className="text-[10px] text-zen-muted truncate">{ext.description}</div>
                                            </div>
                                            
                                            {/* Delete Action */}
                                            {onDeleteExtension && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteExtension(ext.id);
                                                    }}
                                                    className="p-1.5 text-zen-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                                                    title="Uninstall Extension"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {/* Toggle Switch */}
                                            <button 
                                                onClick={() => onToggleExtension(ext.id)}
                                                className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex-shrink-0 ${isEnabled ? 'bg-zen-accent' : 'bg-zen-border'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="p-2 border-t border-zen-border/50 bg-zen-bg/30">
                                <button 
                                    onClick={() => setIsCreatingExt(true)}
                                    className="w-full py-2 rounded-lg border border-dashed border-zen-border text-xs text-zen-muted hover:text-zen-text hover:border-zen-accent hover:bg-zen-surface transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Create / Import Extension
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* Downloads Dropdown */}
        <div className="relative" ref={downloadRef}>
            <button 
                onClick={() => setShowDownloads(!showDownloads)}
                className={`p-2 rounded-full transition-colors relative ${showDownloads ? 'bg-zen-surface text-zen-text' : 'text-zen-muted hover:text-zen-text hover:bg-zen-surface'}`}
                title="Downloads"
            >
                <Download className="w-4 h-4" />
                {downloads.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-zen-accent rounded-full border border-zen-bg"></span>
                )}
            </button>

            {showDownloads && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-zen-surface border border-zen-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-zen-border/50 text-xs font-bold text-zen-muted uppercase tracking-wider">
                        Recent Downloads
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {downloads.length === 0 ? (
                            <div className="p-4 text-center text-sm text-zen-muted italic">
                                No recent downloads
                            </div>
                        ) : (
                            downloads.slice(0, 5).map(item => (
                                <div key={item.id} className="p-3 hover:bg-zen-bg flex items-center gap-3 border-b border-zen-border/30 last:border-0">
                                    <div className="p-2 rounded-lg bg-zen-bg border border-zen-border/50">
                                        {getDownloadIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-zen-text truncate font-medium">{item.filename}</div>
                                        <div className="text-[10px] text-zen-muted">
                                            {new Date(item.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-zen-surface rounded-full text-zen-muted hover:text-zen-text transition-colors"
        >
            <MoreVertical className="w-4 h-4" />
        </button>

        {/* User Profile & Switcher */}
        <div className="relative border-l border-zen-border pl-3 ml-1" ref={userRef}>
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-transparent hover:border-zen-border transition-all ${currentUser.avatarColor}`}
            >
               {currentUser.name.substring(0, 2).toUpperCase()}
            </button>

            {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-zen-surface border border-zen-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-zen-border/50 bg-zen-bg/50">
                         <div className="text-sm font-bold text-zen-text">{currentUser.name}</div>
                         <div className="text-xs text-zen-muted">Current Session</div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto">
                        {users.map(user => (
                            <button 
                                key={user.id}
                                onClick={() => {
                                    onSwitchUser(user.id);
                                    setShowUserMenu(false);
                                }}
                                className={`w-full p-3 text-left hover:bg-zen-bg flex items-center gap-3 transition-colors ${currentUser.id === user.id ? 'bg-zen-bg/50' : ''}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${user.avatarColor}`}>
                                    {user.name.substring(0, 1)}
                                </div>
                                <span className={`text-sm ${currentUser.id === user.id ? 'text-zen-text font-medium' : 'text-zen-muted'}`}>
                                    {user.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-zen-border/50 p-2">
                        {isAddingUser ? (
                            <form onSubmit={handleAddUserSubmit} className="flex gap-2">
                                <input 
                                    autoFocus
                                    className="flex-1 bg-zen-bg border border-zen-border rounded px-2 py-1 text-sm text-zen-text outline-none focus:border-zen-accent"
                                    placeholder="Name..."
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                />
                                <button type="submit" className="p-1 rounded bg-zen-accent text-white hover:opacity-90">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <button 
                                onClick={() => setIsAddingUser(true)}
                                className="w-full py-1.5 text-xs text-zen-muted hover:text-zen-text hover:bg-zen-bg rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                Add Person
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default BrowserHeader;
