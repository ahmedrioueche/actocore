import React from 'react';
import { cn } from '@/utils/helper';

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

const PageIndicator: React.FC<PageIndicatorProps> = ({ currentPage, totalPages, className }) => {
  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      {Array.from({ length: totalPages }, (_, index) => (
        <div
          key={index}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            index === currentPage ? 'w-8 bg-primary' : 'w-2 bg-border'
          )}
        />
      ))}
    </div>
  );
};

export default PageIndicator;
