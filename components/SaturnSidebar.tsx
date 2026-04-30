import React, { useEffect, useMemo, useState } from 'react';
import {
    Bot,
    Calculator,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Folder,
    FolderPlus,
    Hash,
    PencilLine,
    Plus,
    Search,
    Settings,
    Trash2,
    X,
} from 'lucide-react';
import { CustomShortcut, Tab, ThreadGroup } from '../types';
import { buildHistorySections, createDefaultExpandedGroupIds } from '../services/historyGrouping.js';

export const RAIL_GUTTER = 12;
export const RAIL_WIDTH = 252;
export const COLLAPSED_RAIL_WIDTH = 72;
export const RAIL_RADIUS = 0;
export const ICON_BUTTON = 34;
export const ICON_SIZE = 16;
export const PANEL_GAP = 10;
export const HISTORY_PANEL_WIDTH = 0;
export const ATTACHED_PANEL_LEFT = RAIL_WIDTH + PANEL_GAP;
export const COLLAPSED_PANEL_LEFT = COLLAPSED_RAIL_WIDTH + PANEL_GAP;
export const CONTENT_INSET = RAIL_WIDTH + 24;
export const COLLAPSED_CONTENT_INSET = COLLAPSED_RAIL_WIDTH + 24;

interface SaturnSidebarProps {
    onNewTab: () => void;
    onOpenSettings: () => void;
    onToggleHistory: () => void;
    activeApp: string | null;
    onOpenApp: (appId: string) => void;
    enabledApps: string[];
    customShortcuts: CustomShortcut[];
    pastConversations: Tab[];
    groups: ThreadGroup[];
    onRestoreTab: (id: string) => void;
    onCreateGroup: (name: string) => void;
    onDeleteGroup: (id: string) => void;
    onRenameGroup: (id: string, name: string) => void;
    onMoveTabToGroup: (tabId: string, groupId?: string) => void;
    onDeleteArchivedTab: (tabId: string) => void;
    onRenameArchivedTab?: (tabId: string, newTitle: string) => void;
    isCollapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}

const SaturnMark = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={`text-zen-accent ${className}`}>
        <circle cx="50" cy="50" r="17" fill="currentColor" />
        <ellipse cx="50" cy="50" rx="38" ry="8" fill="none" stroke="currentColor" strokeWidth="7" transform="rotate(-8 50 50)" />
    </svg>
);

const SpotifyLogo = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M7.2 9.4c3.2-1 6.4-.7 9.5.9" fill="none" stroke="#07110a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7.8 12.3c2.7-.8 5.2-.5 7.5.7" fill="none" stroke="#07110a" strokeWidth="1.55" strokeLinecap="round" />
        <path d="M8.5 15c2-.5 3.8-.3 5.6.6" fill="none" stroke="#07110a" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
);

