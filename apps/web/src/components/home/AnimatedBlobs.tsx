'use client';

import { useEffect } from 'react';

import { cn } from '@/lib/utils';

type AnimatedBlobsProps = {
  className?: string;
};

export function AnimatedBlobs({ className }: AnimatedBlobsProps) {
  useEffect(() => {
    const blobs = document.querySelectorAll<HTMLElement>('[data-animated-blob]');

    const onMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 40;
      const y = (event.clientY / window.innerHeight - 0.5) * 40;

      blobs.forEach((blob, index) => {
        const factor = (index + 1) * 0.5;
        blob.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        data-animated-blob
        className="animated-blob absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20"
      />
      <div
        data-animated-blob
        className="animated-blob absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/10"
        style={{ animationDelay: '-5s' }}
      />
    </div>
  );
}
