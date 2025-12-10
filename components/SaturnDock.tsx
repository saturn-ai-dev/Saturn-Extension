import React from 'react';
import { Plus, Settings, LayoutGrid, FileText, Calculator } from 'lucide-react';
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
    ];

    const displayedApps = apps.filter(app => enabledApps.includes(app.id));

    return (
        <div className="fixed z-50 glass-panel transition-all duration-500 active:shadow-glow border-zen-border/30 flex items-center app-drag md:left-6 md:top-1/2 md:-translate-y-1/2 md:h-[80vh] md:w-16 md:flex-col md:py-8 md:gap-6 md:rounded-[2rem] bottom-4 left-4 right-4 h-16 w-auto flex-row px-4 gap-4 rounded-2xl">
            {/* Logo / New Tab */}
            <div className="group cursor-pointer relative flex items-center justify-center app-no-drag mb-2 active:scale-95" onClick={onNewTab}>
                <div className="absolute inset-0 bg-zen-accent/30 blur-xl rounded-full opacity-0 group-active:opacity-100 transition-opacity duration-300" />
                <div className="w-11 h-11 rounded-2xl bg-zen-surface border border-zen-border/50 flex items-center justify-center text-zen-accent shadow-lg transition-all duration-300 active:rotate-90">
                    <svg viewBox="0 0 100 100" className="w-6 h-6 fill-current">
                        <circle cx="50" cy="50" r="20" />
                        <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                    </svg>
                </div>
            </div>

            <div className="md:w-8 md:h-px w-px h-8 bg-gradient-to-r md:bg-gradient-to-r from-transparent via-zen-border/50 to-transparent shrink-0" />

            {/* Apps Area (Centered, No Scroll) */}
            <div className="flex md:flex-col flex-row gap-4 md:w-full md:px-2 w-auto px-0 app-no-drag flex-1 items-center justify-center md:py-2">
                {displayedApps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => onOpenApp(app.id)}
                        className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group shrink-0
                            ${activeApp === app.id
                                ? 'bg-gradient-to-br from-zen-accent to-purple-600 text-white shadow-glow scale-110'
                                : 'text-zen-muted active:bg-white/10 active:text-zen-text active:scale-110'}
                        `}
                    >
                        {app.icon}

                        {/* Tooltip */}
                        <div className="absolute left-full ml-5 px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg text-[10px] font-bold tracking-widest opacity-0 md:group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 text-white uppercase shadow-2xl translate-x-2 md:group-hover:translate-x-0">
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group shrink-0 text-xl active:bg-white/10 active:scale-110 grayscale active:grayscale-0 duration-300"
                        title={sc.label}
                    >
                        {sc.emoji}
                    </button>
                ))}
            </div>

            <div className="md:w-8 md:h-px w-px h-8 bg-gradient-to-r md:bg-gradient-to-r from-transparent via-zen-border/50 to-transparent shrink-0" />

            {/* System Controls */}
            <div className="flex md:flex-col flex-row gap-4 md:w-full md:px-2 w-auto px-0 app-no-drag items-center">
                <button onClick={onToggleHistory} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 ${isHistoryOpen ? 'bg-zen-text text-zen-bg shadow-glow' : 'text-zen-muted active:bg-white/10 active:text-zen-text'}`}>
                    <LayoutGrid className="w-5 h-5" />
                </button>
                <button onClick={onOpenSettings} className="w-10 h-10 rounded-xl text-zen-muted active:bg-white/10 active:text-zen-text flex items-center justify-center transition-all duration-300 active:rotate-180 active:scale-110" title="Settings">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default SaturnDock;
