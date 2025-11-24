
import React from 'react';
import { Plus, Settings, LayoutGrid, FileText, Calculator, Music, Twitch } from 'lucide-react';
import { CustomShortcut } from '../types';

interface GXSidebarProps {
    onNewTab: () => void;
    onOpenSettings: () => void;
    onToggleHistory: () => void;
    isHistoryOpen: boolean;
    activeApp: string | null;
    onOpenApp: (appId: string) => void;
    enabledApps: string[];
    customShortcuts: CustomShortcut[];
}

// Custom Logos
const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
);

const RedditLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
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

const GXSidebar: React.FC<GXSidebarProps> = ({
    onNewTab,
    onOpenSettings,
    onToggleHistory,
    isHistoryOpen,
    activeApp,
    onOpenApp,
    enabledApps,
    customShortcuts
}) => {

    const apps = [
        { id: 'notes', label: 'Notes', icon: <FileText className="w-5 h-5" /> },
        { id: 'calculator', label: 'Calculator', icon: <Calculator className="w-5 h-5" /> },
        { id: 'spotify', label: 'Music', icon: <SpotifyLogo className="w-5 h-5" /> },
        { id: 'twitch', label: 'Twitch', icon: <Twitch className="w-5 h-5" /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppLogo className="w-5 h-5" /> },
        { id: 'reddit', label: 'Reddit', icon: <RedditLogo className="w-5 h-5" /> },
        { id: 'x', label: 'X', icon: <XLogo className="w-5 h-5" /> },
        { id: 'youtube', label: 'YouTube', icon: <YouTubeLogo className="w-5 h-5" /> },
    ];

    const displayedApps = apps.filter(app => enabledApps.includes(app.id));

    return (
        <div className="w-16 h-full bg-zen-surface/60 backdrop-blur-xl border-r border-zen-border flex flex-col items-center py-4 gap-6 z-50 flex-shrink-0 relative transition-all duration-300 shadow-2xl select-none app-drag" style={{ paddingTop: 'max(2.5rem, env(titlebar-area-height))' }}>
            <div className="mb-2 group cursor-pointer relative flex items-center justify-center app-no-drag" onClick={onNewTab}>
                <div className="absolute inset-0 bg-zen-accent/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <svg viewBox="0 0 100 100" className="w-9 h-9 text-zen-accent animate-spin-slow relative z-10 drop-shadow-lg">
                    <circle cx="50" cy="50" r="20" fill="currentColor" />
                    <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                </svg>
            </div>

            <div className="flex flex-col gap-3 w-full px-2.5 app-no-drag overflow-y-auto no-scrollbar pb-2">
                <button onClick={onNewTab} className="w-full aspect-square rounded-xl bg-zen-bg/50 border border-zen-border hover:border-zen-accent hover:text-zen-accent text-zen-muted flex items-center justify-center transition-all group relative overflow-hidden shadow-sm shrink-0" title="New Tab">
                    <div className="absolute inset-0 bg-zen-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10" />
                </button>

                {(displayedApps.length > 0 || customShortcuts.length > 0) && <div className="w-full h-px bg-zen-border/50 my-1 shrink-0" />}

                {displayedApps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => onOpenApp(app.id)}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all relative group shrink-0 ${activeApp === app.id ? 'bg-zen-accent text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-zen-muted hover:bg-zen-bg/80 hover:text-zen-text border border-transparent hover:border-zen-border/50'}`}
                        title={app.label}
                    >
                        {app.icon}
                        <div className="absolute left-full ml-3 px-2 py-1 bg-zen-surface border border-zen-border rounded-md text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 text-zen-text uppercase shadow-lg backdrop-blur-md">{app.label}</div>
                    </button>
                ))}

                {customShortcuts.map(sc => (
                    <button
                        key={sc.id}
                        onClick={() => onOpenApp(sc.id)}
                        className="w-full aspect-square rounded-xl flex items-center justify-center transition-all relative group shrink-0 text-xl hover:bg-zen-bg/80 hover:scale-110 border border-transparent hover:border-zen-border/50"
                        title={sc.label}
                    >
                        {sc.emoji}
                        <div className="absolute left-full ml-3 px-2 py-1 bg-zen-surface border border-zen-border rounded-md text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 text-zen-text uppercase shadow-lg backdrop-blur-md">{sc.label}</div>
                    </button>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-3 w-full px-2.5 pb-2 app-no-drag">
                <button onClick={onToggleHistory} className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all border ${isHistoryOpen ? 'bg-zen-text text-zen-bg border-zen-text' : 'text-zen-muted border-transparent hover:bg-zen-bg hover:text-zen-text hover:border-zen-border'}`} title="GX Control / History">
                    <LayoutGrid className="w-5 h-5" />
                </button>
                <button onClick={onOpenSettings} className="w-full aspect-square rounded-xl text-zen-muted hover:bg-zen-bg hover:text-zen-text hover:border-zen-border border border-transparent flex items-center justify-center transition-all hover:rotate-45" title="Settings">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default GXSidebar;
