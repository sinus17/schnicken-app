import React, { createContext, useState, useContext, type ReactNode } from 'react';

// Definieren der möglichen Ansichten in der App
export type AppView = 
  | 'player-select'  // Spielerauswahl
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
  // Prüfe beim Initialisieren, ob ein Spieler im localStorage gespeichert ist
  const initialView: AppView = localStorage.getItem('currentPlayerId') ? 'menu' : 'player-select';
  const [currentView, setCurrentView] = useState<AppView>(initialView);

  const navigateTo = (view: AppView) => {
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

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
