import React from 'react';
import type { ReactNode } from 'react';

interface ButtonCardProps {
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const ButtonCard: React.FC<ButtonCardProps> = ({
  children,
  onClick,
  selected = false,
  icon,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 my-2 rounded-lg transition-all duration-300
        flex items-center justify-center
        ${selected 
          ? 'bg-schnicken-medium text-white shadow-lg transform scale-105' 
          : 'bg-schnicken-dark text-schnicken-light hover:bg-schnicken-dark/80 hover:shadow-md'}
        ${className}
      `}
    >
      {icon && <div className="mr-4 text-2xl">{icon}</div>}
      <div className="flex-1">{children}</div>
      {selected && (
        <div className="ml-2 text-xl">✓</div>
      )}
    </button>
  );
};
