import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BuiltinActionType, Renderer, type ActionEvent, type OpenUIError } from '@openuidev/react-lang';
import { saturnOpenUiLibrary } from '../services/openuiService';
import {
  parseOpenUIContext,
  separateOpenUIContent,
  wrapOpenUIContent,
  wrapOpenUIContext,
} from '../services/openuiContent';
import { AlertTriangle } from 'lucide-react';

interface OpenUIArtifactProps {
  content: string;
  isStreaming?: boolean;
  onFollowUp?: (text: string, forceOpenUI?: boolean) => void;
  onNavigate?: (url: string) => void;
  onEdit?: (text: string) => void;
  onPersistContent?: (content: string) => void;
}

const OpenUIArtifact: React.FC<OpenUIArtifactProps> = ({
  content,
  isStreaming = false,
  onFollowUp,
  onNavigate,
  onEdit,
  onPersistContent,
}) => {
  const [errors, setErrors] = useState<OpenUIError[]>([]);

  const { content: code, contextString } = useMemo(() => separateOpenUIContent(content || ''), [content]);
  const hasRoot = useMemo(() => /(^|\n)\s*root\s*=\s*[A-Za-z_][\w]*\s*\(/i.test(code), [code]);
  const initialState = useMemo(() => parseOpenUIContext(contextString), [contextString]);
  const [formState, setFormState] = useState<Record<string, unknown> | undefined>(initialState);

  useEffect(() => {
    setFormState(initialState);
  }, [initialState, code]);

  const persistContent = useCallback(
    (nextState: Record<string, unknown>) => {
      setFormState(nextState);
      if (!onPersistContent) return;
      const nextContent = `${code.trimEnd()}\n${wrapOpenUIContext(JSON.stringify([nextState]))}`;
      onPersistContent(nextContent);
    },
    [code, onPersistContent],
  );

  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const contextPayload: Array<string | Record<string, unknown>> = [
          `User clicked: ${event.humanFriendlyMessage}`,
        ];
        if (event.formState) {
          contextPayload.push(event.formState);
        }
        const nextContent = `${wrapOpenUIContent(event.humanFriendlyMessage || 'Continue')}\n${wrapOpenUIContext(JSON.stringify(contextPayload))}`;
        onFollowUp?.(nextContent, true);
        return;
      }

      if (event.type === BuiltinActionType.OpenUrl) {
        const url = String(event.params?.url || '');
        if (!url) return;
        if (onNavigate) {
          onNavigate(url);
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    },
    [onFollowUp, onNavigate],
  );

  return (
    <div className="w-full">
      {code.trim() && hasRoot ? (
        <Renderer
          response={code}
          library={saturnOpenUiLibrary}
          isStreaming={isStreaming}
          initialState={formState}
          onAction={handleAction}
          onStateUpdate={persistContent}
          onError={setErrors}
        />
      ) : (
        isStreaming ? (
          <div className="flex items-center gap-2 text-zen-muted py-2 select-none">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <span className="text-xs font-medium tracking-wider ml-1 animate-pulse">THINKING</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-zen-text">
            <div className="flex items-center gap-2 font-semibold text-zen-text">
              <AlertTriangle className="h-4 w-4" />
              Interactive UI fallback
            </div>
            <div className="mt-1 text-zen-text/85">
              The model response was not valid OpenUI syntax. Showing plain content instead.
            </div>
          </div>
        )
      )}

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, idx) => (
            <div key={`${error.code}-${idx}`} className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-zen-text">
                <AlertTriangle className="h-4 w-4" />
                {error.component || error.code}
              </div>
              <div className="mt-1 text-zen-text/90">{error.message}</div>
              {error.hint && <div className="mt-2 text-xs text-zen-text/70">{error.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpenUIArtifact;
