import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// Definieren der möglichen Ansichten in der App
export type AppView = 
  | 'menu'           // Hauptmenü
  | 'create-game'    // Spiel erstellen
  | 'game'           // Aktives Spiel
  | 'history'        // Spielhistorie
  | 'schnicks'       // Alle Schnicks Übersicht
  | 'leaderboard';   // Rangliste/Leaderboard

// Mapping zwischen URL-Pfad und View
const VIEW_TO_PATH: Record<AppView, string> = {
  menu: '/',
  'create-game': '/create-game',
  game: '/game',
  history: '/history',
  schnicks: '/alle-schnicks',
  leaderboard: '/leaderboard',
};

const PATH_TO_VIEW: Record<string, AppView> = {
  '/': 'menu',
  '/menu': 'menu',
  '/create-game': 'create-game',
  '/game': 'game',
  '/history': 'history',
  '/alle-schnicks': 'schnicks',
  '/schnicks': 'schnicks',
  '/leaderboard': 'leaderboard',
};

const viewFromPath = (pathname: string): AppView => {
  return PATH_TO_VIEW[pathname] ?? 'menu';
};

interface AppStateContextType {
  currentView: AppView;
  navigateTo: (view: AppView) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initiale View aus der URL ableiten, damit Deep-Links wie /alle-schnicks funktionieren
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      return viewFromPath(window.location.pathname);
    }
    return 'menu';
  });

  // Browser-Back/Forward unterstützen
  useEffect(() => {
    const onPopState = () => {
      setCurrentView(viewFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (view: AppView) => {
    console.log('navigateTo called with view:', view, 'current view:', currentView);
    const targetPath = VIEW_TO_PATH[view] ?? '/';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
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
