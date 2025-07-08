import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabaseAdmin } from '../lib/supabaseClient';
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
    // Load players and current player in a single operation to reduce API calls
    const loadPlayersData = async () => {
      try {
        setIsLoading(true);
        const savedPlayerId = localStorage.getItem('currentPlayerId');
        const cachedPlayers = localStorage.getItem('cachedPlayers');
        const lastFetchTime = localStorage.getItem('playersLastFetched');
        
        // Use cached players data if it's recent (less than 5 minutes old)
        if (cachedPlayers && lastFetchTime && (Date.now() - parseInt(lastFetchTime, 10) < 5 * 60 * 1000)) {
          try {
            const parsedPlayers = JSON.parse(cachedPlayers);
            setAllPlayers(parsedPlayers);
            console.log('Using cached players data');
            
            // If we have a saved player ID, find it in the cached players
            if (savedPlayerId) {
              const foundPlayer = parsedPlayers.find((p: Spieler) => p.id === savedPlayerId);
              if (foundPlayer) {
                setCurrentPlayer(foundPlayer);
                console.log('Found current player in cache:', foundPlayer.name);
                setIsLoading(false);
                return; // Exit early if we found everything in cache
              }
            }
          } catch (e) {
            console.error('Error parsing cached players:', e);
            localStorage.removeItem('cachedPlayers');
          }
        }
        
        // If we don't have valid cache or current player wasn't in cache, fetch from API
        await refreshPlayers();
        
        // If we have a saved player ID, find or fetch the current player
        if (savedPlayerId) {
          // First try to find it in the freshly loaded players
          const foundInLoaded = allPlayers.find(p => p.id === savedPlayerId);
          
          if (foundInLoaded) {
            setCurrentPlayer(foundInLoaded);
          } else {
            // If not found in the loaded players, fetch it directly
            const { data, error } = await supabaseAdmin
              .from('spieler')
              .select('*')
              .eq('id', savedPlayerId)
              .maybeSingle();
              
            if (!error && data) {
              setCurrentPlayer(data);
            } else {
              console.log('Player not found or error:', error);
              localStorage.removeItem('currentPlayerId');
            }
          }
        }
      } catch (err) {
        console.error('Error loading player data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlayersData();
  }, []);

  // Use shared admin client for data operations

  const refreshPlayers = async () => {
    // Check if we have a cache timestamp to avoid repeated calls
    const requestTimestamp = Date.now();
    const lastRefreshAttempt = localStorage.getItem('lastPlayerRefreshAttempt');
    
    // Prevent multiple refresh calls within 2 seconds (debounce)
    if (lastRefreshAttempt && (requestTimestamp - parseInt(lastRefreshAttempt, 10) < 2000)) {
      console.log('Skipping duplicate player refresh, too soon after last attempt');
      return;
    }
    
    // Update timestamp immediately to prevent duplicate calls
    localStorage.setItem('lastPlayerRefreshAttempt', requestTimestamp.toString());
    setIsLoading(true);
    
    try {
      // Use the singleton Supabase client to prevent creating new instances
      const tempClient = supabaseAdmin;
      
      // Create the query - keep it simple to improve performance
      const { data, error } = await tempClient.from('spieler').select('*').order('name');

      if (!error && data) {
        // Update state with fresh data
        setAllPlayers(data);
        
        // Cache the data in localStorage to speed up future loads
        localStorage.setItem('cachedPlayers', JSON.stringify(data));
        localStorage.setItem('playersLastFetched', Date.now().toString());
        
        console.log('Players loaded successfully:', data.length);
      } else {
        console.error('Error loading players:', error);
      }
    } catch (err) {
      console.error('Error refreshing players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlayer = async (name: string): Promise<Spieler | null> => {
    if (!name.trim()) return null;

    try {
      // Use real client for data operations to avoid localhost issues
      const tempClient = supabaseAdmin;
      
      const { data, error } = await tempClient
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
    } catch (err) {
      console.error('Unexpected error in createPlayer:', err);
      return null;
    }
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

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
