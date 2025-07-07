import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Spieler } from '../lib/supabase';

interface PlayerContextType {
  currentPlayer: Spieler | null;
  allPlayers: Spieler[];
  isLoading: boolean;
  createPlayer: (name: string) => Promise<Spieler | null>;
  selectPlayer: (player: Spieler) => void;
  clearCurrentPlayer: () => void;
  refreshPlayers: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlayer, setCurrentPlayer] = useState<Spieler | null>(null);
  const [allPlayers, setAllPlayers] = useState<Spieler[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Beim ersten Laden die Spieler abrufen
    refreshPlayers();

    // Prüfen, ob ein gespeicherter Spieler existiert
    const savedPlayerId = localStorage.getItem('currentPlayerId');
    if (savedPlayerId) {
      supabase
        .from('spieler')
        .select('*')
        .eq('id', savedPlayerId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentPlayer(data);
          } else {
            localStorage.removeItem('currentPlayerId');
          }
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshPlayers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('spieler')
      .select('*')
      .order('name');

    if (!error && data) {
      setAllPlayers(data);
      console.log('Spieler erfolgreich geladen:', data);
    } else {
      console.error('Fehler beim Laden der Spieler:', error);
    }
    setIsLoading(false);
  };

  const createPlayer = async (name: string): Promise<Spieler | null> => {
    if (!name.trim()) return null;

    const { data, error } = await supabase
      .from('spieler')
      .insert([{ name, avatar_url: null }])
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen des Spielers:', error);
      return null;
    }

    await refreshPlayers();
    return data;
  };

  const selectPlayer = (player: Spieler) => {
    setCurrentPlayer(player);
    localStorage.setItem('currentPlayerId', player.id);
  };

  const clearCurrentPlayer = () => {
    setCurrentPlayer(null);
    localStorage.removeItem('currentPlayerId');
  };

  return (
    <PlayerContext.Provider
      value={{
        currentPlayer,
        allPlayers,
        isLoading,
        createPlayer,
        selectPlayer,
        clearCurrentPlayer,
        refreshPlayers
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
