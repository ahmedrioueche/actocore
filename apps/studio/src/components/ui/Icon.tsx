import React from 'react';
import { cn } from '@/utils/helper';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className }) => {
  const iconMap: Record<string, string> = {
    // Gym related icons
    gym: '🏋️',
    members: '👥',
    coach: '🏃‍♂️',
    payment: '💳',
    analytics: '📊',
    owner: '👑',
    client: '👤',
    welcome: '👋',
    rocket: '🚀',
    check: '✅',
    star: '⭐',
    heart: '❤️',
    fire: '🔥',
    trophy: '🏆',
    target: '🎯',
    shield: '🛡️',
    gear: '⚙️',
    bell: '🔔',
    chart: '📈',
    calendar: '📅',
    clock: '⏰',
    location: '📍',
    phone: '📞',
    email: '📧',
    lock: '🔒',
    unlock: '🔓',
    plus: '➕',
    minus: '➖',
    edit: '✏️',
    delete: '🗑️',
    search: '🔍',
    filter: '🔽',
    sort: '🔼',
    'arrow-right': '➡️',
    'arrow-left': '⬅️',
    'arrow-up': '⬆️',
    'arrow-down': '⬇️',
    close: '❌',
    'check-circle': '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  const icon = iconMap[name] || '❓';

  return (
    <span className={cn('inline-block', className)} style={{ fontSize: size }}>
      {icon}
    </span>
  );
};

export default Icon;
