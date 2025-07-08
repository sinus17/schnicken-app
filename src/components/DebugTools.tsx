import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { ActionButton } from './ui/ActionButton';

export const DebugTools: React.FC = () => {
  const { currentPlayer } = usePlayer();
  const { refreshGames } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Test database connection
  const testConnection = async () => {
    setIsLoading(true);
    setMessage('Testing connection...');
    
    try {
      // Test if we can fetch players
      const { data: players, error: playerError } = await supabase
        .from('spieler')
        .select('*');
      
      if (playerError) {
        throw new Error(`Player error: ${playerError.message}`);
      }
      
      setDbStatus({
        connected: true,
        players: players?.length || 0,
      });
      
      setMessage(`Connection successful! Found ${players?.length} players.`);
    } catch (error) {
      console.error('Connection error:', error);
      setDbStatus({
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      });
      setMessage(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a test game
  const createTestGame = async () => {
    if (!currentPlayer) {
      setMessage('Error: No current player! Please select a player first.');
      return;
    }
    
    setIsLoading(true);
    setMessage('Creating test game...');
    
    try {
      // Find another player to play with
      const { data: otherPlayers } = await supabase
        .from('spieler')
        .select('*')
        .neq('id', currentPlayer.id)
        .limit(1);
      
      if (!otherPlayers || otherPlayers.length === 0) {
        // Create a test player if no other player exists
        const { data: newPlayer } = await supabase
          .from('spieler')
          .insert([{ name: 'Test Player', avatar_url: null }])
          .select()
          .single();
          
        if (!newPlayer) {
          throw new Error('Failed to create test player');
        }
        
        // Use the newly created test player
        const gameData = {
          schnicker_id: currentPlayer.id,
          angeschnickter_id: newPlayer.id,
          aufgabe: 'Test Aufgabe',
          bock_wert: 5,
          status: 'offen',
          ergebnis: null
        };
        
        const { data: game, error: gameError } = await supabase
          .from('schnicks')
          .insert([gameData])
          .select()
          .single();
        
        if (gameError) {
          throw new Error(`Game creation error: ${gameError.message}`);
        }
        
        if (game) {
          // Create player links
          await supabase.from('spieler_schnicks').insert([
            { spieler_id: currentPlayer.id, schnick_id: game.id },
            { spieler_id: newPlayer.id, schnick_id: game.id }
          ]);
          
          setMessage(`Success! Created test game with ID: ${game.id}`);
          
          // Refresh games to see the new game in the history
          await refreshGames();
        }
      } else {
        // Use an existing player
        const otherPlayer = otherPlayers[0];
        
        const gameData = {
          schnicker_id: currentPlayer.id,
          angeschnickter_id: otherPlayer.id,
          aufgabe: 'Test Aufgabe',
          bock_wert: 5,
          status: 'offen',
          ergebnis: null
        };
        
        const { data: game, error: gameError } = await supabase
          .from('schnicks')
          .insert([gameData])
          .select()
          .single();
        
        if (gameError) {
          throw new Error(`Game creation error: ${gameError.message}`);
        }
        
        if (game) {
          // Create player links
          await supabase.from('spieler_schnicks').insert([
            { spieler_id: currentPlayer.id, schnick_id: game.id },
            { spieler_id: otherPlayer.id, schnick_id: game.id }
          ]);
          
          setMessage(`Success! Created test game with ID: ${game.id}`);
          
          // Refresh games to see the new game in the history
          await refreshGames();
        }
      }
    } catch (error) {
      console.error('Game creation error:', error);
      setMessage(`Failed to create test game: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear message
  const clearMessage = () => {
    setMessage('');
    setDbStatus(null);
  };

  return (
    <div className="bg-schnicken-dark p-4 rounded-lg mb-4">
      <h3 className="text-schnicken-light font-bold mb-2">Debug Tools</h3>
      
      <div className="space-y-2">
        <ActionButton
          onClick={testConnection}
          disabled={isLoading}
          className="w-full py-2"
        >
          Test Database Connection
        </ActionButton>
        
        <ActionButton
          onClick={createTestGame}
          disabled={isLoading || !currentPlayer}
          className="w-full py-2"
        >
          Create Test Game
        </ActionButton>
        
        <ActionButton
          onClick={() => refreshGames()}
          disabled={isLoading}
          className="w-full py-2"
        >
          Refresh Games
        </ActionButton>
        
        {message && (
          <div className="mt-2 p-2 bg-schnicken-darker rounded-lg">
            <p className="text-schnicken-light text-sm">{message}</p>
            {dbStatus && (
              <pre className="text-xs text-schnicken-light/70 mt-1 overflow-x-auto">
                {JSON.stringify(dbStatus, null, 2)}
              </pre>
            )}
            <button
              onClick={clearMessage}
              className="text-xs text-schnicken-accent underline mt-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
