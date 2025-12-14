import React, { useState, useEffect, useRef } from 'react';
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
}

// Custom Logos
const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
);

const RedditLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
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
    onWidthChange
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

    const [isResizing, setIsResizing] = useState(false);
    const [lastExpandedWidth, setLastExpandedWidth] = useState(240);
    const isExpanded = width > 100;

    const handleToggle = () => {
        if (isExpanded) {
            setLastExpandedWidth(width);
            onWidthChange(55);
        } else {
            onWidthChange(lastExpandedWidth);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = e.clientX - 12; // Account for left margin (3rem approx 12px)
            if (newWidth > 50 && newWidth < 500) {
                onWidthChange(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, onWidthChange]);

    // Simple icon button component for cleaner code
    const IconButton = ({
        onClick,
        isActive = false,
        title,
        children,
        className = ""
    }: {
        onClick: () => void;
        isActive?: boolean;
        title: string;
        children: React.ReactNode;
        className?: string;
    }) => (
        <button
            onClick={onClick}
            className={`
                h-10 rounded-lg flex items-center transition-all duration-200 relative group shrink-0
                ${isExpanded ? 'w-full px-3 gap-3 justify-start' : 'w-10 justify-center'}
                ${isActive
                    ? 'bg-zen-text/10 text-zen-text'
                    : 'text-zen-muted/70 hover:text-zen-text hover:bg-zen-text/5'
                }
                ${className}
            `}
            title={!isExpanded ? title : undefined}
        >
            <div className="shrink-0">{children}</div>
            {isExpanded && <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis opacity-90">{title}</span>}
            
            {!isExpanded && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zen-bg/95 backdrop-blur-sm border border-zen-border/50 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 text-zen-text shadow-xl">
                    {title}
                </div>
            )}
        </button>
    );

    return (
        <div
            className="fixed left-3 top-3 bottom-3 bg-zen-bg/80 backdrop-blur-xl border border-zen-border/30 rounded-2xl flex flex-col py-3 z-50 transition-all duration-75 shadow-lg select-none group/sidebar"
            style={{ width: `${width}px` }}
        >
             {/* Drag Handle */}
             <div 
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-zen-accent/20 border-r border-transparent group-hover/sidebar:border-zen-border/50 transition-colors z-50"
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
            />

            {/* Toggle Button */}
            <div className={`flex ${isExpanded ? 'justify-end px-3' : 'justify-center'} mb-2`}>
                 <button onClick={handleToggle} className="text-zen-muted hover:text-zen-text p-1 rounded-md hover:bg-zen-surface transition-colors">
                    {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-5 h-5" />}
                 </button>
            </div>

            {/* Logo / New Chat */}
            <div
                className={`mb-4 cursor-pointer flex items-center gap-3 app-no-drag group px-3 ${isExpanded ? 'justify-start' : 'justify-center'}`}
                onClick={onNewTab}
                title="New Chat"
            >
                <div className="relative shrink-0">
                    <svg viewBox="0 0 100 100" className="w-8 h-8 text-zen-accent group-hover:scale-110 transition-transform duration-200">
                        <circle cx="50" cy="50" r="18" fill="currentColor" />
                        <ellipse cx="50" cy="50" rx="38" ry="9" fill="none" stroke="currentColor" strokeWidth="6" transform="rotate(-15 50 50)" />
                    </svg>
                </div>
                {isExpanded && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-base text-zen-text leading-tight tracking-tight">Saturn</span>
                        <span className="text-[10px] text-zen-muted font-bold tracking-widest uppercase">Extension</span>
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className={`flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar app-no-drag py-1 ${isExpanded ? 'px-2' : 'items-center'}`}>
                
                <IconButton onClick={onNewTab} title="New Chat" className="mb-1">
                    <Plus className="w-5 h-5" />
                </IconButton>

                {/* Divider */}
                {(displayedApps.length > 0 || customShortcuts.length > 0) && (
                    <div className="w-full h-px bg-zen-border/30 my-2 shrink-0" />
                )}

                {displayedApps.map(app => (
                    <IconButton
                        key={app.id}
                        onClick={() => onOpenApp(app.id)}
                        isActive={activeApp === app.id}
                        title={app.label}
                    >
                        {app.icon}
                    </IconButton>
                ))}

                {customShortcuts.map(sc => (
                    <IconButton
                        key={sc.id}
                        onClick={() => onOpenApp(sc.id)}
                        title={sc.label}
                    >
                        <span className="text-base">{sc.emoji}</span>
                    </IconButton>
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-1 mt-auto pt-2 app-no-drag px-2">
                <IconButton
                    onClick={onToggleHistory}
                    isActive={isHistoryOpen}
                    title="History"
                >
                    <LayoutGrid className="w-[18px] h-[18px]" />
                </IconButton>

                <IconButton
                    onClick={onOpenSettings}
                    title="Settings"
                >
                    <Settings className="w-[18px] h-[18px] transition-transform duration-200 group-hover:rotate-45" />
                </IconButton>
            </div>
        </div>
    );
};

export default SaturnSidebar;