import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import { AlertTriangle, ExternalLink, Info, ListChecks, Sparkles } from 'lucide-react';
import { z } from 'zod/v4';
import {
  createLibrary,
  defineComponent,
  reactive,
  FormNameContext,
  FormValidationContext,
  parseStructuredRules,
  useCreateFormValidation,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useRenderNode,
  useStateField,
  useTriggerAction,
  type PromptOptions,
} from '@openuidev/react-lang';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

const MARKDOWN_COMPONENTS = {
  p: ({ children }: any) => <p className="mb-2 leading-7 text-zen-text/90 last:mb-0">{children}</p>,
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-zen-accent hover:underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => <ul className="my-2 pl-5 space-y-1.5 list-disc marker:text-zen-accent">{children}</ul>,
  ol: ({ children }: any) => <ol className="my-2 pl-5 space-y-1.5 list-decimal marker:text-zen-accent">{children}</ol>,
  li: ({ children }: any) => <li>{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-zen-text">{children}</strong>,
  blockquote: ({ children }: any) => (
    <blockquote className="my-3 border-l-2 border-zen-accent/30 pl-4 py-1 text-zen-muted">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-zen-border/50" />,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="rounded-md border border-zen-border/60 bg-zen-surface/70 px-1.5 py-0.5 font-mono text-[0.85em] text-zen-accent">
        {children}
      </code>
    ) : (
      <pre className="my-3 overflow-x-auto rounded-xl border border-zen-border/60 bg-zen-bg/75 p-4 font-mono text-sm text-zen-text/90">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }: any) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-zen-border/50">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-zen-surface/70 text-zen-muted">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-zen-border/30">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-zen-surface/45 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-3 text-left font-semibold text-zen-text">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 align-top text-zen-text/85">{children}</td>,
};

const MarkdownView = ({ text }: { text: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]} components={MARKDOWN_COMPONENTS as any}>
    {text}
  </ReactMarkdown>
);

const FlexPropsSchema = z.object({
  direction: z.enum(['row', 'column']).optional(),
  gap: z.enum(['none', 'xs', 's', 'm', 'l', 'xl', '2xl']).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch', 'baseline']).optional(),
  justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional(),
  wrap: z.boolean().optional(),
});

const gapMap: Record<string, string> = {
  none: '0',
  xs: '0.25rem',
  s: '0.5rem',
  m: '1rem',
  l: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

const alignMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const justifyMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const StackSchema = z.object({
  children: z.array(z.any()),
}).merge(FlexPropsSchema);

const CardSchema = z.object({
  children: z.array(z.any()),
  variant: z.enum(['card', 'sunk', 'clear']).optional(),
  width: z.enum(['standard', 'full']).optional(),
});

const CardHeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

const TextContentSchema = z.object({
  text: z.string(),
  size: z.enum(['small', 'default', 'large', 'small-heavy', 'large-heavy']).optional(),
});

const MarkDownRendererSchema = z.object({
  textMarkdown: z.string(),
  variant: z.enum(['clear', 'card', 'sunk']).optional(),
});

const CalloutSchema = z.object({
  variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
  title: z.string().optional(),
  text: z.string(),
  visible: z.boolean().optional(),
});

const ButtonSchema = z.object({
  label: z.string(),
  action: z.any().optional(),
  variant: z.enum(['primary', 'secondary', 'tertiary']).optional(),
  type: z.enum(['normal', 'destructive']).optional(),
  size: z.enum(['extra-small', 'small', 'medium', 'large']).optional(),
});

const ButtonsSchema = z.object({
  children: z.array(z.any()),
});

const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(['text', 'email', 'password', 'number', 'url']).optional(),
  rules: z.any().optional(),
  value: reactive(z.string().optional()),
});

const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: z.any().optional(),
  value: reactive(z.string().optional()),
});

const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
});

