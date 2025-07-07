import React from 'react';
import type { ReactNode } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  children,
  secondary = false,
  className = '',
  type = 'button',
  disabled = false
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-8 py-4 rounded-full font-medium text-lg transition-all duration-300
        flex items-center justify-center
        ${secondary 
          ? 'bg-transparent text-schnicken-light border-2 border-schnicken-light hover:bg-schnicken-dark/80' 
          : 'bg-schnicken-medium text-white hover:bg-schnicken-medium/90 shadow-lg hover:shadow-xl'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
