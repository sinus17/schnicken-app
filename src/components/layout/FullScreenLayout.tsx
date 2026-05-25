import { useState } from 'react';
import type { ReactNode } from 'react';
import { Logo } from '../common/Logo';
import { Sidebar } from '../Sidebar';

interface FullScreenLayoutProps {
  children: ReactNode;
  headline?: ReactNode | string;
  description?: string;
  backgroundColor?: string;
  hideLogo?: boolean;
  onBack?: () => void;
}

export function FullScreenLayout({
  children,
  headline,
  description,
  backgroundColor = 'bg-schnicken-darkest',
  hideLogo = false,
  onBack,
}: FullScreenLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={`${backgroundColor} min-h-screen flex flex-col items-center px-2 pt-6 pb-4 relative overflow-hidden`}>
      {/* Back button or Hamburger Menu Button */}
      {onBack ? (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-50 p-2 flex items-center text-white"
          aria-label="Zurück"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-50 p-2"
          aria-label="Menu"
        >
          <div className="w-6 h-0.5 bg-white mb-1.5"></div>
          <div className="w-6 h-0.5 bg-white mb-1.5"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="w-full max-w-lg flex flex-col items-center mb-4">
        {!hideLogo && <Logo />}
        
        {headline && (
          <h1 className="text-2xl font-bold text-white mt-8 mb-1 text-center">
            {headline}
          </h1>
        )}
        
        {description && (
          <p className="text-schnicken-light text-sm mb-8 text-center">
            {description}
          </p>
        )}
      </div>
      
      {children}
    </div>
  );
}
