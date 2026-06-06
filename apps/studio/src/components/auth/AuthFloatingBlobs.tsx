import { useEffect, useRef } from 'react';

export function AuthFloatingBlobs() {
  const blobA = useRef<HTMLDivElement>(null);
  const blobB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      if (blobA.current) {
        blobA.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      }
      if (blobB.current) {
        blobB.current.style.transform = `translate(${-x * 30}px, ${-y * 30}px)`;
      }
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div
        ref={blobA}
        className="auth-floating-blob -top-20 -left-20 animate-soft-pulse opacity-50"
        aria-hidden
      />
      <div
        ref={blobB}
        className="auth-floating-blob -bottom-20 -right-20 animate-soft-pulse opacity-30"
        style={{ animationDelay: '2s' }}
        aria-hidden
      />
    </>
  );
}
