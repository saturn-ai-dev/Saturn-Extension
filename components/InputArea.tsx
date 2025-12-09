
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Zap, Globe, BrainCircuit, Paperclip, X, Image as ImageIcon, Video, Target, Eye, EyeOff, ChevronDown, Check, FileText } from 'lucide-react';
import { SearchMode, Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
  onGetContext?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled, mode, setMode, onGetContext }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const modes: { id: SearchMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'fast', label: 'Fast', icon: <Zap className="w-4 h-4 text-yellow-400" />, desc: 'Quick answers' },
    { id: 'normal', label: 'Web', icon: <Globe className="w-4 h-4 text-blue-400" />, desc: 'Search the web' },
    { id: 'pro', label: 'Deep', icon: <BrainCircuit className="w-4 h-4 text-purple-400" />, desc: 'Complex reasoning' },
    { id: 'direct', label: 'Direct', icon: <Target className="w-4 h-4 text-red-400" />, desc: 'Concise facts' },
    { id: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4 text-pink-400" />, desc: 'Generate art' },
    { id: 'video', label: 'Video', icon: <Video className="w-4 h-4 text-orange-400" />, desc: 'Create clips' },
  ];

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

        <div className={`absolute -inset-0.5 bg-gradient-to-r from-zen-accent via-purple-500 to-zen-accent rounded-[28px] opacity-0 transition-opacity duration-500 blur-xl ${isFocused ? 'opacity-20' : 'group-hover:opacity-10'}`} />

        <div className={`
            relative bg-zen-surface/95 backdrop-blur-2xl rounded-[28px] border border-zen-border flex flex-col transition-all duration-300
            ${isFocused ? 'border-zen-text/30 shadow-glow-lg translate-y-[-2px]' : 'shadow-deep hover:border-zen-border/80'}
        `}>

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
                className="p-2 rounded-full hover:bg-zen-bg/50 hover:text-zen-text transition-colors"
                title="Attach File"
                disabled={mode === 'image' || mode === 'video'}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              {onGetContext && (
                <button
                  onClick={onGetContext}
                  className="p-2 rounded-full hover:bg-zen-bg/50 hover:text-zen-text transition-colors"
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
                  placeholder={getPlaceholder()}
                  disabled={disabled}
                  rows={1}
                  className="w-full bg-transparent border-0 focus:ring-0 outline-none focus:outline-none text-zen-text placeholder-zen-muted/60 resize-y py-3 px-2 text-base leading-relaxed max-h-[400px] min-h-[48px] overflow-y-auto disabled:opacity-0 caret-zen-accent font-medium"
                  style={{ minHeight: '48px' }}
                />
              )}
            </div>

            {/* Mode Dropdown & Send Right */}
            <div className="flex items-center gap-3 pb-1.5">

              {/* Mode Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zen-bg/50 hover:bg-zen-bg text-zen-text border border-zen-border/50 hover:border-zen-accent/50 transition-all text-xs font-bold uppercase tracking-wide min-w-[100px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    {currentMode.icon}
                    <span>{currentMode.label}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModeDropdown && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 bg-zen-surface/95 backdrop-blur-xl border border-zen-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-[60] origin-bottom-right p-1">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setShowModeDropdown(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${mode === m.id ? 'bg-zen-bg text-zen-text shadow-sm' : 'text-zen-muted hover:text-zen-text hover:bg-zen-bg/50'}`}
                      >
                        <div className={`p-2 rounded-lg bg-zen-bg border border-zen-border/50 group-hover:border-zen-accent/30 transition-colors ${mode === m.id ? 'border-zen-accent' : ''}`}>
                          {m.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold uppercase tracking-wider">{m.label}</div>
                          <div className="text-[10px] text-zen-muted font-medium">{m.desc}</div>
                        </div>
                        {mode === m.id && <Check className="w-3.5 h-3.5 text-zen-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className={`
                    p-3 rounded-xl transition-all duration-300 flex-shrink-0
                    ${(input.trim() || attachments.length > 0) && !disabled
                    ? 'bg-zen-text text-zen-bg hover:bg-zen-accent hover:text-white shadow-lg transform hover:scale-105 active:scale-95'
                    : 'bg-zen-surface text-zen-muted cursor-not-allowed border border-zen-border'}
                `}
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