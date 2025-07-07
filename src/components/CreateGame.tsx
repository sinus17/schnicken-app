import React, { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';
import { FormInput } from './ui/FormInput';
import type { Spieler } from '../lib/supabase';

export const CreateGame: React.FC = () => {
  const { currentPlayer, allPlayers } = usePlayer();
  const { createGame } = useGame();
  const { navigateTo } = useAppState();
  
  const [selectedOpponent, setSelectedOpponent] = useState<Spieler | null>(null);
  const [aufgabe, setAufgabe] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filtere den aktuellen Spieler aus der Liste der potenziellen Gegner
  const availableOpponents = allPlayers.filter(
    player => player.id !== currentPlayer?.id
  );
  
  // Wähle zufälligen Gegner, wenn keiner ausgewählt ist
  React.useEffect(() => {
    const opponentId = new URLSearchParams(window.location.search).get('opponentId');
    if (opponentId) {
      const opponent = availableOpponents.find(p => p.id === opponentId);
      if (opponent) {
        setSelectedOpponent(opponent);
      }
    }
  }, [availableOpponents]);

  const handleCreateGame = async () => {
    if (!selectedOpponent || !aufgabe.trim()) return;
    
    setIsCreating(true);
    // Bock-Wert ist jetzt null, da der Angeschnickte später seinen Bock-Wert festlegt
    const game = await createGame(selectedOpponent, aufgabe, null);
    setIsCreating(false);

    if (game) {
      navigateTo('menu');
    }
  };

  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={selectedOpponent ? `${selectedOpponent.name}, wie viel Bock hast du...?` : 'Anschnicken'}
    >
      {/* Back Button */}
      <div className="w-full flex justify-start mb-4">
        <button 
          onClick={() => navigateTo('menu')}
          className="text-schnicken-light/70 hover:text-schnicken-light bg-schnicken-dark p-2 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>
      
      {!selectedOpponent ? (
        <div className="w-full max-w-sm space-y-4">
          {allPlayers.map((player) => (
            <div 
              key={player.id}
              onClick={() => setSelectedOpponent(player)}
              className="bg-schnicken-dark hover:bg-schnicken-dark/70 p-5 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-xl text-schnicken-light font-medium">{player.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex justify-center items-center">
          <div className="space-y-6 w-full max-w-sm mx-auto flex flex-col items-center">
            <FormInput
              value={aufgabe}
              onChange={(value) => setAufgabe(value)}
              placeholder="Aufgabe eingeben..."
              autoFocus
            />

            <ActionButton
              onClick={handleCreateGame}
              type="submit"
              className="px-8 py-3 text-xl w-full"
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-schnicken-light mx-auto"></div>
              ) : (
                'Anschnicken'
              )}
            </ActionButton>
          </div>
        </div>
      )}
    </FullScreenLayout>
  );
};
