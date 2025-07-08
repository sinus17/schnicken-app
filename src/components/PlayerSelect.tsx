import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useAppState } from '../contexts/AppStateContext';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ButtonCard } from './ui/ButtonCard';

export const PlayerSelect: React.FC = () => {
  const { allPlayers, selectPlayer, isLoading } = usePlayer();
  const { navigateTo } = useAppState();

  const handleSelectPlayer = (player: typeof allPlayers[number]) => {
    selectPlayer(player);
    navigateTo('menu');
  };

  return (
    <FullScreenLayout 
      headline="Wer bist du?"
      description="Wähle deinen Spielernamen"
      backgroundColor="bg-schnicken-darkest"
    >
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-schnicken-light"></div>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto space-y-4">
          {allPlayers.length > 0 ? (
            allPlayers.map((player) => (
              <ButtonCard
                key={player.id}
                onClick={() => handleSelectPlayer(player)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-schnicken-medium rounded-full flex items-center justify-center text-white">
                    {player.name?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="text-xl font-medium">{player.name}</div>
                </div>
              </ButtonCard>
            ))
          ) : (
            <div className="text-center py-8 text-schnicken-light/60 bg-schnicken-dark/30 rounded-lg">
              Keine Spieler vorhanden
            </div>
          )}
        </div>
      )}
      
      <p className="text-center text-schnicken-light/50 mt-8">
        Schnicken &copy; 2025 - Made with 💙
      </p>
    </FullScreenLayout>
  );
};
