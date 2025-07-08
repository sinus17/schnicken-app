import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-32',
    medium: 'w-48',
    large: 'w-64'
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <img 
        src="/schnicken.png" 
        alt="Schnicken Logo" 
        className={`${sizeClasses[size]} h-auto`}
      />
    </div>
  );
};
