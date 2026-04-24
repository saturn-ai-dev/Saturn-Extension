import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Bot,
    Calculator,
    Check,
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderPlus,
    LayoutGrid,
    Menu,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    Trash2,
    Twitch,
    X,
} from 'lucide-react';
import { CustomShortcut, Tab, ThreadGroup } from '../types';

export const RAIL_GUTTER = 12;
export const RAIL_WIDTH = 64;
export const RAIL_RADIUS = 28;
export const ICON_BUTTON = 40;
export const ICON_SIZE = 18;
export const PANEL_GAP = 10;
export const HISTORY_PANEL_WIDTH = 300;
export const CONTENT_INSET = RAIL_GUTTER + RAIL_WIDTH + 24;
export const ATTACHED_PANEL_LEFT = RAIL_GUTTER + RAIL_WIDTH + PANEL_GAP;

interface SaturnSidebarProps {
    onNewTab: () => void;
    onOpenSettings: () => void;
    onToggleHistory: () => void;
    isHistoryOpen: boolean;
    activeApp: string | null;
    onOpenApp: (appId: string) => void;
    enabledApps: string[];
    customShortcuts: CustomShortcut[];
    userName?: string;
    pastConversations: Tab[];
    groups: ThreadGroup[];
    onRestoreTab: (id: string) => void;
    onCreateGroup: (name: string) => void;
    onDeleteGroup: (id: string) => void;
    onRenameGroup: (id: string, name: string) => void;
    onMoveTabToGroup: (tabId: string, groupId?: string) => void;
    onDeleteArchivedTab: (tabId: string) => void;
    onRenameArchivedTab?: (tabId: string, newTitle: string) => void;
}

const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const RedditLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M24 11.5c0-1.654-1.346-3-3-3-.527 0-1.019.137-1.453.377-1.552-1.127-3.676-1.877-6.047-2.023l1.304-4.122 3.547.75c.027.822.696 1.482 1.526 1.482 1.104 0 2-.896 2-2s-.896-2-2-2c-.738 0-1.382.401-1.727 1l-3.997-.846c-.1-.021-.202.012-.278.089-.075.077-.109.186-.092.292l-1.43 4.52c-2.446.059-4.665.808-6.285 1.97-.448-.28-.979-.442-1.548-.442-1.654 0-3 1.346-3 3 0 .998.489 1.881 1.233 2.422-.022.19-.033.381-.033.578 0 3.584 4.037 6.5 9 6.5s9-2.916 9-6.5c0-.197-.011-.388-.033-.578.744-.541 1.233-1.424 1.233-2.422zm-16.5 2c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm9 3.5c-1.25 1.25-3.5 1.5-4.5 1.5s-3.25-.25-4.5-1.5c-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1 .9 3.3 1.2 3.8 1.2s2.8-.3 3.8-1.2c.2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-.5-1.5c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2z" />
    </svg>
);

const YouTubeLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

const SpotifyLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.26.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
);

const WhatsAppLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
);

const SaturnMark = ({ className = 'w-7 h-7' }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={`text-zen-accent ${className}`}>
        <circle cx="50" cy="50" r="18" fill="currentColor" />
        <ellipse cx="50" cy="50" rx="38" ry="9" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(-15 50 50)" />
    </svg>
);

const iconClass = 'w-[18px] h-[18px]';

const formatDate = (timestamp: number) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const IconButton = ({
    onClick,
    isActive = false,
    title,
    children,
}: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`relative grid place-items-center rounded-[10px] transition-all duration-200 ${
            isActive
                ? 'bg-zen-accent/12 text-zen-accent shadow-[inset_0_0_0_1px_rgba(var(--accent-color-rgb),0.18)]'
                : 'text-zen-muted hover:bg-zen-text/6 hover:text-zen-text'
        }`}
        style={{ width: ICON_BUTTON, height: ICON_BUTTON }}
    >
        {isActive && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-zen-accent shadow-[0_0_10px_var(--accent-color)]" />}
        <span className="grid place-items-center" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
            {children}
        </span>
    </button>
);

