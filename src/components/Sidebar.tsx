import React from 'react';
import { useAppState } from '../contexts/AppStateContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { navigateTo } = useAppState();

  const handleNavigation = (view: 'menu' | 'schnicks' | 'leaderboard') => {
    navigateTo(view);
    onClose();
  };

  // Close sidebar when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={handleBackdropClick}
        >
          <div
            className={`fixed top-0 left-0 bottom-0 w-64 bg-schnicken-dark z-50 transform transition-transform duration-300 ease-in-out shadow-lg ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4">
                <div className="flex items-center justify-end">
                  <button
                    onClick={onClose}
                    className="text-schnicken-light hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <ul className="p-4 space-y-2">
              <li>
                <button
                  onClick={() => handleNavigation('menu')}
                  className="w-full text-left py-3 px-4 rounded-lg hover:bg-schnicken-primary/20 text-schnicken-light hover:text-white transition-colors"
                >
                  Hauptmenü
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('schnicks')}
                  className="w-full text-left py-3 px-4 rounded-lg hover:bg-schnicken-primary/20 text-schnicken-light hover:text-white transition-colors"
                >
                  Alle Schnicks
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('leaderboard')}
                  className="w-full text-left py-3 px-4 rounded-lg hover:bg-schnicken-primary/20 text-schnicken-light hover:text-white transition-colors"
                >
                  Leaderboard
                </button>
              </li>

              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
