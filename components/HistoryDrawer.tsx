import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tab, ThreadGroup } from '../types';
import { X, History, Search, FolderPlus, Folder, FolderOpen, ChevronRight, ChevronDown, MoreVertical, Edit2, Trash2, Check, CornerUpLeft } from 'lucide-react';

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
    onMoveTabToGroup
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

    return (
        <div className={`
        fixed top-4 bottom-4 left-24 w-80 bg-zen-surface/95 backdrop-blur-2xl border border-zen-border/50 shadow-2xl z-40 rounded-3xl transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}
    `}>
            {/* Header */}
            <div className="h-14 border-b border-zen-border flex items-center justify-between px-4 bg-zen-bg/50 shrink-0">
                <span className="text-sm font-bold tracking-widest text-zen-muted uppercase flex items-center gap-2">
                    <History className="w-4 h-4 text-zen-accent" />
                    History
                </span>
                <button onClick={onClose} className="text-zen-muted hover:text-zen-text transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search & Actions */}
            <div className="p-4 pb-2 shrink-0 space-y-2">
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
                
                {!isCreatingGroup ? (
                    <button 
                        onClick={() => setIsCreatingGroup(true)}
                        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-zen-muted hover:text-zen-accent py-1.5 border border-dashed border-zen-border rounded-lg hover:border-zen-accent/50 transition-all"
                    >
                        <FolderPlus className="w-3.5 h-3.5" />
                        New Project Group
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name..."
                            className="flex-1 bg-zen-bg border border-zen-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-zen-accent"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                        />
                        <button onClick={handleCreateGroup} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsCreatingGroup(false)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                    {/* Groups */}
                    {groups.map(group => (
                        <div key={group.id} className="space-y-1">
                            <div className="flex items-center justify-between group/header px-2 py-1 rounded hover:bg-zen-bg/50">
                                <button 
                                    onClick={() => toggleGroup(group.id)}
                                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                                >
                                    {expandedGroups.has(group.id) ? 
                                        <ChevronDown className="w-3 h-3 text-zen-muted" /> : 
                                        <ChevronRight className="w-3 h-3 text-zen-muted" />
                                    }
                                    {editingGroupId === group.id ? (
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={finishRenaming}
                                            onKeyDown={(e) => e.key === 'Enter' && finishRenaming()}
                                            className="bg-transparent border-b border-zen-accent focus:outline-none text-xs font-bold text-zen-text w-full"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-zen-muted uppercase tracking-wider truncate group-hover/header:text-zen-text transition-colors">
                                            {group.name}
                                        </span>
                                    )}
                                </button>
                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                    <button onClick={() => startRenaming(group)} className="text-zen-muted hover:text-zen-text p-1">
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => onDeleteGroup(group.id)} className="text-zen-muted hover:text-red-500 p-1">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {(expandedGroups.has(group.id) || searchTerm) && (
                                <div className="pl-2 space-y-1 border-l-2 border-zen-border/30 ml-3">
                                    {grouped[group.id]?.map(tab => (
                                        <HistoryItem 
                                            key={tab.id} 
                                            tab={tab} 
                                            onRestore={handleRestore}
                                            onMove={(groupId) => onMoveTabToGroup(tab.id, groupId)}
                                            groups={groups}
                                            isMoving={movingTabId === tab.id}
                                            setMovingTabId={setMovingTabId}
                                        />
                                    ))}
                                    {(!grouped[group.id] || grouped[group.id].length === 0) && (
                                        <div className="text-[10px] text-zen-muted italic pl-2 py-1">Empty group</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Uncategorized */}
                    {uncategorized.length > 0 && (
                        <div className="space-y-1">
                             {groups.length > 0 && (
                                <div className="px-2 py-1 text-xs font-bold text-zen-muted uppercase tracking-wider">
                                    Uncategorized
                                </div>
                            )}
                            {uncategorized.map(tab => (
                                <HistoryItem 
                                    key={tab.id} 
                                    tab={tab} 
                                    onRestore={handleRestore}
                                    onMove={(groupId) => onMoveTabToGroup(tab.id, groupId)}
                                    groups={groups}
                                    isMoving={movingTabId === tab.id}
                                    setMovingTabId={setMovingTabId}
                                />
                            ))}
                        </div>
                    )}

                    {pastConversations.length === 0 && (
                        <div className="text-center text-xs text-zen-muted py-10 italic opacity-50">
                            {searchTerm ? 'No matches found.' : 'No past conversations.'}
                        </div>
                    )}
                </div>
            </div>

             {/* Footer Status */}
             <div className="p-4 border-t border-zen-border bg-zen-bg/30 shrink-0">
                <div className="flex items-center justify-between text-[10px] text-zen-muted font-mono">
                    <span>STATUS</span>
                    <span className="text-green-500">OPTIMIZED</span>
                </div>
                <div className="w-full h-1 bg-zen-border rounded-full mt-1 overflow-hidden">
                    <div className="w-1/3 h-full bg-zen-accent"></div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for individual Items
const HistoryItem: React.FC<{
    tab: Tab;
    onRestore: (id: string) => void;
    onMove: (groupId?: string) => void;
    groups: ThreadGroup[];
    isMoving: boolean;
    setMovingTabId: (id: string | null) => void;
}> = ({ tab, onRestore, onMove, groups, isMoving, setMovingTabId }) => {
    
    return (
        <div className="relative group">
            <button
                onClick={() => onRestore(tab.id)}
                className="w-full text-left p-3 rounded-xl bg-zen-bg/40 border border-zen-border/50 hover:border-zen-accent/30 hover:bg-zen-bg transition-all group pr-8"
            >
                <div className="text-sm font-medium text-zen-text truncate">{tab.title}</div>
                <div className="text-xs text-zen-muted opacity-60 truncate">
                    {new Date(tab.createdAt).toLocaleDateString()} · {tab.messages.length} msgs
                </div>
            </button>
            
            {/* Move Menu Trigger */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setMovingTabId(isMoving ? null : tab.id);
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zen-muted hover:text-zen-text hover:bg-zen-bg/80 transition-opacity ${isMoving ? 'opacity-100 bg-zen-accent/10 text-zen-accent' : 'opacity-0 group-hover:opacity-100'}`}
                title="Move to group"
            >
                <FolderOpen className="w-3.5 h-3.5" />
            </button>

            {/* Context Menu */}
            {isMoving && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-zen-surface border border-zen-border rounded-lg shadow-xl z-50 overflow-hidden animate-scale-in origin-top-right">
                    <div className="p-1 space-y-0.5">
                        <div className="px-2 py-1.5 text-[10px] font-bold text-zen-muted uppercase tracking-wider">
                            Move to...
                        </div>
                        <button
                            onClick={() => { onMove(undefined); setMovingTabId(null); }}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-zen-bg rounded flex items-center gap-2 text-zen-text"
                        >
                            <CornerUpLeft className="w-3 h-3" />
                            Uncategorized
                        </button>
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => { onMove(g.id); setMovingTabId(null); }}
                                className={`w-full text-left px-2 py-1.5 text-xs hover:bg-zen-bg rounded flex items-center gap-2 text-zen-text ${tab.groupId === g.id ? 'bg-zen-accent/10 text-zen-accent' : ''}`}
                            >
                                <Folder className="w-3 h-3" />
                                {g.name}
                            </button>
                        ))}
                        {groups.length === 0 && (
                            <div className="px-2 py-2 text-[10px] text-zen-muted italic text-center">
                                No groups created
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryDrawer;