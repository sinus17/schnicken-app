import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import type { GameWithPlayers } from '../contexts/GameContext';
import type { SchnickZahl } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { DebugTools } from './DebugTools';

// Define types for debugging info
interface DebugInfoType {
  dbSchnicks: number;
  dbPlayerLinks: number;
  dbPlayers: number;
  dbNumbers: number;
  activeGames?: number;
  currentPlayerName?: string;
}

interface SchnickHistoryProps {
  onGameSelect: (game: GameWithPlayers) => void;
}

export const SchnickHistory: React.FC<SchnickHistoryProps> = ({ onGameSelect }) => {
  const { currentPlayer } = usePlayer();
  const { activeGames, finishedGames } = useGame();
  
  // Debug logging for context values
  useEffect(() => {
    console.log('SchnickHistory - activeGames updated:', activeGames?.length, activeGames);
  }, [activeGames]);
  
  useEffect(() => {
    console.log('SchnickHistory - finishedGames updated:', finishedGames?.length, finishedGames);
  }, [finishedGames]);
  const [allSchnicks, setAllSchnicks] = useState<GameWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfoType>({
    dbSchnicks: 0,
    dbPlayerLinks: 0,
    dbPlayers: 0,
    dbNumbers: 0
  });
  
  // Define the loadViaDirectQueries function at the component level so it can be reused
  const loadViaDirectQueries = useCallback(async () => {
    console.log('Loading all schnicks via direct queries...');
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get all schnicks
      const { data: schnicks, error: schnickError } = await supabase
        .from('schnicks')
        .select('*')
        .order('created_at', { ascending: false });

      if (schnickError) throw schnickError;
      console.log('Found schnicks:', schnicks?.length);

      // Step 2: Get all player links for these schnicks
      let allPlayerLinks = [];
      let allPlayers = [];
      let allNumbers = [];
      
      if (schnicks && schnicks.length > 0) {
        const schnickIds = schnicks.map(s => s.id);
        
        const { data: playerLinks, error: linksError } = await supabase
          .from('spieler_schnicks')
          .select('*')
          .in('schnick_id', schnickIds);
          
        if (linksError) throw linksError;
        allPlayerLinks = playerLinks || [];
        console.log('Found player links:', allPlayerLinks?.length);
        
        // Step 3: Get all players
        const playerIds = [...new Set(allPlayerLinks.map(link => link.spieler_id))];
        
        if (playerIds.length > 0) {
          const { data: players, error: playersError } = await supabase
            .from('spieler')
            .select('*')
            .in('id', playerIds);
            
          if (playersError) throw playersError;
          allPlayers = players || [];
          console.log('Found players:', allPlayers?.length);
        }
        
        // Step 4: Get all numbers
        const { data: numbers, error: numbersError } = await supabase
          .from('schnick_zahlen')
          .select('*')
          .in('schnick_id', schnickIds);
          
        if (numbersError) throw numbersError;
        allNumbers = numbers || [];
        console.log('Found numbers:', allNumbers?.length);
      }
      
      // Step 5: Build game objects with players
      const gamesWithPlayers = schnicks.map(schnick => {
        // Find player links for this schnick
        const relevantLinks = allPlayerLinks.filter(link => link.schnick_id === schnick.id);
        
        // Explicitly log every schnick and its linked players for debugging
        console.log(`Schnick ${schnick.id} (${schnick.aufgabe}) has ${relevantLinks.length} player links`);
        
        // Get player objects
        const players = relevantLinks
          .map(link => {
            const player = allPlayers.find(p => p.id === link.spieler_id);
            if (player) {
              console.log(`  - Player ${player.id} (${player.name}) linked`);
              return player;
            } else {
              console.warn(`  - Could not find player with ID ${link.spieler_id}`);
              return null;
            }
          })
          .filter(Boolean);
        
        // Get numbers for this game
        const gameNumbers = allNumbers.filter(n => n.schnick_id === schnick.id);
        console.log(`  - Found ${gameNumbers.length} numbers for this schnick`);
        
        // Create proper GameWithPlayers object
        const gameWithPlayers = {
          ...schnick,
          schnicker: players[0] || { id: 'unknown', name: 'Unknown Player' },
          angeschnickter: players[1] || { id: 'unknown', name: 'Unknown Player' },
          numbers: gameNumbers
        };
        
        console.log(`Built game object: ${gameWithPlayers.id} with players ${gameWithPlayers.schnicker.name} and ${gameWithPlayers.angeschnickter.name}`);
        return gameWithPlayers;
      });
      
      console.log('Built games with players:', gamesWithPlayers?.length);
      console.log('Sample game:', gamesWithPlayers[0]);
      
      setDebugInfo((prev: DebugInfoType) => ({
        ...prev,
        dbSchnicks: schnicks?.length || 0,
        dbPlayerLinks: allPlayerLinks?.length || 0,
        dbPlayers: allPlayers?.length || 0,
        dbNumbers: allNumbers?.length || 0
      }));

      setAllSchnicks(gamesWithPlayers || []);
    } catch (err: any) {
      console.error('Error loading schnicks directly:', err);
      setError(`Error loading schnicks: ${err.message}`);
      setAllSchnicks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load all schnicks directly from the database using RPC or multiple queries
  useEffect(() => {
    const loadAllSchnicks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Loading all schnicks via RPC call...');
        
        // Try to use RPC call if available
        const { data: completeGames, error: rpcError } = await supabase
          .rpc('get_all_schnicks_with_players');
          
        // If the RPC doesn't exist or fails, use the fallback direct queries
        if (rpcError) {
          console.log('RPC function not available or failed:', rpcError);
          console.log('Falling back to direct database queries...');
          await loadViaDirectQueries();
          return;
        }
        
        console.log('RPC result - Complete games:', completeGames);
        
        if (!completeGames || completeGames.length === 0) {
          console.log('No schnicks found in database via RPC');
          setAllSchnicks([]);
          return;
        }
        
        // Transform the data to match our GameWithPlayers format
        const transformedGames = completeGames.map((game: any) => ({
          ...game,
          schnicker: {
            id: game.schnicker_id,
            name: game.schnicker_name,
            created_at: game.schnicker_created_at
          },
          angeschnickter: {
            id: game.angeschnickter_id,
            name: game.angeschnickter_name,
            created_at: game.angeschnickter_created_at
          },
          runde1_zahlen: game.runde1_zahlen || [],
          runde2_zahlen: game.runde2_zahlen || []
        })) as GameWithPlayers[];
        
        console.log('Transformed games from RPC:', transformedGames.length);
        setAllSchnicks(transformedGames);
      } catch (err: any) {
        console.error('Error in loadAllSchnicks:', err);
        setError(err.message || 'Failed to load schnicks');
      } finally {
        setIsLoading(false);
      }
    };
    
      // Loading via RPC would happen here
    
    loadAllSchnicks();
  }, []);
  
  // Always load from the database on first render
  useEffect(() => {
    console.log('Initial data load triggered');
    loadViaDirectQueries();
  }, [loadViaDirectQueries]);

  // Use games from context (both active and finished), combining them without duplicates
  const gamesToDisplay = useMemo(() => {
    const contextGames = [...(activeGames || []), ...(finishedGames || [])];
    const allGames = [...contextGames, ...allSchnicks];
    // Remove duplicates based on ID
    const uniqueGames = Array.from(new Map(allGames.map(game => [game.id, game])).values());
    console.log('Combined games to display:', uniqueGames.length, { activeGames: activeGames?.length, finishedGames: finishedGames?.length, allSchnicks: allSchnicks.length });
    return uniqueGames;
  }, [activeGames, finishedGames, allSchnicks]);
  
  // Sort games: open first, then user's own games, then others
  const sortedGames = useMemo(() => {
    if (!gamesToDisplay || gamesToDisplay.length === 0) return [];
    console.log('Sorting', gamesToDisplay.length, 'games, current player:', currentPlayer?.name);
    
    return [...gamesToDisplay].sort((a, b) => {
      // First priority: Open games at the top
      if (a.status === 'offen' && b.status !== 'offen') return -1;
      if (a.status !== 'offen' && b.status === 'offen') return 1;
      
      // Second priority: User's own games (if currentPlayer exists)
      if (currentPlayer) {
        const aIsUsers = a.schnicker?.id === currentPlayer.id || a.angeschnickter?.id === currentPlayer.id;
        const bIsUsers = b.schnicker?.id === currentPlayer.id || b.angeschnickter?.id === currentPlayer.id;
        
        if (aIsUsers && !bIsUsers) return -1;
        if (!aIsUsers && bIsUsers) return 1;
      }
      
      // Third priority: Most recent first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [gamesToDisplay, currentPlayer]);
  
  // Determine appropriate status text
  const getStatusText = (game: GameWithPlayers) => {
    switch (game.status) {
      case 'offen':
        return game.bock_wert === null ? 'Bock wählen' : 'Offen';
      case 'runde1':
        // Check if current player has submitted their number
        const playerSubmitted = game.runde1_zahlen?.some((z: SchnickZahl) => 
          z.spieler_id === currentPlayer?.id
        );
        return playerSubmitted ? 'Warten' : 'Zahl wählen';
      case 'runde2':
        return 'Runde 2';
      case 'beendet':
        return 'Beendet';
      default:
        return 'Unbekannt';
    }
  };
  
  // Get background color for status badge
  const getStatusBgClass = (status: string) => {
    switch (status) {
      case 'offen':
        return 'bg-blue-500/30 text-blue-200';
      case 'runde1':
        return 'bg-yellow-500/30 text-yellow-200';
      case 'runde2':
        return 'bg-orange-500/30 text-orange-200';
      case 'beendet':
        return 'bg-gray-500/30 text-gray-300';
      default:
        return 'bg-schnicken-dark/50 text-schnicken-light/60';
    }
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} Minuten`;
    } else if (diffHours < 24) {
      return `${diffHours} Stunden`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} Tage`;
    }
  };

  // Log whenever allSchnicks or activeGames change
  useEffect(() => {
    console.log('allSchnicks updated:', allSchnicks.length, allSchnicks);
  }, [allSchnicks]);
  
  useEffect(() => {
    console.log('activeGames updated:', activeGames?.length, activeGames);
  }, [activeGames]);

  // Show loading state while fetching from database
  if (isLoading) {
    return (
      <div className="w-full max-w-sm mx-auto mt-8">
        <h2 className="text-schnicken-light/80 text-lg font-medium mb-4 text-center">Schnick Verlauf</h2>
        <div className="flex flex-col items-center justify-center space-y-2 w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-schnicken-light"></div>
          <div className="text-schnicken-light/70 text-sm">Lade Schnicks...</div>
        </div>
      </div>
    );
  }
  
  // Show error state if something went wrong
  if (error) {
    return (
      <div className="w-full max-w-sm mx-auto mt-8">
        <h2 className="text-schnicken-light/80 text-lg font-medium mb-4 text-center">Schnick Verlauf</h2>
        <div className="text-schnicken-accent p-4 text-center rounded-md bg-schnicken-dark/30">
          <p>Fehler beim Laden der Schnicks</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }
  
  // Show debug info when no games are found
  if (!sortedGames || sortedGames.length === 0) {
    return (
      <div className="w-full space-y-4">
        <h2 className="text-schnicken-light text-xl font-bold">Schnick Verlauf</h2>
        
        {/* Debug Tools for database connection */}
        <DebugTools />
        
        <div className="bg-schnicken-dark p-4 rounded-lg text-center">
          <p className="text-schnicken-light">Noch keine Schnicks vorhanden</p>
          <p className="text-schnicken-light/50 text-sm mt-2">Debug: {JSON.stringify({activeGamesCount: activeGames?.length || 0, finishedGamesCount: finishedGames?.length || 0})}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full max-w-sm mx-auto mt-8">
      <div className="flex flex-col space-y-2 w-full">
        {sortedGames.map((game, index) => {
          // Calculate opacity based on index
          const opacity = Math.max(0.3, 1 - index * 0.15);
          
          // Highlight user games is now handled via the border style rather than a separate class
          
          return (
            <div 
              key={game.id} 
              className="p-3 rounded-lg cursor-pointer transition-all hover:bg-schnicken-dark/20 relative border border-schnicken-dark/30"
              style={{ opacity }}
              onClick={() => onGameSelect(game)}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium">
                    {game.schnicker.name || 'Unknown'}
                  </div>
                  <div className="text-schnicken-light/50">&gt;</div>
                  <div className="font-medium">
                    {game.angeschnickter.name || 'Unknown'}
                  </div>
                </div>
                
                <div className={`text-xs px-2 py-0.5 rounded-full ${getStatusBgClass(game.status)}`}>
                  {getStatusText(game)}
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-sm text-schnicken-light/70">
                  {game.aufgabe || 'Keine Aufgabe'}
                </div>
                <div className="text-xs text-schnicken-accent flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatRelativeTime(game.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
