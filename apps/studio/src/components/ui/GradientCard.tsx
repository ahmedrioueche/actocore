import React from "react";

export function GradientBackground({ header = false }: { header?: boolean }) {
  return (
    <>
      {header && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      )}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-20 -mt-20 opacity-50" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full -ml-20 -mb-20 opacity-30" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </>
  );
}

interface GradientCardProps {
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  header?: boolean;
}

export default function GradientCard({
  children,
  className = "",
  contentClassName = "",
  header = false,
}: GradientCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm ${className}`}
    >
      <GradientBackground header={header} />
      <div className={`relative p-6 md:p-8 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
