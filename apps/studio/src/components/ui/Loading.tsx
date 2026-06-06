interface LoadingProps {
  className?: string;
  size?: string;
  /** When true, fills the viewport (rare — prefer LoadingScreen or LoadingPage). */
  fullScreen?: boolean;
}

/** Inline spinner for cards, forms, and sections. */
export default function Loading({
  className = 'py-12',
  size = 'h-10 w-10',
  fullScreen = false,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${
        fullScreen ? 'min-h-screen' : 'w-full'
      } flex justify-center items-center ${className}`}
    >
      <div
        className={`animate-spin rounded-full ${size} border-2 border-border border-t-primary`}
      />
    </div>
  );
}
