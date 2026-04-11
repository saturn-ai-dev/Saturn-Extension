import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Settings, LayoutGrid, FileText, Calculator, Twitch, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomShortcut } from '../types';

interface SaturnSidebarProps {
    onNewTab: () => void;
    onOpenSettings: () => void;
    onToggleHistory: () => void;
    isHistoryOpen: boolean;
    activeApp: string | null;
    onOpenApp: (appId: string) => void;
    enabledApps: string[];
    customShortcuts: CustomShortcut[];
    width: number;
    onWidthChange: (width: number) => void;
    position?: 'left' | 'right' | 'top' | 'bottom';
    autoHide?: boolean;
    showStatus?: boolean;
    glassIntensity?: number;
}

// Custom Logos
const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
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

const SaturnSidebar: React.FC<SaturnSidebarProps> = ({
    onNewTab,
    onOpenSettings,
    onToggleHistory,
    isHistoryOpen,
    activeApp,
    onOpenApp,
    enabledApps,
    customShortcuts,
    width,
    onWidthChange,
    position = 'left',
    autoHide = false,
    showStatus = true,
    glassIntensity = 70
}) => {

    const apps = [
        { id: 'notes', label: 'Notes', icon: <FileText className="w-[18px] h-[18px]" /> },
        { id: 'calculator', label: 'Calculator', icon: <Calculator className="w-[18px] h-[18px]" /> },
        { id: 'spotify', label: 'Music', icon: <SpotifyLogo className="w-[18px] h-[18px]" /> },
        { id: 'twitch', label: 'Twitch', icon: <Twitch className="w-[18px] h-[18px]" /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppLogo className="w-[18px] h-[18px]" /> },
        { id: 'reddit', label: 'Reddit', icon: <RedditLogo className="w-[18px] h-[18px]" /> },
        { id: 'x', label: 'X', icon: <XLogo className="w-[18px] h-[18px]" /> },
        { id: 'youtube', label: 'YouTube', icon: <YouTubeLogo className="w-[18px] h-[18px]" /> },
    ];

    const displayedApps = apps.filter(app => enabledApps.includes(app.id));

    const isHorizontal = position === 'top' || position === 'bottom';

    const [isResizing, setIsResizing] = useState(false);
    const [lastExpandedWidth, setLastExpandedWidth] = useState(240);
    const [isHovered, setIsHovered] = useState(false);
    const [hoverLabel, setHoverLabel] = useState<{ title: string; top: number; anchorRight: number; anchorLeft: number; height: number } | null>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const onIconHover = useCallback((info: { title: string; top: number; anchorRight: number; anchorLeft: number; height: number } | null) => {
        setHoverLabel(info);
    }, []);

    const isActuallyExpanded = (autoHide ? (isHovered || isHistoryOpen) : true) && width > 100;
    const isExpanded = width > 100;

    const handleToggle = () => {
        if (isExpanded) { setLastExpandedWidth(width); onWidthChange(55); }
        else { onWidthChange(lastExpandedWidth); }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            let newWidth = position === 'left' ? e.clientX - 12 : window.innerWidth - e.clientX - 12;
            if (newWidth > 50 && newWidth < 500) onWidthChange(newWidth);
        };
        const handleMouseUp = () => { setIsResizing(false); document.body.style.cursor = 'default'; };
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
        }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isResizing, onWidthChange, position]);

    // Glass bg opacity: glassIntensity 0 = opaque, 100 = very transparent
    const bgOpacity = Math.max(0.15, 0.85 - (glassIntensity / 100) * 0.65);

    const glowShadow = isHovered
        ? `0 0 0 1.5px var(--accent-glow), 0 8px 48px -4px var(--accent-glow), 0 0 80px -8px var(--accent-glow)`
        : `0 4px 24px rgba(0,0,0,0.18)`;

    // --- Icon Button ---
    const IconButton = ({
        onClick, isActive = false, title, children, className = "", color = "text-zen-muted/60", horizontal = false
    }: {
        onClick: () => void; isActive?: boolean; title: string; children: React.ReactNode; className?: string; color?: string; horizontal?: boolean;
    }) => {
        const btnRef = useRef<HTMLButtonElement>(null);
        const [hovered, setHovered] = useState(false);

        const handleMouseEnter = () => {
            setHovered(true);
            if (!isActuallyExpanded && !isHorizontal && btnRef.current) {
                const r = btnRef.current.getBoundingClientRect();
                onIconHover({ title, top: r.top, anchorRight: r.right, anchorLeft: r.left, height: r.height });
            }
        };
        const handleMouseLeave = () => { setHovered(false); onIconHover(null); };

        if (horizontal) {
            return (
                <button
                    ref={btnRef}
                    onClick={onClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    title={title}
                    className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-zen-accent/15 text-zen-accent' : `text-zen-muted/60 hover:text-zen-text hover:bg-zen-text/5 ${color}`} ${className}`}
                    style={{ boxShadow: isActive ? '0 0 16px -2px var(--accent-glow)' : undefined }}
                >
                    <div style={{ transform: hovered ? 'scale(1.35)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        {children}
                    </div>
                    <span className="text-[9px] font-medium opacity-70 whitespace-nowrap">{title}</span>
                    {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-zen-accent rounded-full" />}
                </button>
            );
        }

        return (
            <button
                ref={btnRef}
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ boxShadow: isActive ? '0 0 20px -4px var(--accent-glow)' : undefined }}
                className={`
                    h-9 rounded-lg flex items-center relative shrink-0
                    transition-[background,color,box-shadow] duration-200
                    ${isActuallyExpanded ? 'w-full px-2.5 gap-3 justify-start' : 'w-9 justify-center'}
                    ${isActive ? 'bg-zen-accent/15 text-zen-accent' : `hover:bg-zen-text/5 ${color} hover:text-zen-text`}
                    ${className}
                `}
            >
                <div className={`absolute ${position === 'left' || position === 'top' || position === 'bottom' ? 'left-0' : 'right-0'} w-0.5 rounded-full bg-zen-accent transition-all duration-300 ${isActive ? 'h-4 opacity-100' : 'h-0 opacity-0'}`} />

                <div style={{ transform: hovered ? 'scale(1.35)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                    className="flex items-center justify-center w-5 h-5 shrink-0">
                    {children}
                </div>

                {isActuallyExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis sidebar-label-in">{title}</span>
                )}
            </button>
        );
    };

    // ── HORIZONTAL LAYOUT (top / bottom) ──────────────────────────────────────
    if (isHorizontal) {
        const allItems = [
            { id: '__new__', label: 'New Chat', icon: <Plus className="w-4 h-4" />, action: onNewTab, isAccent: true },
            ...displayedApps.map(a => ({ id: a.id, label: a.label, icon: a.icon, action: () => onOpenApp(a.id), isAccent: false })),
            ...customShortcuts.map(sc => ({ id: sc.id, label: sc.label, icon: <span className="text-sm">{sc.emoji}</span>, action: () => onOpenApp(sc.id), isAccent: false })),
        ];
        const bottomItems = [
            { id: '__history__', label: 'History', icon: <LayoutGrid className="w-4 h-4" />, action: onToggleHistory, isActive: isHistoryOpen },
            { id: '__settings__', label: 'Settings', icon: <Settings className="w-4 h-4" />, action: onOpenSettings, isActive: false },
        ];

        return (
            <div
                ref={sidebarRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { setIsHovered(false); setHoverLabel(null); }}
                className={`fixed ${position === 'top' ? 'top-3 left-3 right-3' : 'bottom-3 left-3 right-3'} h-[62px] z-50 rounded-[20px] border border-zen-border/30 flex items-center px-4 gap-1 select-none transition-[box-shadow] duration-300 ${position === 'top' ? 'animate-sidebar-open' : ''}`}
                style={{
                    backdropFilter: `blur(${glassIntensity}px)`,
                    WebkitBackdropFilter: `blur(${glassIntensity}px)`,
                    backgroundColor: `rgba(var(--bg-color-rgb, 5,5,5), ${bgOpacity})`,
                    boxShadow: glowShadow,
                }}
            >
                {/* Logo */}
                <div onClick={onNewTab} className="cursor-pointer mr-3 flex items-center gap-2 shrink-0 app-no-drag" title="New Chat">
                    <svg viewBox="0 0 100 100" className="w-7 h-7 text-zen-accent">
                        <circle cx="50" cy="50" r="18" fill="currentColor" />
                        <ellipse cx="50" cy="50" rx="38" ry="9" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(-15 50 50)" opacity="0.75" />
                    </svg>
                </div>

                <div className="h-6 w-px bg-zen-border/30 mr-2 shrink-0" />

                {/* App items */}
                <div className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar app-no-drag">
                    {allItems.map(item => (
                        <IconButton key={item.id} onClick={item.action} title={item.label} isActive={activeApp === item.id} color={item.isAccent ? 'text-zen-accent' : undefined} horizontal>
                            {item.icon}
                        </IconButton>
                    ))}
                </div>

                <div className="h-6 w-px bg-zen-border/30 mx-2 shrink-0" />

                {/* Bottom items */}
                <div className="flex items-center gap-0.5 app-no-drag">
                    {bottomItems.map(item => (
                        <IconButton key={item.id} onClick={item.action} title={item.label} isActive={item.isActive} horizontal>
                            {item.icon}
                        </IconButton>
                    ))}
                </div>
            </div>
        );
    }

    // ── VERTICAL LAYOUT (left / right) ────────────────────────────────────────
    return (
        <div
            ref={sidebarRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setHoverLabel(null); }}
            className={`fixed ${position === 'left' ? 'left-3' : 'right-3'} top-3 bottom-3 border border-zen-border/30 rounded-[24px] flex flex-col py-4 z-50 select-none ${isResizing ? 'transition-none' : 'transition-[width,box-shadow] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]'} ${position === 'left' ? 'animate-sidebar-open' : 'animate-sidebar-open-right'}`}
            style={{
                width: isActuallyExpanded ? `${width}px` : '55px',
                backdropFilter: `blur(${glassIntensity}px)`,
                WebkitBackdropFilter: `blur(${glassIntensity}px)`,
                backgroundColor: `rgba(var(--bg-color-rgb, 5,5,5), ${bgOpacity})`,
                willChange: 'width',
                boxShadow: glowShadow,
            }}
        >
            {/* Floating hover label for collapsed icons */}
            {!isActuallyExpanded && hoverLabel && (
                <div className="fixed z-[200] pointer-events-none flex items-center" style={{
                    top: hoverLabel.top, height: hoverLabel.height,
                    left: position === 'left' ? hoverLabel.anchorRight + 8 : 'auto',
                    right: position === 'right' ? (window.innerWidth - hoverLabel.anchorLeft + 8) : 'auto',
                }}>
                    <div className="flex items-center h-full px-3 bg-zen-bg border border-zen-border/60 rounded-[10px] text-sm font-medium text-zen-text whitespace-nowrap sidebar-label-in"
                        style={{ boxShadow: '0 4px 20px var(--accent-glow)' }}>
                        {hoverLabel.title}
                    </div>
                </div>
            )}

            {/* Drag Handle */}
            <div className={`absolute ${position === 'left' ? '-right-1' : '-left-1'} top-4 bottom-4 w-3 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity z-50`}
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}>
                <div className={`absolute ${position === 'left' ? 'right-1' : 'left-1'} top-0 bottom-0 w-0.5 bg-zen-border/60 rounded-full hover:bg-zen-accent transition-colors`} />
            </div>

            {/* Toggle Button */}
            <div className={`flex ${isActuallyExpanded ? (position === 'left' ? 'justify-end px-4' : 'justify-start px-4') : 'justify-center'} mb-3`}>
                <button onClick={handleToggle} className="text-zen-muted/60 hover:text-zen-text p-1.5 rounded-lg hover:bg-zen-text/5 transition-all duration-200">
                    {isActuallyExpanded ? (position === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <Menu className="w-4 h-4" />}
                </button>
            </div>

            {/* Logo */}
            <div className={`mb-6 cursor-pointer flex items-center gap-3 app-no-drag px-4 ${isActuallyExpanded ? 'justify-start' : 'justify-center'} transition-all duration-300`}
                onClick={onNewTab} title="New Chat">
                <div className="relative shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-8 h-8 text-zen-accent">
                        <circle cx="50" cy="50" r="18" fill="currentColor" />
                        <ellipse cx="50" cy="50" rx="38" ry="9" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(-15 50 50)" opacity="0.75" />
                    </svg>
                </div>
                {isActuallyExpanded && (
                    <div className="flex flex-col overflow-hidden sidebar-label-in">
                        <span className="font-fraunces font-bold text-[16px] text-zen-text leading-tight tracking-tight">Saturn</span>
                        <span className="text-[9px] text-zen-accent/70 font-semibold tracking-wider">PRO</span>
                    </div>
                )}
            </div>

            {/* Nav items */}
            <div className={`flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar app-no-drag py-1 ${isActuallyExpanded ? 'px-2.5' : 'items-center px-2'}`}>
                <div className="sidebar-item">
                    <IconButton onClick={onNewTab} title="New Chat" color="text-zen-accent"><Plus className="w-4 h-4" /></IconButton>
                </div>

                {(displayedApps.length > 0 || customShortcuts.length > 0) && (
                    <div className="w-full my-2 px-1"><div className="h-px bg-zen-border/20" /></div>
                )}

                {displayedApps.map((app, idx) => (
                    <div key={app.id} className="sidebar-item" style={{ animationDelay: `${(idx + 2) * 0.05}s` }}>
                        <IconButton onClick={() => onOpenApp(app.id)} isActive={activeApp === app.id} title={app.label}>
                            {app.icon}
                        </IconButton>
                    </div>
                ))}

                {customShortcuts.map((sc, idx) => (
                    <div key={sc.id} className="sidebar-item" style={{ animationDelay: `${(idx + displayedApps.length + 2) * 0.05}s` }}>
                        <IconButton onClick={() => onOpenApp(sc.id)} title={sc.label}>
                            <span className="text-sm">{sc.emoji}</span>
                        </IconButton>
                    </div>
                ))}
            </div>

            {/* Bottom */}
            <div className={`flex flex-col gap-1 mt-auto pt-3 app-no-drag ${isActuallyExpanded ? 'px-2.5' : 'px-2 items-center'}`}>
                <div className="h-px w-full bg-zen-border/20 mb-2" />
                <IconButton onClick={onToggleHistory} isActive={isHistoryOpen} title="History"><LayoutGrid className="w-4 h-4" /></IconButton>
                <IconButton onClick={onOpenSettings} title="Settings"><Settings className="w-4 h-4" /></IconButton>
                {isActuallyExpanded && showStatus && (
                    <div className="mt-3 mb-1 px-2 flex items-center gap-2.5 sidebar-label-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/70 shrink-0" />
                        <span className="text-[10px] text-zen-muted/60 truncate">Online</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SaturnSidebar;