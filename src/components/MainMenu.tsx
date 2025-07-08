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
      headline="Wen möchtest Du anschnicken?"
      backgroundColor="bg-schnicken-darkest"
    >
      {/* User Profile Badge - Fixed Position in Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center px-3 py-1 rounded-full shadow-md">
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
                    console.log('Player clicked:', player.name, player.id);
                    
                    // Just set URL parameter for opponent selection and navigate
                    // We're not changing the current player, just selecting an opponent
                    window.history.pushState({}, '', `?opponentId=${player.id}`);
                    console.log('Navigating to create-game');
                    navigateTo('create-game');
                    console.log('Navigation called');
                  }}
                >
                  <div className="flex items-center gap-4 justify-center w-full">
                    <div className="w-12 h-12 bg-schnicken-medium rounded-full flex items-center justify-center text-white">
                      {player.name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="text-xl font-medium">{player.name}</div>
                  </div>
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
