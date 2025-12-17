import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tab, ThreadGroup } from '../types';
import { X, History, Search, FolderPlus, Folder, FolderOpen, ChevronRight, ChevronDown, MoreVertical, Edit2, Trash2, Check, CornerUpLeft, MessageSquare, Calendar } from 'lucide-react';

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pastConversations: Tab[];
    onRestoreTab: (id: string) => void;
    groups: ThreadGroup[];
    onCreateGroup: (name: string) => void;
    onDeleteGroup: (id: string) => void;
    onRenameGroup: (id: string, name: string) => void;
    onMoveTabToGroup: (tabId: string, groupId?: string) => void;
    onDeleteArchivedTab: (tabId: string) => void;
    onRenameArchivedTab?: (tabId: string, newTitle: string) => void;
    sidebarWidth: number;
    position?: 'left' | 'right';
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    isOpen,
    onClose,
    pastConversations,
    onRestoreTab,
    groups,
    onCreateGroup,
    onDeleteGroup,
    onRenameGroup,
    onMoveTabToGroup,
    onDeleteArchivedTab, // Destructure the prop here
    onRenameArchivedTab,
    sidebarWidth,
    position = 'left'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    
    // For the "Move to" menu
    const [movingTabId, setMovingTabId] = useState<string | null>(null);
    const moveMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moveMenuRef.current && !moveMenuRef.current.contains(event.target as Node)) {
                setMovingTabId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRestore = (tabId: string) => {
        onRestoreTab(tabId);
        onClose();
    };

    const toggleGroup = (id: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedGroups(newSet);
    };

    const handleCreateGroup = () => {
        if (newGroupName.trim()) {
            onCreateGroup(newGroupName.trim());
            setNewGroupName('');
            setIsCreatingGroup(false);
        }
    };

    const startRenaming = (group: ThreadGroup) => {
        setEditingGroupId(group.id);
        setRenameValue(group.name);
    };

    const finishRenaming = () => {
        if (editingGroupId && renameValue.trim()) {
            onRenameGroup(editingGroupId, renameValue.trim());
        }
        setEditingGroupId(null);
    };

    const { grouped, uncategorized } = useMemo(() => {
        let filtered = pastConversations;
        if (searchTerm.trim()) {
             const lowerTerm = searchTerm.toLowerCase();
             filtered = pastConversations.filter(tab =>
                tab.title.toLowerCase().includes(lowerTerm) ||
                tab.messages.some(m => m.content.toLowerCase().includes(lowerTerm))
            );
        }

        const grouped: Record<string, Tab[]> = {};
        const uncategorized: Tab[] = [];

        filtered.forEach(tab => {
            if (tab.groupId && groups.some(g => g.id === tab.groupId)) {
                if (!grouped[tab.groupId]) grouped[tab.groupId] = [];
                grouped[tab.groupId].push(tab);
            } else {
                uncategorized.push(tab);
            }
        });

        return { grouped, uncategorized };
    }, [pastConversations, groups, searchTerm]);

    // Auto-expand groups if searching
    useEffect(() => {
        if (searchTerm.trim()) {
            const allGroupIds = groups.map(g => g.id);
            setExpandedGroups(new Set(allGroupIds));
        }
    }, [searchTerm, groups]);

    return (
        <div 
            className={`
                fixed top-4 bottom-4 w-[500px] bg-zen-surface/95 backdrop-blur-2xl border border-zen-border/50 shadow-2xl z-40 rounded-3xl transform transition-all duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0 opacity-100' : (position === 'left' ? '-translate-x-10' : 'translate-x-10') + ' opacity-0 pointer-events-none'}
            `}
            style={{ 
                left: position === 'left' ? `${sidebarWidth + 24}px` : 'auto',
                right: position === 'right' ? `${sidebarWidth + 24}px` : 'auto'
            }}
        >
            {/* Header */}
            <div className="h-16 border-b border-zen-border flex items-center justify-between px-6 bg-zen-bg/50 shrink-0">
                <span className="text-base font-bold tracking-widest text-zen-muted uppercase flex items-center gap-2">
                    <History className="w-5 h-5 text-zen-accent" />
                    Deep History
                </span>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-zen-bg text-zen-muted hover:text-zen-text transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Search & Actions */}
            <div className="p-6 pb-4 shrink-0 space-y-4">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="w-full bg-zen-bg/50 border border-zen-border rounded-2xl py-3 pl-11 pr-10 text-sm focus:outline-none focus:border-zen-accent focus:bg-zen-bg text-zen-text placeholder-zen-muted transition-all shadow-sm group-hover:border-zen-border/80"
                    />
                    <Search className="w-5 h-5 text-zen-muted absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-hover:text-zen-text" />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zen-muted hover:text-zen-text p-1 rounded-full hover:bg-zen-surface transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {!isCreatingGroup ? (
                    <button 
                        onClick={() => setIsCreatingGroup(true)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-zen-muted hover:text-zen-accent py-2.5 border border-dashed border-zen-border rounded-xl hover:border-zen-accent/50 hover:bg-zen-bg/30 transition-all"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Create New Project Group
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-fade-in bg-zen-bg p-2 rounded-xl border border-zen-border shadow-lg">
                        <Folder className="w-4 h-4 text-zen-accent ml-2" />
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Project Name"
                            className="flex-1 bg-transparent border-none px-2 py-1 text-sm focus:outline-none text-zen-text font-medium"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                        />
                        <button onClick={handleCreateGroup} className="p-1.5 hover:bg-green-500/10 text-green-500 hover:text-green-400 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsCreatingGroup(false)} className="p-1.5 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 custom-scrollbar">
                <div className="space-y-6">
                    {/* Groups */}
                    {groups.map(group => (
                        <div key={group.id} className="space-y-2">
                            <div className="flex items-center justify-between group/header px-3 py-2 rounded-xl hover:bg-zen-bg/50 transition-colors cursor-pointer select-none" onClick={() => toggleGroup(group.id)}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-1 rounded bg-zen-surface border border-zen-border text-zen-muted group-hover/header:text-zen-text group-hover/header:border-zen-accent/50 transition-all">
                                        {expandedGroups.has(group.id) ? 
                                            <ChevronDown className="w-3.5 h-3.5" /> : 
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        }
                                    </div>
                                    {editingGroupId === group.id ? (
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={finishRenaming}
                                            onKeyDown={(e) => e.key === 'Enter' && finishRenaming()}
                                            className="bg-transparent border-b border-zen-accent focus:outline-none text-sm font-bold text-zen-text w-full"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zen-text truncate">
                                                {group.name}
                                            </span>
                                            <span className="text-[10px] text-zen-muted font-medium">
                                                {grouped[group.id]?.length || 0} items
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity bg-zen-bg/80 rounded-lg p-1 backdrop-blur-sm border border-zen-border/50 shadow-sm">
                                    <button onClick={(e) => { e.stopPropagation(); startRenaming(group); }} className="p-1.5 text-zen-muted hover:text-zen-text hover:bg-zen-surface rounded-md transition-colors" title="Rename">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }} className="p-1.5 text-zen-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {(expandedGroups.has(group.id) || searchTerm) && (
                                <div className="pl-4 space-y-2 relative">
                                    <div className="absolute left-[1.1rem] top-0 bottom-0 w-px bg-gradient-to-b from-zen-border/50 to-transparent"></div>
                                    <div className="pl-6 space-y-3">
                                        {grouped[group.id]?.map(tab => (
                                            <HistoryItem
                                                key={tab.id}
                                                tab={tab}
                                                searchTerm={searchTerm}
                                                onRestore={handleRestore}
                                                onMove={(groupId) => onMoveTabToGroup(tab.id, groupId)}
                                                onDelete={onDeleteArchivedTab}
                                                onRenameTab={onRenameArchivedTab}
                                                groups={groups}
                                                isMoving={movingTabId === tab.id}
                                                setMovingTabId={setMovingTabId}
                                            />
                                        ))}
                                        {(!grouped[group.id] || grouped[group.id].length === 0) && (
                                            <div className="text-xs text-zen-muted italic py-2 pl-1">No conversations in this project</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Uncategorized */}
                    {uncategorized.length > 0 && (
                        <div className="space-y-3">
                             {groups.length > 0 && (
                                <div className="px-3 py-2 text-xs font-bold text-zen-muted uppercase tracking-wider flex items-center gap-2">
                                    <div className="h-px flex-1 bg-zen-border"></div>
                                    <span>Uncategorized</span>
                                    <div className="h-px flex-1 bg-zen-border"></div>
                                </div>
                            )}
                            {uncategorized.map(tab => (
                                <HistoryItem
                                    key={tab.id}
                                    tab={tab}
                                    searchTerm={searchTerm}
                                    onRestore={handleRestore}
                                    onMove={(groupId) => onMoveTabToGroup(tab.id, groupId)}
                                    onDelete={onDeleteArchivedTab}
                                    onRenameTab={onRenameArchivedTab}
                                    groups={groups}
                                    isMoving={movingTabId === tab.id}
                                    setMovingTabId={setMovingTabId}
                                />
                            ))}
                        </div>
                    )}

                    {pastConversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-zen-muted opacity-50 space-y-4">
                            <Search className="w-12 h-12 stroke-1" />
                            <div className="text-sm font-medium">
                                {searchTerm ? 'No matching conversations found' : 'Your history is empty'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

             {/* Footer Status */}
             <div className="p-6 border-t border-zen-border bg-zen-bg/30 shrink-0">
                <div className="flex items-center justify-between text-[10px] text-zen-muted font-mono tracking-tight">
                    <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        SYSTEM ONLINE
                    </span>
                    <span>{pastConversations.length} ITEMS STORED</span>
                </div>
            </div>
        </div>
    );
};

// Helper Component for individual Items
const HistoryItem: React.FC<{
    tab: Tab;
    searchTerm: string;
    onRestore: (id: string) => void;
    onMove: (groupId?: string) => void;
    onDelete: (id: string) => void;
    onRenameTab?: (id: string, newTitle: string) => void;
    groups: ThreadGroup[];
    isMoving: boolean;
    setMovingTabId: (id: string | null) => void;
}> = ({ tab, searchTerm, onRestore, onMove, onDelete, onRenameTab, groups, isMoving, setMovingTabId }) => {
    
    // Smart snippet generation
    const snippet = useMemo(() => {
        if (!searchTerm.trim()) return null;
        const lowerTerm = searchTerm.toLowerCase();
        
        // First check if title matches (prioritize title)
        if (tab.title.toLowerCase().includes(lowerTerm)) {
            // If title matches, show the latest message as preview
            const lastMsg = tab.messages[tab.messages.length - 1];
            return lastMsg ? lastMsg.content.slice(0, 100) + (lastMsg.content.length > 100 ? '...' : '') : '';
        }

        // Find the matching message
        const matchingMsg = tab.messages.find(m => m.content.toLowerCase().includes(lowerTerm));
        if (matchingMsg) {
            // Extract context around the match
            const content = matchingMsg.content;
            const index = content.toLowerCase().indexOf(lowerTerm);
            const start = Math.max(0, index - 30);
            const end = Math.min(content.length, index + lowerTerm.length + 60);
            return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
        }
        return null;
    }, [tab, searchTerm]);

    return (
        <div className="relative group">
            <button
                onClick={() => onRestore(tab.id)}
                className="w-full text-left p-4 rounded-2xl bg-zen-bg/40 border border-zen-border/50 hover:border-zen-accent/40 hover:bg-zen-bg hover:shadow-md transition-all group pr-10 flex flex-col gap-1.5"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-zen-text truncate leading-tight">
                        {tab.title}
                    </div>
                </div>

                {/* Smart Search Highlight */}
                {searchTerm && snippet ? (
                    <div className="text-xs text-zen-accent/90 font-medium bg-zen-accent/5 px-2 py-1.5 rounded-lg border border-zen-accent/10 line-clamp-2">
                        <span className="opacity-70 text-[10px] uppercase tracking-wider mr-1 font-bold">Match:</span> 
                        "{snippet}"
                    </div>
                ) : (
                    <div className="text-xs text-zen-muted opacity-70 line-clamp-2">
                        {tab.messages[tab.messages.length - 1]?.content || "Empty conversation"}
                    </div>
                )}

                <div className="flex items-center gap-3 mt-1">
                     <div className="flex items-center gap-1.5 text-[10px] text-zen-muted font-medium bg-zen-surface/50 px-2 py-0.5 rounded-md border border-zen-border/30">
                        <Calendar className="w-3 h-3" />
                        {new Date(tab.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zen-muted font-medium bg-zen-surface/50 px-2 py-0.5 rounded-md border border-zen-border/30">
                        <MessageSquare className="w-3 h-3" />
                        {tab.messages.length}
                    </div>
                </div>
            </button>
            
            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tab.id);
                }}
                className="absolute right-3 bottom-4 p-1.5 rounded-lg text-zen-muted hover:text-red-500 hover:bg-red-500/10 transition-opacity opacity-0 group-hover:opacity-100 z-10"
                title="Delete conversation"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Rename Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    // Add rename functionality
                    const newTitle = prompt("Rename chat:", tab.title);
                    if (newTitle && newTitle.trim()) {
                        // This will be handled by a new prop
                        if (onRenameTab) {
                            onRenameTab(tab.id, newTitle.trim());
                        }
                    }
                }}
                className="absolute right-3 top-10 p-1.5 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-surface transition-opacity opacity-0 group-hover:opacity-100 z-10"
                title="Rename conversation"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            
            {/* Move Menu Trigger */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setMovingTabId(isMoving ? null : tab.id);
                }}
                className={`absolute right-3 top-4 p-1.5 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-surface transition-all ${isMoving ? 'opacity-100 bg-zen-accent/10 text-zen-accent' : 'opacity-0 group-hover:opacity-100'}`}
                title="Move to group"
            >
                <FolderOpen className="w-4 h-4" />
            </button>

            {/* Context Menu */}
            {isMoving && (
                <div className="absolute right-0 top-10 mt-1 w-56 bg-zen-surface border border-zen-border rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right backdrop-blur-xl">
                    <div className="p-1.5 space-y-0.5">
                        <div className="px-3 py-2 text-[10px] font-bold text-zen-muted uppercase tracking-wider">
                            Move project to...
                        </div>
                        <button
                            onClick={() => { onMove(undefined); setMovingTabId(null); }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-zen-bg rounded-lg flex items-center gap-3 text-zen-text transition-colors font-medium"
                        >
                            <div className="w-6 h-6 rounded-md bg-zen-bg border border-zen-border flex items-center justify-center">
                                <CornerUpLeft className="w-3.5 h-3.5" />
                            </div>
                            Uncategorized
                        </button>
                        <div className="h-px bg-zen-border/50 my-1 mx-2"></div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                            {groups.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => { onMove(g.id); setMovingTabId(null); }}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zen-bg rounded-lg flex items-center gap-3 text-zen-text transition-colors font-medium ${tab.groupId === g.id ? 'bg-zen-accent/10 text-zen-accent' : ''}`}
                                >
                                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${tab.groupId === g.id ? 'bg-zen-accent border-zen-accent text-white' : 'bg-zen-bg border-zen-border'}`}>
                                        <Folder className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="truncate">{g.name}</span>
                                </button>
                            ))}
                        </div>
                        {groups.length === 0 && (
                            <div className="px-3 py-3 text-[10px] text-zen-muted italic text-center bg-zen-bg/30 rounded-lg mx-1">
                                Create a group first
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryDrawer;
