import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Zap, Globe, BrainCircuit, Paperclip, X, Image as ImageIcon, Video, Target, FileText, ChevronDown } from 'lucide-react';
import { SearchMode, Attachment } from '../types';

interface OmniBarProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
}

const OmniBar: React.FC<OmniBarProps> = ({ onSend, disabled, mode, setMode }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current && !showPreview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, showPreview]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const modes: { id: SearchMode; label: string; icon: React.ReactNode; }[] = [
    { id: 'fast', label: 'Fast', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'normal', label: 'Web', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'pro', label: 'Deep', icon: <BrainCircuit className="w-3.5 h-3.5" /> },
    { id: 'direct', label: 'Direct', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'image', label: 'Imagine', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-3.5 h-3.5" /> },
  ];

  const getPlaceholder = () => {
    if (mode === 'image') return "Describe an image to generate...";
    if (mode === 'video') return "Describe a video scene...";
    if (mode === 'direct') return "Ask a question directly...";
    return "Ask Saturn anything...";
  }

  const renderPreview = (attachment: Attachment) => {
    const type = attachment.mimeType;

    if (type.startsWith('image/')) {
      return <img src={attachment.preview} alt="Preview" className="h-14 w-14 rounded-xl border border-white/10 shadow-lg object-cover" />;
    }

    // Default
    return (
      <div className="h-14 w-14 rounded-xl border border-white/10 shadow-lg bg-white/5 flex items-center justify-center">
        <FileText className="w-6 h-6 text-zen-muted" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2 md:px-6 pb-2 md:pb-10">
      <div className={`
          relative group transition-all duration-500 ease-out 
          ${isFocused ? 'scale-[1.02]' : 'scale-100'}
      `}>
        {/* Animated Glow Gradient */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-[2rem] opacity-0 transition-opacity duration-500 blur-md ${isFocused ? 'opacity-60' : 'group-hover:opacity-20'}`} />

        <div className={`
            relative glass-panel rounded-[1.8rem] flex flex-col transition-all duration-300
            ${isFocused ? 'shadow-[0_0_50px_-10px_rgba(var(--accent-color),0.2)]' : 'shadow-deep'}
        `}>

          {/* Attachments Area */}
          {attachments.length > 0 && (
            <div className="flex px-5 pt-5 gap-3 overflow-x-auto no-scrollbar">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group/preview animate-scale-in flex-shrink-0">
                  {renderPreview(att)}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-stretch gap-3 px-4 py-3">
            {/* File Upload Button */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`
                    w-11 h-11 rounded-2xl transition-all duration-300 flex-shrink-0 flex items-center justify-center
                    ${attachments.length > 0 ? 'text-zen-accent bg-zen-accent/10' : 'text-zen-muted hover:bg-white/5 hover:text-zen-text'}
                `}
              disabled={mode === 'video'}
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 min-w-0 flex items-center h-11">
              {showPreview ? (
                <div className="w-full py-3 px-2 max-h-[200px] overflow-y-auto custom-scrollbar text-zen-text prose prose-invert prose-sm" onClick={() => setShowPreview(false)}>
                  <ReactMarkdown>{input}</ReactMarkdown>
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
                  className="w-full h-full bg-transparent border-0 outline-none focus:ring-0 text-zen-text placeholder-zen-muted/50 resize-none px-0 py-0 text-base leading-normal max-h-[200px] overflow-y-auto disabled:opacity-50 caret-zen-accent font-normal"
                />
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || disabled}
              className={`
                w-11 h-11 rounded-2xl transition-all duration-500 flex-shrink-0 flex items-center justify-center overflow-hidden relative group/send
                ${(input.trim() || attachments.length > 0) && !disabled
                  ? 'bg-zen-text text-zen-bg hover:scale-105 shadow-glow-lg'
                  : 'bg-white/5 text-zen-muted cursor-not-allowed'}
              `}
            >
              {disabled ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-zen-accent to-purple-500 opacity-0 group-hover/send:opacity-100 transition-opacity duration-300" />
                  <ArrowUp className="w-5 h-5 relative z-10 group-hover/send:text-white transition-colors" />
                </>
              )}
            </button>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 bg-black/20 border-t border-white/5">
            {/* Mode Selector Custom Dropdown */}
            <div className="relative flex items-center gap-2" ref={dropdownRef}>
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-zen-surface border border-zen-border rounded-xl hover:border-zen-accent transition-all text-xs font-bold uppercase tracking-wider text-zen-text"
              >
                <span className="text-zen-accent">
                  {modes.find(m => m.id === mode)?.icon}
                </span>
                <span>{modes.find(m => m.id === mode)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-zen-muted transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showModeDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-zen-surface border border-zen-border rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMode(m.id);
                        setShowModeDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${mode === m.id
                        ? 'bg-zen-accent text-white'
                        : 'text-zen-text hover:bg-white/5'
                        }`}
                    >
                      <span className={mode === m.id ? 'text-white' : 'text-zen-accent'}>
                        {m.icon}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setShowPreview(!showPreview)} className={`text-[10px] font-bold uppercase tracking-widest transition-colors hover:underline ${showPreview ? 'text-zen-accent' : 'text-zen-muted hover:text-zen-text'}`}>
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OmniBar;
