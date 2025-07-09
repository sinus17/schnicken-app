import React, { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useAppState } from '../contexts/AppStateContext';
import { useGame } from '../contexts/GameContext';

import { FullScreenLayout } from './layout/FullScreenLayout';
import { ButtonCard } from './ui/ButtonCard';
import { UserProfile } from './UserProfile';
import Avatar from './Avatar';
import { Logo } from './common/Logo';

export const MainMenu: React.FC = () => {
  const { currentPlayer, allPlayers, isLoading: playersLoading } = usePlayer();
  const { navigateTo } = useAppState();
  const { getMVPPlayer, finishedGames } = useGame();
  
  const mvpPlayerId = getMVPPlayer();
  
  // Sort players by their number of wins
  const sortedPlayers = useMemo(() => {
    // First, calculate wins for each player
    const playerWins: Record<string, number> = {};
    
    // Initialize with zero wins for all players
    allPlayers.forEach(player => {
      playerWins[player.id] = 0;
    });
    
    // Count wins from finished games
    finishedGames.forEach(game => {
      if (game.ergebnis === 'schnicker' && game.schnicker?.id) {
        playerWins[game.schnicker.id] = (playerWins[game.schnicker.id] || 0) + 1;
      } else if (game.ergebnis === 'angeschnickter' && game.angeschnickter?.id) {
        playerWins[game.angeschnickter.id] = (playerWins[game.angeschnickter.id] || 0) + 1;
      }
    });
    
    // Filter out current player and sort the rest by wins (descending)
    return allPlayers
      .filter(player => player.id !== currentPlayer?.id)
      .sort((a, b) => (playerWins[b.id] || 0) - (playerWins[a.id] || 0));
  }, [allPlayers, currentPlayer, finishedGames]);

  return (
    <FullScreenLayout 
      backgroundColor="bg-schnicken-darkest"
      hideLogo={true}
    >
      {/* User Profile Badge - Fixed Position in Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center px-3 py-1 rounded-full shadow-md">
          <UserProfile />
        </div>
      </div>

      {/* Centered Content Container - positioned relative to viewport height */}
      <div className="flex flex-col items-center mt-[10vh] w-full">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Wen möchtest Du anschnicken?</h1>
        </div>
        
        {/* Spieler Auswahl */}
        <div className="w-full max-w-sm mx-auto">
          {playersLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-schnicken-light"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPlayers.map((player) => (
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
                  <div className="relative">
                    {/* MVP tag - centered between edge and avatar */}
                    {mvpPlayerId === player.id && (
                      <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#FBC404] text-black text-xs font-bold px-2 py-1 rounded-full">
                        MVP
                      </div>
                    )}
                    {/* Avatar and name - identical for all players */}
                    <div className="flex items-center gap-4 justify-center w-full">
                      <Avatar
                        name={player.name}
                        avatarUrl={player.avatar_url}
                        size="large"
                      />
                      <div className="text-xl font-medium">{player.name}</div>
                    </div>
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
      </div>

    </FullScreenLayout>
  );
};
