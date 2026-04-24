import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Globe, BrainCircuit, Image as ImageIcon, Video, Target, ChevronDown } from 'lucide-react';
import { SearchMode, CustomMode } from '../types';
import { getRemainingUsage, isImageGenAvailable, isVideoGenAvailable, isFallbackMode } from '../services/usageService';

interface SearchModeSelectorProps {
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
  customModes?: CustomMode[];
  dropdownPlacement?: 'up' | 'down';
  menuAlign?: 'left' | 'right';
  buttonClassName?: string;
  menuClassName?: string;
}

const SearchModeSelector: React.FC<SearchModeSelectorProps> = ({
  mode,
  setMode,
  customModes = [],
  dropdownPlacement = 'down',
  menuAlign = 'left',
  buttonClassName = '',
  menuClassName = ''
}) => {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const remaining = getRemainingUsage();
  const fallback = isFallbackMode();

  const modes = useMemo(() => {
    const builtinModes: { id: SearchMode; label: string; icon: React.ReactNode; desc: string }[] = [
      { id: 'fast', label: 'Fast', icon: <Zap className="w-4 h-4 text-yellow-400" />, desc: remaining.fast > 0 ? `${remaining.fast} credits left` : 'Exhausted' },
      { id: 'normal', label: 'Web', icon: <Globe className="w-4 h-4 text-blue-400" />, desc: remaining.web > 0 ? `${remaining.web} credits left` : 'Exhausted' },
      { id: 'pro', label: 'Deep', icon: <BrainCircuit className="w-4 h-4 text-purple-400" />, desc: remaining.deep > 0 ? `${remaining.deep} credits left` : 'Exhausted' },
      { id: 'direct', label: 'Direct', icon: <Target className="w-4 h-4 text-red-400" />, desc: 'Concise facts' },
      { id: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4 text-pink-400" />, desc: fallback ? 'Unavailable' : 'Generate art' },
      { id: 'video', label: 'Video', icon: <Video className="w-4 h-4 text-orange-400" />, desc: fallback ? 'Unavailable' : 'Create clips' },
    ];

    const customModeEntries = customModes.map(cm => ({
      id: cm.id as SearchMode,
      label: cm.label,
      icon: <span className="text-base leading-none">{cm.emoji}</span>,
      desc: cm.desc || cm.model,
    }));

    return [...builtinModes, ...customModeEntries];
  }, [customModes, fallback, remaining.deep, remaining.fast, remaining.web]);

  const currentMode = modes.find(m => m.id === mode) || modes[1];

  const isModeDisabled = (id: SearchMode): boolean => {
    if (id === 'image') return !isImageGenAvailable();
    if (id === 'video') return !isVideoGenAvailable();
    return false;
  };

  const placementClassName = dropdownPlacement === 'up' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top';
  const alignmentClassName = menuAlign === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowModeDropdown(prev => !prev)}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[16px] bg-zen-bg/70 hover:bg-zen-bg text-zen-text border border-zen-border/40 hover:border-zen-border/70 transition-all duration-200 text-sm font-medium min-w-[112px] justify-between interactive-btn hover-lift shadow-sm ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {currentMode.icon}
          <span className="truncate">{currentMode.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${showModeDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showModeDropdown && (
        <div className={`absolute ${alignmentClassName} ${placementClassName} w-60 glass-elevated rounded-[18px] shadow-xl animate-dropdown-open z-[60] p-2 space-y-1 border border-zen-border/50 ${menuClassName}`}>
          {modes.map((m) => {
            const isDisabled = isModeDisabled(m.id);

            return (
              <button
                key={m.id}
                onClick={() => {
                  if (!isDisabled) {
                    setMode(m.id);
                    setShowModeDropdown(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-left transition-all duration-200 hover-lift ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${mode === m.id ? 'bg-zen-accent/10 text-zen-text border border-zen-accent/30' : 'text-zen-muted hover:text-zen-text hover:bg-zen-bg/70'}`}
              >
                <div className="flex items-center justify-center w-5 h-5 shrink-0">
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{m.label}</div>
                  <div className={`text-[11px] truncate ${m.desc.includes('Exhausted') || m.desc.includes('Unavailable') ? 'text-red-400' : 'text-zen-muted/70'}`}>
                    {m.desc}
                  </div>
                </div>
                {mode === m.id && <div className="w-2 h-2 rounded-full bg-zen-accent shadow-[0_0_8px_var(--accent-color)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchModeSelector;
