import React from 'react';
import { cn } from '@/utils/helper';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, className }) => {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl p-6 shadow-md border border-border hover:shadow-brand hover:border-primary/30 transition-all duration-300',
        className
      )}
    >
      <div className='flex items-center justify-center mb-4'>{icon}</div>
      <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary text-center leading-5">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