const AppsPopover = ({
    open,
    apps,
    customShortcuts,
    onOpenApp,
    onClose,
}: {
    open: boolean;
    apps: { id: string; label: string; icon: React.ReactNode }[];
    customShortcuts: CustomShortcut[];
    onOpenApp: (appId: string) => void;
    onClose: () => void;
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onMouseDown = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) onClose();
        };
        window.addEventListener('mousedown', onMouseDown);
        return () => window.removeEventListener('mousedown', onMouseDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={ref}
            className="fixed z-[60] w-[260px] rounded-[16px] border border-zen-border/55 bg-zen-surface/96 p-3 shadow-deep backdrop-blur-2xl"
            style={{ left: ATTACHED_PANEL_LEFT, bottom: RAIL_GUTTER + 64 }}
        >
            <div className="app-topbar-label mb-2 px-2 !text-[9px]">Apps</div>
            <div className="grid grid-cols-2 gap-2">
                {apps.map((app) => (
                    <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                            onOpenApp(app.id);
                            onClose();
                        }}
                        className="flex items-center gap-2 rounded-[8px] border border-zen-border/35 bg-zen-bg/45 px-3 py-2 text-left text-xs font-medium text-zen-muted transition-colors hover:border-zen-accent/40 hover:text-zen-text"
                    >
                        <span className="grid h-6 w-6 place-items-center text-zen-accent">{app.icon}</span>
                        <span className="truncate">{app.label}</span>
                    </button>
                ))}
            </div>
            {customShortcuts.length > 0 && (
                <>
                    <div className="app-topbar-label mb-2 mt-4 px-2 !text-[9px]">Shortcuts</div>
                    <div className="space-y-1.5">
                        {customShortcuts.map((shortcut) => (
                            <button
                                key={shortcut.id}
                                type="button"
                                onClick={() => {
                                    onOpenApp(shortcut.id);
                                    onClose();
                                }}
                                className="flex w-full items-center gap-2 rounded-[8px] border border-zen-border/30 bg-zen-bg/35 px-3 py-2 text-left text-xs font-medium text-zen-muted transition-colors hover:border-zen-accent/40 hover:text-zen-text"
                            >
                                <span className="text-base leading-none">{shortcut.emoji}</span>
                                <span className="truncate">{shortcut.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const HistoryRailItem = ({
    tab,
    groups,
    onRestoreTab,
    onDeleteArchivedTab,
    onRenameArchivedTab,
    onMoveTabToGroup,
}: {
    tab: Tab;
    groups: ThreadGroup[];
    onRestoreTab: (id: string) => void;
    onDeleteArchivedTab: (tabId: string) => void;
    onRenameArchivedTab?: (tabId: string, newTitle: string) => void;
    onMoveTabToGroup: (tabId: string, groupId?: string) => void;
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(tab.title);

    useEffect(() => setTitle(tab.title), [tab.title]);

    const commitRename = () => {
        const nextTitle = title.trim();
        if (nextTitle && nextTitle !== tab.title) onRenameArchivedTab?.(tab.id, nextTitle);
        setIsRenaming(false);
    };

    return (
        <div className="group rounded-[8px] border border-transparent bg-zen-bg/25 p-2 transition-colors hover:border-zen-border/55 hover:bg-zen-bg/60">
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    onClick={() => onRestoreTab(tab.id)}
                    className="min-w-0 flex-1 text-left"
                    title="Restore conversation"
                >
                    {isRenaming ? (
                        <input
                            autoFocus
                            value={title}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setTitle(event.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') commitRename();
                                if (event.key === 'Escape') {
                                    setTitle(tab.title);
                                    setIsRenaming(false);
                                }
                            }}
                            className="w-full rounded-[8px] border border-zen-accent/40 bg-zen-surface px-2 py-1 text-xs text-zen-text outline-none"
                        />
                    ) : (
                        <>
                            <div className="truncate text-[13px] font-medium text-zen-text">{tab.title}</div>
                            <div className="mt-1 text-[10px] text-zen-muted/70">{formatDate(tab.timestamp)}</div>
                        </>
                    )}
                </button>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {onRenameArchivedTab && !isRenaming && (
                        <button
                            type="button"
                            onClick={() => setIsRenaming(true)}
                            className="grid h-7 w-7 place-items-center rounded-[8px] text-zen-muted hover:bg-zen-text/8 hover:text-zen-text"
                            title="Rename"
                        >
                            <FileText className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {isRenaming && (
                        <button
                            type="button"
                            onClick={commitRename}
                            className="grid h-7 w-7 place-items-center rounded-[8px] text-zen-accent hover:bg-zen-accent/10"
                            title="Save"
                        >
                            <Check className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDeleteArchivedTab(tab.id)}
                        className="grid h-7 w-7 place-items-center rounded-[8px] text-zen-muted hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            <select
                value={tab.groupId || ''}
                onChange={(event) => onMoveTabToGroup(tab.id, event.target.value || undefined)}
                className="mt-2 w-full rounded-[8px] border border-zen-border/30 bg-zen-surface/70 px-2 py-1.5 text-[11px] text-zen-muted outline-none transition-colors focus:border-zen-accent/50"
                aria-label={`Move ${tab.title} to group`}
            >
                <option value="">Ungrouped</option>
                {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                ))}
            </select>
        </div>
    );
};

const HistoryRailPanel = ({
    pastConversations,
    groups,
    onRestoreTab,
    onCreateGroup,
    onDeleteGroup,
    onRenameGroup,
    onMoveTabToGroup,
    onDeleteArchivedTab,
    onRenameArchivedTab,
}: Pick<
    SaturnSidebarProps,
    | 'pastConversations'
    | 'groups'
    | 'onRestoreTab'
    | 'onCreateGroup'
    | 'onDeleteGroup'
    | 'onRenameGroup'
    | 'onMoveTabToGroup'
    | 'onDeleteArchivedTab'
    | 'onRenameArchivedTab'
>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [newGroupName, setNewGroupName] = useState('');
    const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
    const [renamingGroupName, setRenamingGroupName] = useState('');

    const filteredConversations = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return pastConversations;
        return pastConversations.filter((conversation) => {
            const titleMatch = conversation.title.toLowerCase().includes(query);
            const messageMatch = conversation.messages.some((message) => message.text.toLowerCase().includes(query));
            return titleMatch || messageMatch;
        });
    }, [pastConversations, searchTerm]);

    const groupedConversations = useMemo(() => {
        const result: Record<string, Tab[]> = {};
        groups.forEach((group) => {
            result[group.id] = filteredConversations.filter((conversation) => conversation.groupId === group.id);
        });
        return result;
    }, [filteredConversations, groups]);

    const ungroupedConversations = filteredConversations.filter((conversation) => !conversation.groupId);

    const submitNewGroup = () => {
        const name = newGroupName.trim();
        if (!name) return;
        onCreateGroup(name);
        setNewGroupName('');
    };

    const startRenameGroup = (group: ThreadGroup) => {
        setRenamingGroupId(group.id);
        setRenamingGroupName(group.name);
    };

    const commitRenameGroup = () => {
        const name = renamingGroupName.trim();
        if (renamingGroupId && name) onRenameGroup(renamingGroupId, name);
        setRenamingGroupId(null);
        setRenamingGroupName('');
    };

    return (
        <aside
            className="fixed z-[45] flex flex-col overflow-hidden rounded-[20px] border border-zen-border/55 bg-zen-surface/96 shadow-deep backdrop-blur-2xl"
            style={{
                left: ATTACHED_PANEL_LEFT,
                top: RAIL_GUTTER,
                bottom: RAIL_GUTTER,
                width: HISTORY_PANEL_WIDTH,
            }}
        >
            <div className="border-b border-zen-border/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-zen-text">History</div>
                        <div className="app-topbar-label mt-1 !text-[9px]">{pastConversations.length} saved threads</div>
                    </div>
                    <button
                        type="button"
                        onClick={submitNewGroup}
                        disabled={!newGroupName.trim()}
                        className="grid h-9 w-9 place-items-center rounded-[10px] border border-zen-border/45 text-zen-muted transition-colors hover:border-zen-accent/40 hover:text-zen-accent disabled:cursor-not-allowed disabled:opacity-40"
                        title="Create group"
                    >
                        <FolderPlus className="h-4 w-4" />
                    </button>
                </div>
                <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zen-muted/55" />
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search history"
                        className="w-full rounded-[10px] border border-zen-border/35 bg-zen-bg/55 py-2.5 pl-9 pr-3 text-xs text-zen-text outline-none transition-colors placeholder:text-zen-muted/45 focus:border-zen-accent/45"
                    />
                </div>
                <input
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') submitNewGroup();
                    }}
                    placeholder="New group name"
                    className="w-full rounded-[10px] border border-zen-border/30 bg-zen-bg/35 px-3 py-2 text-xs text-zen-text outline-none placeholder:text-zen-muted/45 focus:border-zen-accent/45"
                />
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3">
                {groups.map((group) => {
                    const conversations = groupedConversations[group.id] || [];
                    const expanded = expandedGroups[group.id] !== false;
                    return (
                        <section key={group.id}>
                            <div className="mb-2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.id]: !expanded }))}
                                    className="grid h-7 w-7 place-items-center rounded-[8px] text-zen-muted hover:bg-zen-text/8 hover:text-zen-text"
                                >
                                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                                <Folder className="h-3.5 w-3.5 text-zen-accent" />
                                {renamingGroupId === group.id ? (
                                    <input
                                        autoFocus
                                        value={renamingGroupName}
                                        onChange={(event) => setRenamingGroupName(event.target.value)}
                                        onBlur={commitRenameGroup}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') commitRenameGroup();
                                            if (event.key === 'Escape') setRenamingGroupId(null);
                                        }}
                                        className="min-w-0 flex-1 rounded-[8px] border border-zen-accent/40 bg-zen-bg px-2 py-1 text-xs text-zen-text outline-none"
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => startRenameGroup(group)}
                                        className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-zen-text"
                                        title="Rename group"
                                    >
                                        {group.name}
                                    </button>
                                )}
                                <span className="text-[10px] text-zen-muted/60">{conversations.length}</span>
                                <button
                                    type="button"
                                    onClick={() => onDeleteGroup(group.id)}
                                    className="grid h-7 w-7 place-items-center rounded-[8px] text-zen-muted hover:bg-red-500/10 hover:text-red-400"
                                    title="Delete group"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {expanded && (
                                <div className="space-y-2">
                                    {conversations.length > 0 ? (
                                        conversations.map((conversation) => (
                                            <HistoryRailItem
                                                key={conversation.id}
                                                tab={conversation}
                                                groups={groups}
                                                onRestoreTab={onRestoreTab}
                                                onDeleteArchivedTab={onDeleteArchivedTab}
                                                onRenameArchivedTab={onRenameArchivedTab}
                                                onMoveTabToGroup={onMoveTabToGroup}
                                            />
                                        ))
                                    ) : (
                                        <div className="rounded-[8px] border border-dashed border-zen-border/35 px-3 py-4 text-center text-[11px] text-zen-muted/65">
                                            No threads in this group.
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    );
                })}

                <section>
                    <div className="app-topbar-label mb-2 px-1 !text-[9px]">Ungrouped</div>
                    <div className="space-y-2">
                        {ungroupedConversations.length > 0 ? (
                            ungroupedConversations.map((conversation) => (
                                <HistoryRailItem
                                    key={conversation.id}
                                    tab={conversation}
                                    groups={groups}
                                    onRestoreTab={onRestoreTab}
                                    onDeleteArchivedTab={onDeleteArchivedTab}
                                    onRenameArchivedTab={onRenameArchivedTab}
                                    onMoveTabToGroup={onMoveTabToGroup}
                                />
                            ))
                        ) : (
                            <div className="rounded-[8px] border border-dashed border-zen-border/35 px-3 py-6 text-center text-[11px] text-zen-muted/65">
                                No ungrouped threads.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </aside>
    );
};

const SaturnSidebar: React.FC<SaturnSidebarProps> = ({
    onNewTab,
    onOpenSettings,
    onToggleHistory,
    isHistoryOpen,
    activeApp,
    onOpenApp,
    enabledApps,
    customShortcuts,
    userName = 'Saturn User',
    pastConversations,
    groups,
    onRestoreTab,
    onCreateGroup,
    onDeleteGroup,
    onRenameGroup,
    onMoveTabToGroup,
    onDeleteArchivedTab,
    onRenameArchivedTab,
}) => {
    const [isAppsOpen, setIsAppsOpen] = useState(false);
    const userInitial = (userName.trim().charAt(0) || 'S').toUpperCase();

    const apps = [
        { id: 'notes', label: 'Notes', icon: <FileText className={iconClass} /> },
        { id: 'calculator', label: 'Calculator', icon: <Calculator className={iconClass} /> },
        { id: 'agent', label: 'Agent', icon: <Bot className={iconClass} /> },
        { id: 'spotify', label: 'Music', icon: <SpotifyLogo className={iconClass} /> },
        { id: 'twitch', label: 'Twitch', icon: <Twitch className={iconClass} /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppLogo className={iconClass} /> },
        { id: 'reddit', label: 'Reddit', icon: <RedditLogo className={iconClass} /> },
        { id: 'x', label: 'X', icon: <XLogo className={iconClass} /> },
        { id: 'youtube', label: 'YouTube', icon: <YouTubeLogo className={iconClass} /> },
    ].filter((app) => enabledApps.includes(app.id));

    const primaryIds = new Set(['notes', 'calculator', 'agent']);
    const primaryApps = apps.filter((app) => primaryIds.has(app.id));
    const secondaryApps = apps.filter((app) => !primaryIds.has(app.id));
    const hasOverflow = secondaryApps.length > 0 || customShortcuts.length > 0;

    return (
        <>
            <nav
                className="fixed z-50 grid select-none justify-items-center overflow-hidden border border-zen-border/60 bg-zen-surface/95 py-4 shadow-deep backdrop-blur-2xl"
                style={{
                    left: RAIL_GUTTER,
                    top: RAIL_GUTTER,
                    bottom: RAIL_GUTTER,
                    width: RAIL_WIDTH,
                    borderRadius: RAIL_RADIUS,
                }}
                aria-label="Saturn navigation"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--accent-color-rgb),0.1),transparent_28%)]" />
                <div className="relative z-10 grid justify-items-center gap-2">
                    <IconButton onClick={() => setIsAppsOpen((prev) => !prev)} isActive={isAppsOpen} title="Menu">
                        <Menu className={iconClass} />
                    </IconButton>
                    <button
                        type="button"
                        onClick={onNewTab}
                        title="Saturn home"
                        className="grid h-10 w-10 place-items-center rounded-[10px] text-zen-accent transition-colors hover:bg-zen-accent/10"
                    >
                        <SaturnMark />
                    </button>
                    <IconButton onClick={onNewTab} title="New Thread">
                        <Plus className={iconClass} />
                    </IconButton>
                    <IconButton onClick={onToggleHistory} isActive={isHistoryOpen} title="History">
                        <LayoutGrid className={iconClass} />
                    </IconButton>
                    {primaryApps.map((app) => (
                        <IconButton key={app.id} onClick={() => onOpenApp(app.id)} isActive={activeApp === app.id} title={app.label}>
                            {app.icon}
                        </IconButton>
                    ))}
                    {hasOverflow && (
                        <IconButton onClick={() => setIsAppsOpen((prev) => !prev)} isActive={isAppsOpen} title="Apps">
                            <MoreHorizontal className={iconClass} />
                        </IconButton>
                    )}
                </div>

                <div className="relative z-10 mt-auto grid justify-items-center gap-2">
                    <IconButton onClick={onOpenSettings} title="Settings">
                        <Settings className={iconClass} />
                    </IconButton>
                    <div
                        className="grid h-10 w-10 place-items-center rounded-[10px] border border-zen-border/40 bg-zen-bg/45 text-xs font-semibold text-zen-muted"
                        title={userName}
                    >
                        {userInitial}
                    </div>
                </div>
            </nav>

            {isHistoryOpen && (
                <HistoryRailPanel
                    pastConversations={pastConversations}
                    groups={groups}
                    onRestoreTab={onRestoreTab}
                    onCreateGroup={onCreateGroup}
                    onDeleteGroup={onDeleteGroup}
                    onRenameGroup={onRenameGroup}
                    onMoveTabToGroup={onMoveTabToGroup}
                    onDeleteArchivedTab={onDeleteArchivedTab}
                    onRenameArchivedTab={onRenameArchivedTab}
                />
            )}

            <AppsPopover
                open={isAppsOpen}
                apps={secondaryApps}
                customShortcuts={customShortcuts}
                onOpenApp={onOpenApp}
                onClose={() => setIsAppsOpen(false)}
            />
        </>
    );
};

export default SaturnSidebar;