const WhatsAppLogo = ({ className = 'h-[22px] w-[22px]' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d="M12 2.5A9.2 9.2 0 0 0 4.2 16.7L3 21.5l4.9-1.2A9.2 9.2 0 1 0 12 2.5Z" />
        <path fill="#fff" d="M16.9 14.3c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.5Z" />
    </svg>
);

const RedditLogo = ({ className = 'h-[22px] w-[22px]' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d="M19.8 11.2c-.5 0-1 .2-1.4.5-1.3-.9-3.1-1.4-5.1-1.5l.9-4 2.8.6c.1.8.8 1.4 1.6 1.4.9 0 1.6-.7 1.6-1.6S19.5 5 18.6 5c-.6 0-1.1.3-1.4.8l-3.4-.7c-.3-.1-.6.1-.6.4l-1 4.7c-2 .1-3.8.6-5.1 1.5-.4-.3-.9-.5-1.4-.5A2.2 2.2 0 0 0 4.9 15c0 2.7 3.2 4.9 7.1 4.9s7.1-2.2 7.1-4.9v-.1c.4-.4.7-1 .7-1.6 0-1.2-.9-2.1-2-2.1Z" />
        <circle cx="9.4" cy="14.2" r="1" fill="#fff" />
        <circle cx="14.6" cy="14.2" r="1" fill="#fff" />
        <path d="M9.5 16.7c1.5.9 3.5.9 5 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

const XLogo = ({ className = 'h-[22px] w-[22px]' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d="M14.3 10.2 22.8 0h-2l-7.4 8.8L7.5 0H.7l8.9 13.1L.7 24h2l7.8-9.4 6.3 9.4h6.8l-9.3-13.8Zm-2.8 3.3-.9-1.3L3.4 1.5h3.1l5.8 8.6.9 1.3 7.6 11.2h-3.1l-6.2-9.1Z" />
    </svg>
);

const YouTubeLogo = ({ className = 'h-[22px] w-[22px]' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d="M22.5 7.2a3 3 0 0 0-2.1-2.1C18.6 4.6 12 4.6 12 4.6s-6.6 0-8.4.5a3 3 0 0 0-2.1 2.1C1 9 1 12 1 12s0 3 .5 4.8a3 3 0 0 0 2.1 2.1c1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5a3 3 0 0 0 2.1-2.1C23 15 23 12 23 12s0-3-.5-4.8Z" />
        <path fill="#fff" d="m10 15.5 5.8-3.5L10 8.5v7Z" />
    </svg>
);

const getShortcutFavicon = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    } catch {
        return null;
    }
};

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

const SectionLabel = ({ label, count }: { label: string; count: number }) => (
    <div className="mb-2 flex items-center justify-between px-2">
        <span className="app-topbar-label !text-[10px] text-zen-muted/55">{label}</span>
        <span className="font-mono text-[10px] text-zen-muted/45">{String(count).padStart(2, '0')}</span>
    </div>
);

const ToolButton = ({
    icon,
    label,
    active = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`group relative flex h-9 w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-sm transition-colors ${
            active
                ? 'bg-zen-surface/80 text-zen-text'
                : 'text-zen-muted hover:bg-zen-surface/55 hover:text-zen-text'
        }`}
    >
        {active && <span className="absolute -left-[14px] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-zen-accent" />}
        <span className={active ? 'text-zen-accent' : 'text-zen-muted/75 group-hover:text-zen-accent'}>{icon}</span>
        <span className="truncate font-medium">{label}</span>
    </button>
);

const IconToolButton = ({
    icon,
    label,
    active = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={label}
        className={`relative grid h-10 w-10 place-items-center rounded-[10px] transition-colors ${
            active
                ? 'bg-zen-surface/80 text-zen-accent'
                : 'text-zen-muted hover:bg-zen-surface/55 hover:text-zen-text'
        }`}
    >
        {active && <span className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-zen-accent" />}
        {icon}
    </button>
);

const RecentRow = ({
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
        <div className="group rounded-[8px] px-2 py-1.5 transition-colors hover:bg-zen-surface/60">
            <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-zen-muted/60" />
                {isRenaming ? (
                    <input
                        autoFocus
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') commitRename();
                            if (event.key === 'Escape') {
                                setTitle(tab.title);
                                setIsRenaming(false);
                            }
                        }}
                        className="min-w-0 flex-1 rounded-[6px] border border-zen-accent/35 bg-zen-bg px-2 py-1 text-xs text-zen-text outline-none"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => onRestoreTab(tab.id)}
                        className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-zen-muted transition-colors group-hover:text-zen-text"
                        title={`${tab.title} · ${formatDate(tab.createdAt)}`}
                    >
                        {tab.title}
                    </button>
                )}
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {onRenameArchivedTab && !isRenaming && (
                        <button
                            type="button"
                            onClick={() => setIsRenaming(true)}
                            className="grid h-6 w-6 place-items-center rounded-[7px] text-zen-muted hover:bg-zen-text/8 hover:text-zen-text"
                            title="Rename"
                        >
                            <PencilLine className="h-3 w-3" />
                        </button>
                    )}
                    {isRenaming && (
                        <button
                            type="button"
                            onClick={commitRename}
                            className="grid h-6 w-6 place-items-center rounded-[7px] text-zen-accent hover:bg-zen-accent/10"
                            title="Save"
                        >
                            <Check className="h-3 w-3" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDeleteArchivedTab(tab.id)}
                        className="grid h-6 w-6 place-items-center rounded-[7px] text-zen-muted hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>
            {groups.length > 0 && (
                <select
                    value={tab.groupId || ''}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onMoveTabToGroup(tab.id, event.target.value || undefined)}
                    className="ml-5 mt-1 hidden max-w-[180px] rounded-[7px] border border-zen-border/25 bg-zen-bg px-2 py-1 text-[10px] text-zen-muted outline-none group-hover:block"
                    aria-label={`Move ${tab.title} to group`}
                >
                    <option value="">Ungrouped</option>
                    {groups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                </select>
            )}
        </div>
    );
};

const ShortcutDock = ({
    externalApps,
    customShortcuts,
    activeApp,
    onOpenApp,
}: {
    externalApps: { id: string; label: string; icon: React.ReactNode; tone: string }[];
    customShortcuts: CustomShortcut[];
    activeApp: string | null;
    onOpenApp: (appId: string) => void;
}) => {
    if (externalApps.length === 0 && customShortcuts.length === 0) return null;

    return (
        <div className="custom-scrollbar fixed right-4 top-1/2 z-40 flex max-h-[calc(100dvh-32px)] -translate-y-1/2 flex-col items-center gap-1.5 overflow-y-auto rounded-[18px] border border-zen-border/45 bg-zen-surface/90 p-1.5 shadow-[0_22px_60px_-42px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
            {externalApps.map((app) => (
                <button
                    key={app.id}
                    type="button"
                    onClick={() => onOpenApp(app.id)}
                    title={app.label}
                    className={`group relative grid h-10 w-10 place-items-center rounded-[12px] transition-colors ${
                        activeApp === app.id
                            ? 'bg-zen-bg text-zen-text ring-1 ring-zen-border/55'
                            : 'text-zen-muted hover:bg-zen-surface/70 hover:text-zen-text'
                    }`}
                >
                    <span className={`${app.tone} transition-transform duration-200 group-hover:scale-105`}>
                        {app.icon}
                    </span>
                    <span className="pointer-events-none absolute right-full mr-2 rounded-[8px] border border-zen-border/35 bg-[#090605]/95 px-2 py-1 text-[11px] font-medium text-zen-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {app.label}
                    </span>
                </button>
            ))}
            {externalApps.length > 0 && customShortcuts.length > 0 && <div className="my-1 h-px w-7 bg-zen-border/35" />}
            {customShortcuts.map((shortcut) => {
                const favicon = getShortcutFavicon(shortcut.url);
                return (
                    <button
                        key={shortcut.id}
                        type="button"
                        onClick={() => onOpenApp(shortcut.id)}
                        title={shortcut.label}
                        className={`grid h-10 w-10 place-items-center rounded-[12px] text-base transition-colors ${
                            activeApp === shortcut.id
                                ? 'bg-zen-bg text-zen-accent ring-1 ring-zen-border/55'
                                : 'text-zen-muted hover:bg-zen-surface/70 hover:text-zen-text'
                        }`}
                    >
                        {favicon && (
                            <img
                                src={favicon}
                                alt=""
                                className="h-5 w-5 rounded-[5px]"
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                    const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'inline';
                                }}
                            />
                        )}
                        <span style={{ display: favicon ? 'none' : 'inline' }}>{shortcut.emoji}</span>
                    </button>
                );
            })}
        </div>
    );
};

const SaturnSidebar: React.FC<SaturnSidebarProps> = ({
    onNewTab,
    onOpenSettings,
    onToggleHistory,
    activeApp,
    onOpenApp,
    enabledApps,
    customShortcuts,
    pastConversations,
    groups,
    onCreateGroup,
    onDeleteGroup,
    onRenameGroup,
    onRestoreTab,
    onMoveTabToGroup,
    onDeleteArchivedTab,
    onRenameArchivedTab,
    isCollapsed,
    onCollapsedChange,
}) => {
    const [historySearch, setHistorySearch] = useState('');
    const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => createDefaultExpandedGroupIds(groups));
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
    const [groupNameDraft, setGroupNameDraft] = useState('');

    const historyView = useMemo(
        () => buildHistorySections(pastConversations, groups, historySearch),
        [pastConversations, groups, historySearch]
    );

    useEffect(() => {
        setExpandedGroupIds((previous) => {
            const next = new Set(previous);
            groups.forEach((group) => next.add(group.id));
            return next;
        });
    }, [groups]);

    useEffect(() => {
        if (historySearch.trim()) {
            setExpandedGroupIds(createDefaultExpandedGroupIds(groups));
        }
    }, [historySearch, groups]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroupIds((previous) => {
            const next = new Set(previous);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const createGroup = () => {
        const name = newGroupName.trim();
        if (!name) return;
        onCreateGroup(name);
        setNewGroupName('');
        setIsCreatingGroup(false);
    };

    const startRenamingGroup = (group: ThreadGroup) => {
        setRenamingGroupId(group.id);
        setGroupNameDraft(group.name);
    };

    const finishRenamingGroup = () => {
        const name = groupNameDraft.trim();
        if (renamingGroupId && name) onRenameGroup(renamingGroupId, name);
        setRenamingGroupId(null);
        setGroupNameDraft('');
    };

    const tools = [
        { id: 'index', label: 'Index', icon: <Hash className="h-4 w-4" />, active: !activeApp, onClick: onToggleHistory },
        { id: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" />, active: activeApp === 'notes', onClick: () => onOpenApp('notes'), enabled: enabledApps.includes('notes') },
        { id: 'calculator', label: 'Calculator', icon: <Calculator className="h-4 w-4" />, active: activeApp === 'calculator', onClick: () => onOpenApp('calculator'), enabled: enabledApps.includes('calculator') },
        { id: 'agent', label: 'Agents', icon: <Bot className="h-4 w-4" />, active: activeApp === 'agent', onClick: () => onOpenApp('agent'), enabled: enabledApps.includes('agent') },
        { id: 'spotify', label: 'Music', icon: <SpotifyLogo className="h-4 w-4 text-[#1DB954]" />, active: activeApp === 'spotify', onClick: () => onOpenApp('spotify'), enabled: enabledApps.includes('spotify') },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, active: false, onClick: onOpenSettings, enabled: true },
    ].filter((tool) => tool.enabled !== false);

    const externalApps = [
        { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppLogo className="h-5 w-5" />, tone: 'text-[#25D366]' },
        { id: 'reddit', label: 'Reddit', icon: <RedditLogo className="h-5 w-5" />, tone: 'text-[#FF4500]' },
        { id: 'x', label: 'X', icon: <XLogo className="h-5 w-5" />, tone: 'text-[#f4efe8]' },
        { id: 'youtube', label: 'YouTube', icon: <YouTubeLogo className="h-5 w-5" />, tone: 'text-[#FF0033]' },
    ].filter((app) => enabledApps.includes(app.id));

    return (
        <>
            <aside
                className={`fixed z-50 flex select-none flex-col border-r border-zen-border/35 bg-[#050303]/96 py-5 text-zen-text shadow-[18px_0_70px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-[width,padding] duration-300 ${isCollapsed ? 'items-center px-3' : 'px-5'}`}
                style={{
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: isCollapsed ? COLLAPSED_RAIL_WIDTH : RAIL_WIDTH,
                }}
                aria-label="Saturn sidebar"
            >
                <div className={`mb-6 flex w-full items-start ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <SaturnMark />
                        {!isCollapsed && (
                            <div>
                                <div className="text-[15px] font-semibold leading-none text-zen-text">Saturn</div>
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.34em] text-zen-muted/55">v0.4 / idle</div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onCollapsedChange(!isCollapsed)}
                        className={`grid h-7 w-7 place-items-center rounded-[8px] border border-zen-border/25 text-zen-muted transition-colors hover:border-zen-accent/35 hover:text-zen-text ${isCollapsed ? 'absolute right-2 top-5 rotate-180' : ''}`}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                </div>

                {isCollapsed ? (
                    <button
                        type="button"
                        onClick={onNewTab}
                        className="mb-6 grid h-10 w-10 place-items-center rounded-[10px] border border-zen-border/35 text-zen-accent transition-colors hover:border-zen-accent/45 hover:bg-zen-surface/55"
                        title="New chat"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onNewTab}
                        className="mb-7 flex h-11 items-center justify-between rounded-[10px] border border-zen-border/35 bg-transparent px-3 text-sm text-zen-text transition-colors hover:border-zen-accent/45 hover:bg-zen-surface/55"
                    >
                        <span className="flex items-center gap-3">
                            <Plus className="h-4 w-4 text-zen-accent" />
                            <span className="font-medium">New chat</span>
                        </span>
                        <span className="rounded-[6px] border border-zen-border/25 px-1.5 py-0.5 font-mono text-[10px] text-zen-muted/50">Cmd K</span>
                    </button>
                )}

                <section className={isCollapsed ? 'mb-6 w-full' : 'mb-7'}>
                    {!isCollapsed && <SectionLabel label="Tools" count={tools.length} />}
                    <div className={`space-y-1 ${isCollapsed ? 'grid justify-items-center' : ''}`}>
                        {tools.map((tool) => (
                            isCollapsed ? (
                                <IconToolButton
                                    key={tool.id}
                                    icon={tool.icon}
                                    label={tool.label}
                                    active={tool.active}
                                    onClick={tool.onClick}
                                />
                            ) : (
                                <ToolButton
                                    key={tool.id}
                                    icon={tool.icon}
                                    label={tool.label}
                                    active={tool.active}
                                    onClick={tool.onClick}
                                />
                            )
                        ))}
                    </div>
                </section>

                {!isCollapsed && (
                    <section className="flex min-h-0 flex-1 flex-col">
                        <SectionLabel label="History" count={historyView.totalCount} />
                        <div className="mb-3 space-y-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zen-muted/45" />
                                <input
                                    value={historySearch}
                                    onChange={(event) => setHistorySearch(event.target.value)}
                                    placeholder="Search history"
                                    className="h-9 w-full rounded-[9px] border border-zen-border/30 bg-zen-bg/55 pl-8 pr-8 text-xs text-zen-text outline-none placeholder:text-zen-muted/40 focus:border-zen-accent/40"
                                />
                                {historySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setHistorySearch('')}
                                        className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[7px] text-zen-muted hover:bg-zen-surface hover:text-zen-text"
                                        title="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {isCreatingGroup ? (
                                <div className="flex items-center gap-1.5 rounded-[9px] border border-zen-border/30 bg-zen-bg/55 p-1.5">
                                    <input
                                        autoFocus
                                        value={newGroupName}
                                        onChange={(event) => setNewGroupName(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') createGroup();
                                            if (event.key === 'Escape') {
                                                setIsCreatingGroup(false);
                                                setNewGroupName('');
                                            }
                                        }}
                                        placeholder="Group name"
                                        className="min-w-0 flex-1 bg-transparent px-1 text-xs text-zen-text outline-none placeholder:text-zen-muted/40"
                                    />
                                    <button
                                        type="button"
                                        onClick={createGroup}
                                        className="grid h-6 w-6 place-items-center rounded-[7px] text-zen-accent hover:bg-zen-accent/10"
                                        title="Create group"
                                    >
                                        <Check className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingGroup(true)}
                                    className="flex h-8 w-full items-center justify-center gap-2 rounded-[9px] border border-dashed border-zen-border/35 text-[11px] font-medium text-zen-muted transition-colors hover:border-zen-accent/35 hover:bg-zen-surface/45 hover:text-zen-text"
                                >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                    New group
                                </button>
                            )}
                        </div>

                        <div className="custom-scrollbar -mx-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                            {historyView.sections.map((section: { id: string; title: string; group: ThreadGroup; tabs: Tab[] }) => {
                                const isExpanded = expandedGroupIds.has(section.id) || historyView.hasQuery;
                                const isRenaming = renamingGroupId === section.id;

                                return (
                                    <div key={section.id} className="space-y-1.5">
                                        <div className="group/header flex items-center gap-1 rounded-[8px] px-1.5 py-1 text-zen-muted hover:bg-zen-surface/45">
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(section.id)}
                                                className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] hover:bg-zen-text/8 hover:text-zen-text"
                                                title={isExpanded ? 'Collapse group' : 'Expand group'}
                                            >
                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                            </button>
                                            <Folder className="h-3.5 w-3.5 shrink-0 text-zen-accent/75" />
                                            {isRenaming ? (
                                                <input
                                                    autoFocus
                                                    value={groupNameDraft}
                                                    onChange={(event) => setGroupNameDraft(event.target.value)}
                                                    onBlur={finishRenamingGroup}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter') finishRenamingGroup();
                                                        if (event.key === 'Escape') {
                                                            setRenamingGroupId(null);
                                                            setGroupNameDraft('');
                                                        }
                                                    }}
                                                    className="min-w-0 flex-1 rounded-[6px] border border-zen-accent/35 bg-zen-bg px-2 py-1 text-xs text-zen-text outline-none"
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(section.id)}
                                                    className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-zen-text"
                                                    title={section.title}
                                                >
                                                    {section.title}
                                                </button>
                                            )}
                                            <span className="font-mono text-[10px] text-zen-muted/45">{section.tabs.length}</span>
                                            {!isRenaming && (
                                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/header:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => startRenamingGroup(section.group)}
                                                        className="grid h-6 w-6 place-items-center rounded-[7px] text-zen-muted hover:bg-zen-text/8 hover:text-zen-text"
                                                        title="Rename group"
                                                    >
                                                        <PencilLine className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteGroup(section.id)}
                                                        className="grid h-6 w-6 place-items-center rounded-[7px] text-zen-muted hover:bg-red-500/10 hover:text-red-400"
                                                        title="Delete group"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isExpanded && (
                                            <div className="space-y-1 border-l border-zen-border/25 pl-2">
                                                {section.tabs.length > 0 ? (
                                                    section.tabs.map((tab) => (
                                                        <RecentRow
                                                            key={tab.id}
                                                            tab={tab}
                                                            groups={groups}
                                                            onRestoreTab={onRestoreTab}
                                                            onDeleteArchivedTab={onDeleteArchivedTab}
                                                            onRenameArchivedTab={onRenameArchivedTab}
                                                            onMoveTabToGroup={onMoveTabToGroup}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-xs text-zen-muted/45">No chats in this group</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {historyView.ungrouped.length > 0 && (
                                <div className="space-y-1.5">
                                    {groups.length > 0 && (
                                        <div className="px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zen-muted/45">
                                            Ungrouped
                                        </div>
                                    )}
                                    {historyView.ungrouped.map((tab: Tab) => (
                                        <RecentRow
                                            key={tab.id}
                                            tab={tab}
                                            groups={groups}
                                            onRestoreTab={onRestoreTab}
                                            onDeleteArchivedTab={onDeleteArchivedTab}
                                            onRenameArchivedTab={onRenameArchivedTab}
                                            onMoveTabToGroup={onMoveTabToGroup}
                                        />
                                    ))}
                                </div>
                            )}

                            {historyView.totalCount === 0 && (
                                <div className="px-2 py-3 text-xs text-zen-muted/45">
                                    {historyView.hasQuery ? 'No matching chats' : 'No saved chats'}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </aside>

            <ShortcutDock
                externalApps={externalApps}
                customShortcuts={customShortcuts}
                activeApp={activeApp}
                onOpenApp={onOpenApp}
            />
        </>
    );
};

export default SaturnSidebar;
