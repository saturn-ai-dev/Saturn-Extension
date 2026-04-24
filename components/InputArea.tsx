import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Paperclip, X, FileText } from 'lucide-react';
import { SearchMode, Attachment, CustomMode } from '../types';
import RocketFuelGauge from './RocketFuelGauge';
import SearchModeSelector from './SearchModeSelector';

interface InputAreaProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
  onGetContext?: () => void;
  draft?: { text: string, timestamp: number };
  customModes?: CustomMode[];
  showModeControls?: boolean;
  hero?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  onSend,
  disabled,
  mode,
  setMode,
  onGetContext,
  draft,
  customModes = [],
  showModeControls = true,
  hero = false
}) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draft) {
      setInput(draft.text);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(draft.text.length, draft.text.length);
      }
    }
  }, [draft]);

  useEffect(() => {
    if (textareaRef.current && !showPreview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, showPreview]);

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

  const appendFiles = (files: File[]) => {
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      appendFiles(Array.from(e.target.files));
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
      appendFiles(files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
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

  const getPlaceholder = () => {
    if (mode === 'image') return 'Describe an image to generate...';
    if (mode === 'video') return 'Describe a video to generate (takes time)...';
    if (mode === 'direct') return 'Ask for a short answer...';
    return 'Ask anything or type a URL...';
  };

  const renderPreview = (attachment: Attachment) => {
    if (attachment.mimeType.startsWith('image/')) {
      return <img src={attachment.preview} alt="Preview" className="h-16 w-16 rounded-xl border border-white/10 shadow-lg object-cover" />;
    }

    return (
      <div className="h-16 w-16 rounded-xl border border-white/10 shadow-lg bg-zen-surface flex flex-col items-center justify-center gap-1 p-1 text-center">
        <Paperclip className="w-5 h-5 text-zen-accent" />
        <span className="text-[8px] text-zen-muted font-medium truncate w-full px-1">{attachment.name || 'File'}</span>
      </div>
    );
  };

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
            chat-input-shell relative ${hero ? 'rounded-[36px]' : 'rounded-[28px]'} border flex flex-col transition-all duration-300 hover-lift
            ${isDragging ? 'border-zen-accent/60 border-dashed bg-zen-accent/5' : isFocused ? 'border-zen-accent/55' : 'border-zen-border/40 hover:border-zen-border/70'}
          `}
          style={{
            boxShadow: isFocused
              ? hero
                ? '0 0 0 1px rgba(var(--accent-color-rgb),0.42), 0 0 55px -12px rgba(var(--accent-color-rgb),0.55), 0 38px 80px -40px rgba(0,0,0,0.85)'
                : '0 0 0 1px rgba(var(--accent-color-rgb),0.34), 0 0 25px -8px rgba(var(--accent-color-rgb),0.5), 0 20px 45px -30px rgba(0,0,0,0.7)'
              : hero
                ? '0 28px 70px -36px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 14px 32px -26px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.03)'
          }}
        >
          {isDragging && (
            <div className="absolute inset-3 rounded-[22px] border-2 border-dashed border-zen-accent/60 bg-zen-accent/5 flex items-center justify-center pointer-events-none z-20">
              <div className="px-5 py-2.5 rounded-full bg-zen-bg/90 backdrop-blur-sm text-sm font-semibold text-zen-text border border-zen-accent/40 shadow-lg hover-glow">
                Drop files to attach
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="mx-4 mt-4 mb-1">
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group/preview animate-scale-in flex-shrink-0 hover-lift">
                    {renderPreview(att)}
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-zen-surface/90 backdrop-blur-sm text-zen-text rounded-full p-1.5 border border-white/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-lg opacity-0 group-hover/preview:opacity-100 focus:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`flex items-end gap-3 ${hero ? 'p-5 pl-6 pr-5' : 'p-3 pl-4 pr-3'}`}>
            <div className={`flex items-center gap-2 text-zen-muted ${hero ? 'pb-4' : 'pb-3'}`}>
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
                className={`${hero ? 'p-3' : 'p-2.5'} rounded-2xl hover:bg-zen-bg/60 hover:text-zen-text border border-transparent hover:border-zen-border/30 transition-all interactive-btn hover-lift shadow-sm`}
                title="Attach File"
                disabled={mode === 'image' || mode === 'video'}
              >
                <Paperclip className={hero ? 'w-[22px] h-[22px]' : 'w-5 h-5'} />
              </button>
              {onGetContext && (
                <button
                  onClick={onGetContext}
                  className={`${hero ? 'p-3' : 'p-2.5'} rounded-2xl hover:bg-zen-bg/60 hover:text-zen-text border border-transparent hover:border-zen-border/30 transition-all interactive-btn hover-lift shadow-sm`}
                  title="Add Current Page Content"
                  disabled={disabled}
                >
                  <FileText className={hero ? 'w-[22px] h-[22px]' : 'w-5 h-5'} />
                </button>
              )}
            </div>

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
                  className={`w-full bg-transparent border-0 focus:ring-0 outline-none focus:outline-none text-zen-text placeholder-zen-muted/55 resize-y overflow-y-auto disabled:opacity-50 caret-zen-accent font-normal ${hero ? 'py-4 px-2 text-[17px] leading-8 max-h-[440px]' : 'py-3 px-2 text-[15px] leading-7 max-h-[400px]'}`}
                  style={{ minHeight: hero ? '72px' : '56px' }}
                />
              )}
            </div>

            <div className={`flex items-center ${showModeControls ? 'gap-3 pb-1.5' : 'pb-2'}`}>
              {showModeControls && (
                <>
                  <div className="pb-2">
                    <RocketFuelGauge />
                  </div>
                  <SearchModeSelector
                    mode={mode}
                    setMode={setMode}
                    customModes={customModes}
                    dropdownPlacement="up"
                    menuAlign="right"
                    buttonClassName="min-w-[100px] bg-zen-bg/60"
                  />
                </>
              )}

              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className={`${hero ? 'p-4 rounded-[24px]' : 'p-3.5 rounded-[20px]'} transition-all duration-300 flex-shrink-0 interactive-btn hover-lift ${(input.trim() || attachments.length > 0) && !disabled ? 'bg-zen-accent text-white hover:bg-zen-accent/90 shadow-[0_18px_40px_-18px_rgba(var(--accent-color-rgb),1)]' : 'bg-zen-surface/80 text-zen-muted cursor-not-allowed border border-zen-border/40'}`}
              >
                {disabled ? (
                  <div className={hero ? 'w-6 h-6 animate-spin' : 'w-5 h-5 animate-spin'}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="20" fill="currentColor" />
                      <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                    </svg>
                  </div>
                ) : (
                  <ArrowUp className={hero ? 'w-6 h-6' : 'w-5 h-5'} />
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