const SelectSchema = z.object({
  name: z.string(),
  items: z.array(z.any()),
  placeholder: z.string().optional(),
  rules: z.any().optional(),
  value: reactive(z.string().optional()),
});

const FormControlSchema = z.object({
  label: z.string(),
  input: z.any(),
  hint: z.string().optional(),
});

const FormSchema = z.object({
  name: z.string(),
  fields: z.array(z.any()),
  buttons: z.any(),
});

const ColSchema = z.object({
  label: z.string(),
  data: z.any(),
  type: z.enum(['string', 'number', 'action']).optional(),
});

const TableSchema = z.object({
  columns: z.array(z.any()),
});

const TabItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(z.any()),
});

const TabsSchema = z.object({
  items: z.array(z.any()),
});

const TagSchema = z.object({
  text: z.string(),
  tone: z.enum(['neutral', 'info', 'success', 'warning', 'danger']).optional(),
});

const TagBlockSchema = z.object({
  tags: z.array(z.string()),
});

const SeparatorSchema = z.object({
  label: z.string().optional(),
});

const ImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const ListItemSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
});

const ListBlockSchema = z.object({
  items: z.array(z.any()),
});

export const Stack = defineComponent({
  name: 'Stack',
  props: StackSchema,
  description: 'Flex container for building layouts.',
  component: ({ props, renderNode }) => {
    const direction = (props.direction as string) ?? 'column';
    const gap = gapMap[(props.gap as string) || 'm'] || gapMap.m;
    const align = alignMap[(props.align as string) || 'stretch'] || alignMap.stretch;
    const justify = justifyMap[(props.justify as string) || 'start'] || justifyMap.start;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: direction as 'row' | 'column',
          gap,
          alignItems: align,
          justifyContent: justify,
          flexWrap: props.wrap ? 'wrap' : undefined,
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

export const Card = defineComponent({
  name: 'Card',
  props: CardSchema,
  description: 'Visual surface for related content.',
  component: ({ props, renderNode }) => {
    const variant = (props.variant as string) || 'card';
    const width = (props.width as string) || 'standard';
    const className = cx(
      'rounded-3xl border p-5 shadow-sm backdrop-blur-sm transition-colors',
      variant === 'sunk' && 'bg-zen-bg/55 border-zen-border/70',
      variant === 'card' && 'bg-zen-surface/85 border-zen-border/65 shadow-[0_20px_48px_-36px_rgba(var(--accent-color-rgb),0.45)]',
      variant === 'clear' && 'border-transparent bg-transparent shadow-none',
      width === 'full' && 'w-full',
      width !== 'full' && 'w-full',
    );

    return <div className={className}>{renderNode(props.children)}</div>;
  },
});

export const CardHeader = defineComponent({
  name: 'CardHeader',
  props: CardHeaderSchema,
  description: 'Heading block for a card or section.',
  component: ({ props }) => (
    <div className="mb-3">
      <div className="text-lg font-semibold tracking-tight text-zen-text">{props.title}</div>
      {props.subtitle ? <div className="mt-1 text-sm leading-6 text-zen-muted/90">{props.subtitle}</div> : null}
    </div>
  ),
});

export const TextContent = defineComponent({
  name: 'TextContent',
  props: TextContentSchema,
  description: 'Markdown-friendly text block.',
  component: ({ props }) => {
    const size = (props.size as string) || 'default';
    const sizeClass =
      size === 'small'
        ? 'text-sm'
        : size === 'large'
          ? 'text-lg'
          : size === 'small-heavy'
            ? 'text-sm font-semibold'
            : size === 'large-heavy'
              ? 'text-lg font-semibold'
              : 'text-base';

    return (
      <div className={cx('leading-7 text-zen-text/90 tracking-[0.01em]', sizeClass)}>
        <MarkdownView text={props.text || ''} />
      </div>
    );
  },
});

export const MarkDownRenderer = defineComponent({
  name: 'MarkDownRenderer',
  props: MarkDownRendererSchema,
  description: 'Markdown renderer with optional framing.',
  component: ({ props }) => {
    const variant = (props.variant as string) || 'clear';
    return (
      <div
        className={cx(
          'rounded-2xl',
          variant === 'card' && 'border border-zen-border/65 bg-zen-surface/80 p-4',
          variant === 'sunk' && 'border border-zen-border/55 bg-zen-bg/60 p-4',
        )}
      >
        <MarkdownView text={props.textMarkdown || ''} />
      </div>
    );
  },
});

export const Callout = defineComponent({
  name: 'Callout',
  props: CalloutSchema,
  description: 'Colored note, alert, or status block.',
  component: ({ props }) => {
    if (props.visible === false) return null;
    const variant = (props.variant as string) || 'info';
    const toneClass =
      variant === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-zen-text'
        : variant === 'warning'
          ? 'bg-amber-500/10 border-amber-500/30 text-zen-text'
          : variant === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-zen-text'
            : 'bg-sky-500/10 border-sky-500/30 text-zen-text';
    const Icon = variant === 'success' ? Sparkles : variant === 'warning' ? AlertTriangle : Info;

    return (
      <div className={cx('flex gap-3 rounded-2xl border p-4', toneClass)}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          {props.title ? <div className="mb-1 font-semibold">{props.title}</div> : null}
          <div className="text-sm leading-6 text-zen-text/90">{props.text}</div>
        </div>
      </div>
    );
  },
});

export const Button = defineComponent({
  name: 'Button',
  props: ButtonSchema,
  description: 'Clickable action button.',
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const isStreaming = useIsStreaming();
    const variant = (props.variant as string) || 'primary';
    const size = (props.size as string) || 'medium';

    const variantClass =
      variant === 'secondary'
        ? 'bg-zen-surface text-zen-text border border-zen-border/70 hover:border-zen-accent/40'
        : variant === 'tertiary'
          ? 'bg-transparent text-zen-text border border-transparent hover:border-zen-border/70 hover:bg-zen-surface/60'
          : 'bg-zen-accent text-white border border-transparent hover:opacity-95';
    const sizeClass =
      size === 'extra-small'
        ? 'px-2 py-1 text-[11px]'
        : size === 'small'
          ? 'px-3 py-1.5 text-xs'
          : size === 'large'
            ? 'px-4 py-3 text-sm'
            : 'px-4 py-2 text-sm';

    const disabledStyle: React.CSSProperties = isStreaming
      ? {
          backgroundColor: 'color-mix(in srgb, var(--border-color) 65%, transparent)',
          borderColor: 'color-mix(in srgb, var(--border-color) 85%, transparent)',
          color: 'var(--muted-color)',
          opacity: 1,
        }
      : {};

    return (
      <button
        type="button"
        disabled={isStreaming}
        onClick={() => triggerAction(props.label, formName, props.action as any)}
        style={disabledStyle}
        className={cx('inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed', variantClass, sizeClass)}
      >
        {props.label}
      </button>
    );
  },
});

export const Buttons = defineComponent({
  name: 'Buttons',
  props: ButtonsSchema,
  description: 'Horizontal button row.',
  component: ({ props, renderNode }) => <div className="flex flex-wrap gap-2">{renderNode(props.children)}</div>,
});

export const Input = defineComponent({
  name: 'Input',
  props: InputSchema,
  description: 'Text input field.',
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const error = formValidation?.getFieldError(field.name);

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <div className="space-y-1">
        <input
          id={field.name}
          name={field.name}
          type={(props.type as string) || 'text'}
          value={field.value ?? ''}
          placeholder={props.placeholder || ''}
          disabled={isStreaming}
          onFocus={() => formValidation?.clearFieldError(field.name)}
          onChange={(e) => {
            field.setValue(e.target.value);
            if (hasRules) formValidation?.clearFieldError(field.name);
          }}
          onBlur={(e) => {
            if (hasRules) formValidation?.validateField(field.name, e.target.value, rules);
          }}
          className="w-full rounded-xl border border-zen-border/60 bg-zen-bg px-3 py-2 text-sm text-zen-text outline-none transition-colors placeholder:text-zen-muted/60 focus:border-zen-accent/60"
        />
        {error ? <div className="text-xs text-red-400">{error}</div> : null}
      </div>
    );
  },
});

