import React from 'react';
import { Plus, Settings, LayoutGrid, FileText, Calculator, Music, Twitch } from 'lucide-react';
import { CustomShortcut } from '../types';

interface SaturnDockProps {
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
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.54.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
);

const SaturnDock: React.FC<SaturnDockProps> = ({
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
        <div className="fixed z-50 glass-panel transition-all duration-500 hover:shadow-glow border-zen-border/30 flex items-center app-drag md:left-6 md:top-1/2 md:-translate-y-1/2 md:h-[80vh] md:w-16 md:flex-col md:py-8 md:gap-6 md:rounded-[2rem] bottom-4 left-4 right-4 h-16 w-auto flex-row px-4 gap-4 rounded-2xl">
            {/* Logo / New Tab */}
            <div className="group cursor-pointer relative flex items-center justify-center app-no-drag mb-2 hover-lift" onClick={onNewTab}>
                <div className="absolute inset-0 bg-zen-accent/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-11 h-11 rounded-2xl bg-zen-surface border border-zen-border/50 flex items-center justify-center text-zen-accent shadow-lg transition-all duration-500 group-hover:rotate-[360deg]">
                    <svg viewBox="0 0 100 100" className="w-6 h-6 fill-current">
                        <circle cx="50" cy="50" r="20" />
                        <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                    </svg>
                </div>
            </div>

            <div className="md:w-8 md:h-px w-px h-8 bg-gradient-to-r md:bg-gradient-to-r from-transparent via-zen-border/50 to-transparent shrink-0" />

            {/* Apps Scroll Area */}
            <div className="flex md:flex-col flex-row gap-4 md:w-full md:px-2 w-auto px-0 app-no-drag md:overflow-y-auto overflow-x-auto no-scrollbar flex-1 items-center md:py-2">
                {displayedApps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => onOpenApp(app.id)}
                        className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group shrink-0
                            ${activeApp === app.id
                                ? 'bg-gradient-to-br from-zen-accent to-purple-600 text-white shadow-glow scale-110'
                                : 'text-zen-muted hover:bg-white/10 hover:text-zen-text hover:scale-110'}
                        `}
                    >
                        {app.icon}

                        {/* Tooltip */}
                        <div className="absolute left-full ml-5 px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 text-white uppercase shadow-2xl translate-x-2 group-hover:translate-x-0">
                            {app.label}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-black/80 border-l border-b border-white/10 transform rotate-45"></div>
                        </div>

                        {/* Active Indicator */}
                        {activeApp === app.id && (
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-zen-accent rounded-r-full shadow-[0_0_10px_var(--accent-color)]" />
                        )}
                    </button>
                ))}

                {customShortcuts.map(sc => (
                    <button
                        key={sc.id}
                        onClick={() => onOpenApp(sc.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group shrink-0 text-xl hover:bg-white/10 hover:scale-110 grayscale hover:grayscale-0 duration-300"
                        title={sc.label}
                    >
                        {sc.emoji}
                    </button>
                ))}
            </div>

            <div className="md:w-8 md:h-px w-px h-8 bg-gradient-to-r md:bg-gradient-to-r from-transparent via-zen-border/50 to-transparent shrink-0" />

            {/* System Controls */}
            <div className="flex md:flex-col flex-row gap-4 md:w-full md:px-2 w-auto px-0 app-no-drag items-center">
                <button onClick={onToggleHistory} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover-lift ${isHistoryOpen ? 'bg-zen-text text-zen-bg shadow-glow' : 'text-zen-muted hover:bg-white/10 hover:text-zen-text'}`}>
                    <LayoutGrid className="w-5 h-5" />
                </button>
                <button onClick={onOpenSettings} className="w-10 h-10 rounded-xl text-zen-muted hover:bg-white/10 hover:text-zen-text flex items-center justify-center transition-all duration-500 hover:rotate-180 hover:scale-110" title="Settings">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default SaturnDock;
