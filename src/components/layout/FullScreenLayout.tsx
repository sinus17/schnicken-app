import React from 'react';
import type { ReactNode } from 'react';

interface FullScreenLayoutProps {
  children: ReactNode;
  headline?: ReactNode | string;
  description?: string;
  backgroundColor?: string;
}

export const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
  children,
  headline,
  description,
  backgroundColor = 'bg-indigo-900'
}) => {
  return (
    <div className={`${backgroundColor} text-white min-h-screen flex flex-col justify-center relative`}>
      <div className="px-4 flex flex-col items-center">
        {headline && (
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
            {headline}
          </h1>
        )}
        
        {description && (
          <p className="text-lg md:text-xl mb-6 text-center text-schnicken-light/80">
            {description}
          </p>
        )}
        
        {children}
      </div>
    </div>
  );
};
