import React from 'react';
import { handleLogout } from '@/utils/auth';

interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'button' | 'link' | 'icon';
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  children = 'Logout',
  className = '',
  variant = 'button',
  onLogout,
}) => {
  const handleClick = async () => {
    try {
      // Call optional callback if provided
      if (onLogout) {
        onLogout();
      }

      // Perform logout
      await handleLogout('/auth/login');
    } catch (error) {
      console.error('Logout button error:', error);
    }
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className={`text-red-600 hover:text-red-800 underline ${className}`}
        type='button'
      >
        {children}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ${className}`}
        type='button'
        aria-label='Logout'
      >
        {children}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors ${className}`}
      type='button'
    >
      {children}
    </button>
  );
};

export default LogoutButton;