export const TextArea = defineComponent({
  name: 'TextArea',
  props: TextAreaSchema,
  description: 'Multiline text input.',
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const error = formValidation?.getFieldError(field.name);

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <div className="space-y-1">
        <textarea
          id={field.name}
          name={field.name}
          rows={(props.rows as number) || 4}
          value={field.value ?? ''}
          placeholder={props.placeholder || ''}
          disabled={isStreaming}
          onFocus={() => formValidation?.clearFieldError(field.name)}
          onChange={(e) => {
            field.setValue(e.target.value);
            if (hasRules) formValidation?.clearFieldError(field.name);
          }}
          onBlur={(e) => {
            if (hasRules) formValidation?.validateField(field.name, e.target.value, rules);
          }}
          className="w-full rounded-xl border border-zen-border/60 bg-zen-bg px-3 py-2 text-sm text-zen-text outline-none transition-colors placeholder:text-zen-muted/60 focus:border-zen-accent/60"
        />
        {error ? <div className="text-xs text-red-400">{error}</div> : null}
      </div>
    );
  },
});

export const SelectItem = defineComponent({
  name: 'SelectItem',
  props: SelectItemSchema,
  description: 'Select option.',
  component: () => null,
});

export const Select = defineComponent({
  name: 'Select',
  props: SelectSchema,
  description: 'Select dropdown.',
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;
    const error = formValidation?.getFieldError(field.name);
    const items = ((props.items as any[]) || []).filter(Boolean).map((item) => item?.props || item);

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <div className="space-y-1">
        <select
          name={field.name}
          value={field.value ?? ''}
          disabled={isStreaming}
          onFocus={() => formValidation?.clearFieldError(field.name)}
          onChange={(e) => {
            field.setValue(e.target.value);
            if (hasRules) formValidation?.validateField(field.name, e.target.value, rules);
          }}
          className="w-full rounded-xl border border-zen-border/60 bg-zen-bg px-3 py-2 text-sm text-zen-text outline-none transition-colors focus:border-zen-accent/60"
        >
          {props.placeholder ? <option value="">{props.placeholder}</option> : null}
          {items.map((item, idx) => (
            <option key={idx} value={item.value}>
              {item.label || item.value}
            </option>
          ))}
        </select>
        {error ? <div className="text-xs text-red-400">{error}</div> : null}
      </div>
    );
  },
});

