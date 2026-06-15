type CodeBlockProps = {
  code: string;
  label?: string;
};

export function CodeBlock({ code, label }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
      {label ? (
        <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-text-primary">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
