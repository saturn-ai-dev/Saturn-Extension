
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Zap, Globe, BrainCircuit, Paperclip, X, Image as ImageIcon, Video, Target, Eye, EyeOff, ChevronDown, Check, FileText, AlertTriangle } from 'lucide-react';
import { SearchMode, Attachment, CustomMode } from '../types';
import { getRemainingUsage, isModeExhausted, isImageGenAvailable, isVideoGenAvailable, isFallbackMode } from '../services/usageService';
import RocketFuelGauge from './RocketFuelGauge';

interface InputAreaProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
  onGetContext?: () => void;
  draft?: { text: string, timestamp: number };
  customModes?: CustomMode[];
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled, mode, setMode, onGetContext, draft, customModes = [] }) => {
  const [input, setInput] = useState('');
  
  useEffect(() => {
    if (draft) {
      setInput(draft.text);
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Optional: Move cursor to end
        textareaRef.current.setSelectionRange(draft.text.length, draft.text.length);
      }
    }
  }, [draft]);

  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current && !showPreview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, showPreview]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
      setShowPreview(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          setAttachments(prev => [...prev, {
            file,
            preview: result,
            base64,
            mimeType: file.type || 'application/octet-stream',
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the input area entirely
    if (inputAreaRef.current && !inputAreaRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          setAttachments(prev => [...prev, {
            file,
            preview: result,
            base64,
            mimeType: file.type || 'application/octet-stream',
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            setAttachments(prev => [...prev, {
              file,
              preview: result,
              base64,
              mimeType: file.type,
              name: `pasted-image-${Date.now()}.${file.type.split('/')[1]}`
            }]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const remaining = getRemainingUsage();
  const fallback = isFallbackMode();

  const getModeCredits = (id: SearchMode): string => {
    switch (id) {
      case 'fast': return `${remaining.fast} left`;
      case 'normal': return `${remaining.web} left`;
      case 'pro': return `${remaining.deep} left`;
      default: return '';
    }
  };

  const isModeDisabled = (id: SearchMode): boolean => {
    if (id === 'image') return !isImageGenAvailable();
    if (id === 'video') return !isVideoGenAvailable();
    return false;
  };

  const builtinModes: { id: SearchMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'fast', label: 'Fast', icon: <Zap className="w-4 h-4 text-yellow-400" />, desc: remaining.fast > 0 ? `${remaining.fast} credits left` : '⚠️ Exhausted' },
    { id: 'normal', label: 'Web', icon: <Globe className="w-4 h-4 text-blue-400" />, desc: remaining.web > 0 ? `${remaining.web} credits left` : '⚠️ Exhausted' },
    { id: 'pro', label: 'Deep', icon: <BrainCircuit className="w-4 h-4 text-purple-400" />, desc: remaining.deep > 0 ? `${remaining.deep} credits left` : '⚠️ Exhausted' },
    { id: 'direct', label: 'Direct', icon: <Target className="w-4 h-4 text-red-400" />, desc: 'Concise facts' },
    { id: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4 text-pink-400" />, desc: fallback ? '🚫 Unavailable' : 'Generate art' },
    { id: 'video', label: 'Video', icon: <Video className="w-4 h-4 text-orange-400" />, desc: fallback ? '🚫 Unavailable' : 'Create clips' },
  ];

  const customModeEntries = customModes.map(cm => ({
    id: cm.id as SearchMode,
    label: cm.label,
    icon: <span className="text-base leading-none">{cm.emoji}</span>,
    desc: cm.desc || cm.model,
  }));

  const modes = [...builtinModes, ...customModeEntries];

  const currentMode = modes.find(m => m.id === mode) || modes[1];

  const getPlaceholder = () => {
    if (mode === 'image') return "Describe an image to generate...";
    if (mode === 'video') return "Describe a video to generate (takes time)...";
    if (mode === 'direct') return "Ask for a short answer...";
    return "Ask anything or type a URL...";
  }

  const renderPreview = (attachment: Attachment) => {
    const type = attachment.mimeType;

    if (type.startsWith('image/')) {
      return <img src={attachment.preview} alt="Preview" className="h-16 w-16 rounded-xl border border-white/10 shadow-lg object-cover" />;
    }
    // ... (Rest of preview logic same as before, just smaller size if needed)
    return (
      <div className="h-16 w-16 rounded-xl border border-white/10 shadow-lg bg-zen-surface flex flex-col items-center justify-center gap-1 p-1 text-center">
        <Paperclip className="w-5 h-5 text-zen-accent" />
        <span className="text-[8px] text-zen-muted font-medium truncate w-full px-1">{attachment.name || 'File'}</span>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto relative z-50">
      <div className="relative group transition-all duration-500 ease-out">

        <div
          ref={inputAreaRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className={`
            chat-input-shell relative rounded-[28px] border flex flex-col transition-[border-color,box-shadow,transform] duration-300
            ${isDragging ? 'border-zen-accent/60 border-dashed' : isFocused ? 'border-zen-text/20' : 'border-zen-border/60'}
          `}
          style={{
            boxShadow: isFocused
              ? '0 0 0 1px rgba(var(--accent-color-rgb),0.2), 0 22px 58px -34px rgba(var(--accent-color-rgb),0.65), 0 16px 34px -28px rgba(0,0,0,0.7)'
              : '0 18px 48px -34px rgba(0,0,0,0.7)'
          }}
        >
          {isDragging && (
            <div className="absolute inset-3 rounded-[22px] border border-dashed border-zen-accent/60 bg-zen-accent/5 flex items-center justify-center pointer-events-none z-20">
              <div className="px-4 py-2 rounded-full bg-zen-bg/80 text-sm font-medium text-zen-text border border-zen-accent/30 shadow-lg">
                Drop files to attach
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="mx-4 mt-4 mb-1">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group/preview animate-scale-in flex-shrink-0">
                    {renderPreview(att)}
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-zen-surface text-zen-text rounded-full p-0.5 border border-white/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-md opacity-0 group-hover/preview:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end p-3 pl-4 pr-3 gap-3">
            {/* Tools / Attachments Left */}
            <div className="flex items-center gap-2 pb-3 text-zen-muted">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
                multiple
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl hover:bg-zen-bg/70 hover:text-zen-text transition-colors"
                title="Attach File"
                disabled={mode === 'image' || mode === 'video'}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              {onGetContext && (
                <button
                  onClick={onGetContext}
                  className="p-2.5 rounded-2xl hover:bg-zen-bg/70 hover:text-zen-text transition-colors"
                  title="Add Current Page Content"
                  disabled={disabled}
                >
                  <FileText className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Text Input */}
            <div className="flex-1 min-w-0">
              {showPreview ? (
                <div
                  className="w-full py-3 px-0 text-base leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar text-zen-text prose prose-neutral dark:prose-invert max-w-5xl cursor-pointer"
                  onClick={() => setShowPreview(false)}
                  title="Click to edit"
                >
                  {input.trim() ? <ReactMarkdown>{input}</ReactMarkdown> : <span className="text-zen-muted italic">Empty</span>}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={getPlaceholder()}
                  disabled={disabled}
                  rows={1}
                  className="w-full bg-transparent border-0 focus:ring-0 outline-none focus:outline-none text-zen-text placeholder-zen-muted/60 resize-y py-3 px-2 text-[15px] leading-7 max-h-[400px] min-h-[56px] overflow-y-auto disabled:opacity-50 caret-zen-accent font-normal"
                  style={{ minHeight: '56px' }}
                />
              )}
              <div className="flex items-center gap-2 px-2 pt-1 text-[11px] text-zen-muted/65">
                <span className="inline-flex items-center gap-1 rounded-full bg-zen-bg/60 px-2 py-1 border border-zen-border/40">Enter to send</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-zen-bg/60 px-2 py-1 border border-zen-border/40">Shift + Enter for newline</span>
              </div>
            </div>

            {/* Mode Dropdown & Send Right */}
            <div className="flex items-center gap-3 pb-1.5">

              {/* Rocket Fuel Gauge */}
              <div className="pb-2">
                <RocketFuelGauge />
              </div>

              {/* Mode Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zen-bg/70 hover:bg-zen-bg text-zen-text border border-zen-border/40 hover:border-zen-border transition-[background,border-color,transform] duration-150 text-xs font-medium min-w-[98px] justify-between hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    {currentMode.icon}
                    <span>{currentMode.label}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModeDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 glass-elevated rounded-[20px] shadow-xl animate-dropdown-open z-[60] origin-bottom-right p-2 space-y-1">
                    {modes.map((m) => {
                      const mDisabled = isModeDisabled(m.id);
                      return (
                      <button
                        key={m.id}
                        onClick={() => { if (!mDisabled) { setMode(m.id); setShowModeDropdown(false); } }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[12px] text-left transition-[background,color] duration-150 ${mDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${mode === m.id ? 'bg-zen-bg text-zen-text' : 'text-zen-muted hover:text-zen-text hover:bg-zen-bg/50'}`}
                      >
                        <div className="flex items-center justify-center w-4 h-4 shrink-0">
                          {m.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">{m.label}</div>
                          <div className={`text-[10px] ${m.desc.includes('Exhausted') || m.desc.includes('Unavailable') ? 'text-red-400' : 'text-zen-muted/60'}`}>{m.desc}</div>
                        </div>
                        {mode === m.id && <Check className="w-3 h-3 text-zen-accent" />}
                      </button>
                    );
                    })}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className={`p-3.5 rounded-[18px] transition-all duration-300 flex-shrink-0 ${(input.trim() || attachments.length > 0) && !disabled ? 'bg-zen-text text-zen-bg hover:bg-zen-accent hover:text-white shadow-[0_18px_40px_-22px_rgba(var(--accent-color-rgb),0.9)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95' : 'bg-zen-surface text-zen-muted cursor-not-allowed border border-zen-border'}`}
              >
                {disabled ? (
                  <div className="w-5 h-5 animate-spin">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="20" fill="currentColor" />
                      <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                    </svg>
                  </div>
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
