interface AuthFormHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'center' | 'start';
}

export function AuthFormHeader({
  title,
  subtitle,
  className = 'mb-5',
  align = 'center',
}: AuthFormHeaderProps) {
  return (
    <header
      className={`${align === 'center' ? 'text-center' : 'text-start'} ${className}`}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[1.625rem] md:leading-tight">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-text-secondary md:text-base">{subtitle}</p>
      ) : null}
    </header>
  );
}
