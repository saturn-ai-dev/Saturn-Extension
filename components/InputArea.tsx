
import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Zap, Globe, BrainCircuit, Paperclip, X, Image as ImageIcon, Video, Target, Eye, EyeOff, ChevronDown, Check, FileText, GripHorizontal } from 'lucide-react';
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
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [inputWidth, setInputWidth] = useState(100); // percentage width
  const [isAbove45, setIsAbove45] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current && !showPreview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 600) + 'px';
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

  // Track vertical position to determine dropdown direction
  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const centerY = rect.top + rect.height / 2;
        setIsAbove45(centerY < viewportHeight * 0.45);
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [verticalOffset, inputWidth]);

  // Vertical drag handler (move up/down)
  const handleVerticalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startY = e.clientY;
    const startOffset = verticalOffset;
    const maxOffset = window.innerHeight * 0.4; // Max 40% of screen height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newOffset = Math.max(-maxOffset, Math.min(maxOffset, startOffset + delta));
      setVerticalOffset(newOffset);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [verticalOffset]);

  // Horizontal collapse/expand handler (resize width)
  const handleWidthResize = useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = inputWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = containerRef.current?.parentElement?.offsetWidth || window.innerWidth;
      const deltaPercent = (delta / containerWidth) * 100;

      let newWidth: number;
      if (direction === 'right') {
        newWidth = startWidth + deltaPercent * 2; // *2 because we're resizing from center
      } else {
        newWidth = startWidth - deltaPercent * 2;
      }

      // Clamp between 40% and 100%
      newWidth = Math.max(40, Math.min(100, newWidth));
      setInputWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [inputWidth]);

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
    <div
      ref={containerRef}
      className="mx-auto relative z-50 transition-all duration-75"
      style={{
        transform: `translateY(${verticalOffset}px)`,
        width: `${inputWidth}%`
      }}
    >
      <div className={`relative group transition-all duration-500 ease-out ${isDragging ? 'cursor-grabbing' : ''}`}>

        {/* Top vertical move bar - drag to move up/down */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 h-2 w-24 rounded-full bg-zen-border/40 
          hover:bg-zen-accent/60 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-all duration-200
          hover:h-2.5 hover:w-32 flex items-center justify-center z-10"
          onMouseDown={handleVerticalDrag}
        >
          <GripHorizontal className="w-4 h-4 text-zen-muted opacity-0 group-hover:opacity-70" />
        </div>

        {/* Left width collapse handle */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-2 h-16 rounded-full bg-zen-border/40 
          hover:bg-zen-accent/60 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-200
          hover:w-2.5 hover:h-20 flex items-center justify-center"
          onMouseDown={(e) => handleWidthResize(e, 'left')}
        >
          <div className="w-0.5 h-6 bg-zen-muted/50 rounded-full" />
        </div>

        {/* Right width collapse handle */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-2 h-16 rounded-full bg-zen-border/40 
          hover:bg-zen-accent/60 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-200
          hover:w-2.5 hover:h-20 flex items-center justify-center"
          onMouseDown={(e) => handleWidthResize(e, 'right')}
        >
          <div className="w-0.5 h-6 bg-zen-muted/50 rounded-full" />
        </div>

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
                  className="w-full py-3 px-0 text-base leading-relaxed max-h-[600px] resize-y overflow-y-auto custom-scrollbar text-zen-text prose prose-neutral dark:prose-invert max-w-none cursor-pointer"
                  onClick={() => setShowPreview(false)}
                  title="Click to edit"
                >
                  {input.trim() ? <ReactMarkdown>{input}</ReactMarkdown> : <span className="text-zen-muted italic">Empty</span>}
                </div>
              ) : (
                <div className="relative w-full group/resize">
                  {/* Top resize handle (mirrored) */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-12 h-1.5 rounded-full bg-zen-border/40 
                    hover:bg-zen-accent/60 cursor-ns-resize opacity-0 group-hover/resize:opacity-100 transition-all duration-200
                    hover:h-2 hover:w-16"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const textarea = textareaRef.current;
                      if (!textarea) return;
                      const startY = e.clientY;
                      const startHeight = textarea.offsetHeight;

                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const delta = startY - moveEvent.clientY; // Inverted for top handle
                        const newHeight = Math.max(48, Math.min(600, startHeight + delta));
                        textarea.style.height = `${newHeight}px`;
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
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
                    className="w-full bg-transparent border-0 focus:ring-0 outline-none focus:outline-none text-zen-text placeholder-zen-muted/60 resize-y py-3 px-2 text-base leading-relaxed max-h-[600px] overflow-y-auto disabled:opacity-0 caret-zen-accent font-medium"
                    style={{ minHeight: '48px' }}
                  />
                  {/* Bottom resize handle (mirrored) */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-12 h-1.5 rounded-full bg-zen-border/40 
                    hover:bg-zen-accent/60 cursor-ns-resize opacity-0 group-hover/resize:opacity-100 transition-all duration-200
                    hover:h-2 hover:w-16"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const textarea = textareaRef.current;
                      if (!textarea) return;
                      const startY = e.clientY;
                      const startHeight = textarea.offsetHeight;

                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const delta = moveEvent.clientY - startY;
                        const newHeight = Math.max(48, Math.min(600, startHeight + delta));
                        textarea.style.height = `${newHeight}px`;
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Mode Dropdown & Send Right */}
            <div className="flex items-center gap-3 pb-1.5">

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

          {/* Mode Sidebar - Under Input Area */}
          <div className="px-4 pb-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap
                    ${mode === m.id
                      ? 'bg-zen-accent/20 text-zen-accent border border-zen-accent/50 shadow-sm'
                      : 'bg-zen-bg/50 text-zen-muted border border-zen-border/30 hover:text-zen-text hover:bg-zen-bg hover:border-zen-border/60'
                    }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;