export const FormControl = defineComponent({
  name: 'FormControl',
  props: FormControlSchema,
  description: 'Labelled form control wrapper.',
  component: ({ props, renderNode }) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-zen-text">{props.label}</div>
      {renderNode(props.input)}
      {props.hint ? <div className="text-xs leading-5 text-zen-muted">{props.hint}</div> : null}
    </div>
  ),
});

export const Form = defineComponent({
  name: 'Form',
  props: FormSchema,
  description: 'Form container with fields and explicit buttons.',
  component: ({ props, renderNode }) => {
    const formValidation = useCreateFormValidation();
    return (
      <FormValidationContext.Provider value={formValidation}>
        <FormNameContext.Provider value={props.name}>
          <div className="space-y-4 rounded-2xl border border-zen-border/65 bg-zen-surface/80 p-4">
            {renderNode(props.fields)}
            {renderNode(props.buttons)}
          </div>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});

export const Col = defineComponent({
  name: 'Col',
  props: ColSchema,
  description: 'Table column definition.',
  component: () => null,
});

export const Table = defineComponent({
  name: 'Table',
  props: TableSchema,
  description: 'Column-oriented data table.',
  component: ({ props, renderNode }) => {
    const columns = ((props.columns as any[]) || []).filter(Boolean).map((col) => col?.props || col);
    if (!columns.length) return null;
    const rowCount = Math.max(...columns.map((col) => (Array.isArray(col.data) ? col.data.length : 0)), 0);

    return (
      <div className="overflow-x-auto rounded-2xl border border-zen-border/65 bg-zen-surface/45">
        <table className="w-full min-w-[560px] table-fixed border-collapse text-sm">
          <thead className="bg-zen-surface/85 text-zen-muted">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-left font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zen-border/30">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-zen-surface/55 transition-colors">
                {columns.map((col, colIndex) => {
                  const cell = Array.isArray(col.data) ? col.data[rowIndex] : '';
                  return (
                    <td key={colIndex} className="px-4 py-3 align-top text-zen-text/85">
                      {cell && typeof cell === 'object' ? renderNode(cell) : String(cell ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

export const TabItem = defineComponent({
  name: 'TabItem',
  props: TabItemSchema,
  description: 'Single tab item.',
  component: () => null,
});

export const Tabs = defineComponent({
  name: 'Tabs',
  props: TabsSchema,
  description: 'Tabbed content switcher.',
  component: ({ props, renderNode }) => {
    const items = ((props.items as any[]) || []).filter(Boolean).map((item) => item?.props || item);
    const [active, setActive] = React.useState(items[0]?.value || '');

    React.useEffect(() => {
      if (!items.length) return;
      if (!active || !items.find((item) => item.value === active)) {
        setActive(items[0].value);
      }
    }, [items, active]);

    if (!items.length) return null;

    const current = items.find((item) => item.value === active) || items[0];

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-zen-border/65 bg-zen-surface/80 p-2">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActive(item.value)}
              style={item.value === active ? { color: 'var(--bg-color)' } : undefined}
              className={cx(
                'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                item.value === active
                  ? 'bg-zen-text'
                  : 'bg-transparent text-zen-muted hover:bg-zen-bg/70 hover:text-zen-text',
              )}
            >
              {item.trigger}
            </button>
          ))}
        </div>
        <div>{renderNode(current.content)}</div>
      </div>
    );
  },
});

export const Tag = defineComponent({
  name: 'Tag',
  props: TagSchema,
  description: 'Small status pill.',
  component: ({ props }) => {
    const tone = (props.tone as string) || 'neutral';
    const toneClass =
      tone === 'success'
        ? 'bg-emerald-500/15 text-zen-text border-emerald-500/30'
        : tone === 'warning'
          ? 'bg-amber-500/15 text-zen-text border-amber-500/30'
          : tone === 'danger'
            ? 'bg-red-500/15 text-zen-text border-red-500/30'
            : tone === 'info'
              ? 'bg-sky-500/15 text-zen-text border-sky-500/30'
              : 'bg-zen-border/20 text-zen-text border-zen-border/40';

    return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>{props.text}</span>;
  },
});

export const TagBlock = defineComponent({
  name: 'TagBlock',
  props: TagBlockSchema,
  description: 'Group of tags.',
  component: ({ props }) => (
    <div className="flex flex-wrap gap-2">
      {(props.tags || []).map((tag, idx) => (
        <Tag.component key={idx} props={{ text: tag, tone: 'neutral' } as any} renderNode={() => null} />
      ))}
    </div>
  ),
});

export const Separator = defineComponent({
  name: 'Separator',
  props: SeparatorSchema,
  description: 'Horizontal separator.',
  component: ({ props }) => (
    <div className="my-2">
      <hr className="border-zen-border/50" />
      {props.label ? <div className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-zen-muted">{props.label}</div> : null}
    </div>
  ),
});

export const Image = defineComponent({
  name: 'Image',
  props: ImageSchema,
  description: 'Responsive image with optional caption.',
  component: ({ props }) => (
    <figure className="overflow-hidden rounded-2xl border border-zen-border/60 bg-zen-bg/40">
      <img src={props.src} alt={props.alt || ''} className="block w-full object-cover" />
      {props.caption ? <figcaption className="px-3 py-2 text-xs text-zen-muted">{props.caption}</figcaption> : null}
    </figure>
  ),
});

export const ImageBlock = defineComponent({
  name: 'ImageBlock',
  props: ImageSchema,
  description: 'Image block.',
  component: ({ props }) => <Image.component props={props as any} renderNode={() => null} />,
});

export const ListItem = defineComponent({
  name: 'ListItem',
  props: ListItemSchema,
  description: 'Selectable list item.',
  component: () => null,
});

export const ListBlock = defineComponent({
  name: 'ListBlock',
  props: ListBlockSchema,
  description: 'Interactive list of selectable items.',
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const items = ((props.items as any[]) || []).filter(Boolean).map((item) => item?.props || item);

    return (
      <div className="space-y-2">
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => triggerAction(item.label, formName)}
            className="flex w-full flex-col items-start gap-1 rounded-2xl border border-zen-border/60 bg-zen-surface/80 p-4 text-left transition-colors hover:border-zen-accent/40 hover:bg-zen-bg/70"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zen-text">
              <ListChecks className="h-4 w-4 text-zen-accent" />
              {item.label}
            </div>
            {item.description ? <div className="text-sm leading-6 text-zen-muted">{item.description}</div> : null}
          </button>
        ))}
      </div>
    );
  },
});

const openuiComponentGroups = [
  {
    name: 'Layout',
    components: ['Stack', 'Card', 'Tabs', 'TabItem', 'Separator'],
  },
  {
    name: 'Content',
    components: ['CardHeader', 'TextContent', 'MarkDownRenderer', 'Callout', 'Image', 'ImageBlock'],
  },
  {
    name: 'Forms',
    components: ['Form', 'FormControl', 'Input', 'TextArea', 'Select', 'SelectItem'],
  },
  {
    name: 'Actions',
    components: ['Button', 'Buttons', 'ListBlock', 'ListItem'],
  },
  {
    name: 'Data',
    components: ['Table', 'Col', 'Tag', 'TagBlock'],
  },
];

const openuiExamples: string[] = [
  `root = Stack([header, stats, tabs], "column", "l")
header = Card([CardHeader("Usage Overview", "Interactive snapshot"), TextContent("A compact command center with controls, analytics, and follow-up actions.")])
stats = Stack([kpi1, kpi2, kpi3], "row", "m", "stretch", "start", true)
kpi1 = Card([TextContent("Revenue", "small"), TextContent("$128k", "large-heavy")])
kpi2 = Card([TextContent("Users", "small"), TextContent("42,108", "large-heavy")])
kpi3 = Card([TextContent("Errors", "small"), TextContent("1.2%", "large-heavy")])
tabs = Tabs([tab1, tab2])
tab1 = TabItem("summary", "Summary", [Callout("info", "Live data", "This panel can summarize a project, a website, or a plan.")])
tab2 = TabItem("details", "Details", [TagBlock(["Fast", "Interactive", "Model-driven"])])`,
  `root = Stack([title, formCard], "column", "l")
title = TextContent("Build a simple contact form", "large-heavy")
formCard = Card([Form("contact", btns, [nameField, emailField, messageField])])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
messageField = FormControl("Message", TextArea("message", "Tell us what you need...", 5, { required: true, minLength: 10 }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit form")]), "primary"), Button("Reset", Action([@Reset($name, $email, $message)]), "secondary")])`,
  `root = Stack([header, tableCard], "column", "l")
header = Card([CardHeader("Feature Comparison", "Compare options at a glance"), TextContent("Use tags and tables for concise decision-making.")])
tableCard = Card([Table([Col("Plan", plans), Col("Price", prices), Col("Best for", bestFor)])])
plans = ["Starter", "Pro", "Team"]
prices = ["$0", "$29", "$79"]
bestFor = ["Hobby", "Solo work", "Small teams"]`,
];

const openuiAdditionalRules = [
  '# CRITICAL OPENUI SYNTAX RULES - FOLLOW EXACTLY',
  '1. USE ONLY CATALOG COMPONENTS: never invent component names.',
  '2. ROOT FIRST: first line must be `root = ...`.',
  '3. ARRAYS FOR CHILDREN: container children must be in one array. Use `Stack([a, b])`, not `Stack(a, b)`.',
  '4. FORM SIGNATURE: `Form("name", buttons, [fields])`.',
  '5. ACTION BUILTINS: use `Action([@ToAssistant("...")])`, `Action([@OpenUrl("https://...")])`, `Action([@Set($var, value)])`, `Action([@Reset($a, $b)])`.',
  '6. STRINGS: always use double quotes. Avoid markdown code fences and conversational text.',
  '7. TABLE DATA: each `Col(label, data)` must have same row count when possible.',
  '8. VISUAL QUALITY: compose 2-4 cards with clear hierarchy, use CardHeader, and avoid single giant text blobs.',
  '9. DO NOT USE: `$binding<...>`, `.toString()`, `@Range`, `@Slice`, `@Map`, `@Filter`, `@Each`, ternary chains, or JavaScript function syntax.',
  '10. Prefer static arrays and simple values over computed expressions when unsure.',
  '11. NEVER call JavaScript constructors/functions like `Number(...)`, `String(...)`, `Boolean(...)`, `parseInt(...)`, or `Math.*`.',
  '12. Keep every statement in `name = Expression` form. No free text lines, no explanations, no markdown paragraphs.',
  '',
  '# EXAMPLES OF CORRECT USAGE',
  '- `Stack([ TextContent("Wait"), Card([ TextContent("Inside") ]) ], "column", "m", "center", "center")`',
  '- `Form("math", Buttons([Button("Save", Action([@ToAssistant("Save")]), "primary")]), [FormControl("Age", Input("age", "18", "number", {required: true}))])`',
  '- `btn = Button("Open docs", Action([@OpenUrl("https://openui.com")]), "secondary")`',
  'Prefer polished structure over heavy inline HTML styling.',
];

const openuiPromptOptions: PromptOptions = {
  preamble:
    "You are Saturn's OpenUI app generator. Generate an interactive app using raw OpenUI Lang ONLY. DO NOT OUTPUT ANYTHING ELSE. IMPORTANT: Start your output IMMEDIATELY with `root = ...`, do NOT wrap it in ```markdown or provide ANY conversational filler. This ensures maximum streaming speed.",
  examples: openuiExamples,
  additionalRules: openuiAdditionalRules,
  bindings: false,
  inlineMode: false,
  toolCalls: false,
};

export const saturnOpenUiLibrary = createLibrary({
  root: 'Stack',
  componentGroups: openuiComponentGroups,
  components: [
    Stack,
    Card,
    CardHeader,
    TextContent,
    MarkDownRenderer,
    Callout,
    Button,
    Buttons,
    Input,
    TextArea,
    SelectItem,
    Select,
    FormControl,
    Form,
    Col,
    Table,
    TabItem,
    Tabs,
    Tag,
    TagBlock,
    Separator,
    Image,
    ImageBlock,
    ListItem,
    ListBlock,
  ],
});

export const SATURN_OPENUI_SYSTEM_INSTRUCTION = saturnOpenUiLibrary.prompt(openuiPromptOptions);

export const composeSaturnOpenUiInstructions = (customInstructions?: string) =>
  [customInstructions?.trim(), SATURN_OPENUI_SYSTEM_INSTRUCTION].filter(Boolean).join('\n\n');
