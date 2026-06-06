import type { ReactNode } from "react";

interface AuthFormFooterProps {
  children: ReactNode;
}

export function AuthFormFooter({ children }: AuthFormFooterProps) {
  return (
    <footer className="border-t border-border pt-4 text-center">
      {children}
    </footer>
  );
}
