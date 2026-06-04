import React from 'react';
import { cn } from '@/utils/helper';

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon,
  title,
  description,
  isSelected,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-6 border-2 cursor-pointer transition-all duration-200 hover:scale-105',
        isSelected
          ? 'border-primary bg-primary-muted shadow-brand'
          : 'border-border bg-surface hover:border-primary/50 hover:bg-surface-hover',
        className
      )}
    >
      <div className='flex flex-col items-center text-center'>
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-4',
            isSelected ? 'bg-primary-muted' : 'bg-surface-secondary'
          )}
        >
          {icon}
        </div>
        <h3
          className={cn(
            'text-lg font-semibold mb-2',
            isSelected ? 'text-primary' : 'text-text-primary'
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'text-sm leading-5',
            isSelected ? 'text-primary/80' : 'text-text-secondary'
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

export default RoleCard;
