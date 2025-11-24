
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Zap, Globe, BrainCircuit, Paperclip, X, Image as ImageIcon, Video, Target, FileType, Music, File, FileText, Eye, EyeOff } from 'lucide-react';
import { SearchMode, Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled, mode, setMode }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { id: 'fast', label: 'Fast', icon: <Zap className="w-3 h-3" /> },
    { id: 'normal', label: 'Web', icon: <Globe className="w-3 h-3" /> },
    { id: 'pro', label: 'Deep', icon: <BrainCircuit className="w-3 h-3" /> },
    { id: 'direct', label: 'Direct', icon: <Target className="w-3 h-3" /> },
    { id: 'image', label: 'Image', icon: <ImageIcon className="w-3 h-3" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-3 h-3" /> },
  ];

  const getPlaceholder = () => {
    if (mode === 'image') return "Describe an image to generate...";
    if (mode === 'video') return "Describe a video to generate (takes time)...";
    if (mode === 'direct') return "Ask for a short answer...";
    return "Ask anything or type a URL...";
  }

  const renderPreview = (attachment: Attachment) => {
    const type = attachment.mimeType;

    if (type.startsWith('image/')) {
      return <img src={attachment.preview} alt="Preview" className="h-20 w-20 rounded-xl border border-white/10 shadow-lg object-cover" />;
    }

    if (type.startsWith('video/')) {
      return (
        <div className="h-20 w-20 rounded-xl border border-white/10 shadow-lg bg-black flex items-center justify-center relative overflow-hidden">
          <video src={attachment.preview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <Video className="w-6 h-6 text-white relative z-10" />
        </div>
      );
    }

    if (type.startsWith('audio/')) {
      return (
        <div className="h-20 w-20 rounded-xl border border-white/10 shadow-lg bg-white/5 flex flex-col items-center justify-center gap-1 p-1">
          <Music className="w-6 h-6 text-pink-500" />
          <span className="text-[8px] text-gray-400 truncate w-full text-center px-1">{attachment.name}</span>
        </div>
      );
    }

    // Default / PDF
    return (
      <div className="h-20 w-20 rounded-xl border border-white/10 shadow-lg bg-black/20 flex flex-col items-center justify-center gap-1 p-1 text-center">
        <FileText className="w-6 h-6 text-zen-accent" />
        <span className="text-[8px] text-gray-400 font-medium truncate w-full px-1">{attachment.name || 'File'}</span>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="relative group transition-all duration-500 ease-out">

        <div className={`absolute -inset-0.5 bg-gradient-to-r from-zen-accent via-purple-500 to-zen-accent rounded-[32px] opacity-0 transition-opacity duration-500 blur-xl ${isFocused ? 'opacity-20' : 'group-hover:opacity-10'}`} />

        <div className={`
            relative bg-zen-surface/95 backdrop-blur-2xl rounded-[32px] border border-zen-border flex flex-col transition-all duration-300
            ${isFocused ? 'border-zen-text/30 shadow-glow-lg translate-y-[-2px]' : 'shadow-deep hover:border-zen-border/80'}
        `}>

          {attachments.length > 0 && (
            <div className="mx-6 mt-6 mb-2">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group/preview animate-scale-in flex-shrink-0">
                    {renderPreview(att)}
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-zen-surface text-zen-text rounded-full p-1 border border-white/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-md opacity-0 group-hover/preview:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end p-6 pl-10 pr-6">
            {showPreview ? (
              <div
                className="w-full py-4 px-0 text-lg leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar text-zen-text prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5 cursor-pointer"
                onClick={() => setShowPreview(false)}
                title="Click to edit"
              >
                {input.trim() ? (
                  <ReactMarkdown>{input}</ReactMarkdown>
                ) : (
                  <span className="text-zen-muted italic opacity-50">Nothing to preview</span>
                )}
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
                className="w-full bg-transparent border-0 focus:ring-0 text-zen-text placeholder-zen-muted/60 resize-none py-4 px-0 text-xl leading-relaxed max-h-[200px] overflow-y-auto disabled:opacity-50 caret-zen-accent font-medium"
                style={{ minHeight: '64px' }}
              />
            )}

            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || disabled}
              className={`
                p-4 rounded-full mb-2 ml-8 transition-all duration-300 flex-shrink-0
                ${(input.trim() || attachments.length > 0) && !disabled
                  ? 'bg-zen-text text-zen-bg hover:bg-zen-accent hover:text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] transform hover:scale-110 active:scale-90 hover-lift'
                  : 'bg-zen-surface text-zen-muted cursor-not-allowed border border-zen-border'}
              `}
            >
              {disabled ? (
                <div className="w-6 h-6 animate-spin">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="20" fill="currentColor" />
                    <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                  </svg>
                </div>
              ) : (
                <ArrowUp className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-10 pb-6 pt-2 border-t border-zen-border/30 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 min-w-max">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*" // Accept all files
                multiple
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full hover:bg-zen-bg/50 text-zen-muted hover:text-zen-text transition-colors"
                title="Attach File"
                disabled={mode === 'image' || mode === 'video'}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                disabled={!input.trim()}
                className={`p-2.5 rounded-full transition-colors ${showPreview ? 'bg-zen-bg text-zen-accent' : 'hover:bg-zen-bg/50 text-zen-muted hover:text-zen-text disabled:opacity-30'}`}
                title={showPreview ? "Back to Editing" : "Preview Markdown"}
              >
                {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>

              <div className="w-px h-5 bg-zen-border mx-1"></div>

              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 uppercase hover-lift
                        ${mode === m.id
                      ? 'bg-zen-text text-zen-bg shadow-md transform scale-105'
                      : 'text-zen-muted hover:text-zen-text hover:bg-zen-bg/50'}
                    `}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="text-center mt-8 text-[10px] text-zen-muted font-bold tracking-[0.3em] opacity-40 uppercase">
        Saturn AI • {mode} Mode
      </div>
    </div>
  );
};

export default InputArea;
