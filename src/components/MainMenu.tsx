import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useAppState } from '../contexts/AppStateContext';

import { FullScreenLayout } from './layout/FullScreenLayout';
import { ButtonCard } from './ui/ButtonCard';
import { UserProfile } from './UserProfile';

export const MainMenu: React.FC = () => {
  const { currentPlayer, allPlayers, isLoading: playersLoading } = usePlayer();
  const { navigateTo } = useAppState();

  return (
    <FullScreenLayout 
      headline="Wen willst du anschnicken?"
      backgroundColor="bg-schnicken-darkest"
    >
      {/* User Profile Badge - Fixed Position in Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center bg-schnicken-dark px-3 py-1 rounded-full shadow-md">
          <UserProfile />
        </div>
      </div>

      {/* Spieler Auswahl */}
      <div className="w-full max-w-sm mx-auto">
        {playersLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-schnicken-light"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {allPlayers
              .filter(player => player.id !== currentPlayer?.id)
              .map((player) => (
                <ButtonCard
                  key={player.id}
                  onClick={() => {
                    // Setze URL-Parameter mit der Spieler-ID und navigiere zur CreateGame-Seite
                    window.history.pushState({}, '', `?opponentId=${player.id}`);
                    navigateTo('create-game');
                  }}
                >
                  <div className="text-xl font-medium text-center">{player.name}</div>
                </ButtonCard>
              ))
            }
          </div>
        )}
        
        {/* Alle Schnicks anzeigen Button */}
        <div className="mt-8">
          <div className="h-px bg-schnicken-light/20 w-3/4 mx-auto mb-4"></div>
          <ButtonCard
            onClick={() => navigateTo('schnicks')}
            className="bg-schnicken-dark/30 border border-schnicken-accent/30 hover:bg-schnicken-accent/10"
          >
            <div className="text-lg font-medium text-center text-schnicken-accent">Alle Schnicks anzeigen</div>
          </ButtonCard>
        </div>
      </div>

    </FullScreenLayout>
  );
};
