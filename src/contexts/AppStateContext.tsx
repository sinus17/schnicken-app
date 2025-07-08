import React, { createContext, useState, useContext, type ReactNode } from 'react';

// Definieren der möglichen Ansichten in der App
export type AppView = 
  | 'menu'           // Hauptmenü
  | 'create-game'    // Spiel erstellen
  | 'game'           // Aktives Spiel
  | 'history'        // Spielhistorie
  | 'schnicks';      // Alle Schnicks Übersicht

interface AppStateContextType {
  currentView: AppView;
  navigateTo: (view: AppView) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always initialize to menu view since we're eliminating player-select
  const [currentView, setCurrentView] = useState<AppView>('menu');

  const navigateTo = (view: AppView) => {
    console.log('navigateTo called with view:', view, 'current view:', currentView);
    
    console.log('Setting current view to:', view);
    setCurrentView(view);
  };

  return (
    <AppStateContext.Provider
      value={{
        currentView,
        navigateTo
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
