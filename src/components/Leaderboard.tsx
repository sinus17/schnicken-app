import React, { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { FullScreenLayout } from './layout/FullScreenLayout';
import Avatar from './Avatar';

interface PlayerStats {
  id: string;
  name: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  ties: number;
  favoriteNumber: number | null;
}

export const Leaderboard: React.FC = () => {
  const { allPlayers } = usePlayer();
  const { finishedGames, getMVPPlayer } = useGame();
  
  const mvpPlayerId = getMVPPlayer();

  // Calculate player statistics based on game results
  const playerStats: PlayerStats[] = useMemo(() => {
    // Initialize stats for each player
    const stats: { [playerId: string]: PlayerStats } = {};
    
    // Track number frequencies for each player
    const numberFrequency: { 
      [playerId: string]: { 
        [num: number]: number 
      } 
    } = {};
    
    // Ensure all players are included even if they haven't played games
    allPlayers.forEach(player => {
      stats[player.id] = {
        id: player.id,
        name: player.name,
        avatarUrl: player.avatar_url,
        wins: 0,
        losses: 0,
        ties: 0,
        favoriteNumber: null
      };
      
      numberFrequency[player.id] = {};
    });
    
    // Calculate stats from finished games
    finishedGames.forEach(game => {
      const schnickerId = game.schnicker?.id;
      const angeschnickterId = game.angeschnickter?.id;
      
      if (!schnickerId || !angeschnickterId) return;
      
      // Track number frequencies combining rounds 1 and 2
      // Process round 1 numbers
      if (game.runde1_zahlen && game.runde1_zahlen.length > 0) {
        game.runde1_zahlen.forEach(zahlObj => {
          const playerId = zahlObj.spieler_id;
          const num = zahlObj.zahl;
          
          if (!numberFrequency[playerId]) {
            numberFrequency[playerId] = {};
          }
          
          if (!numberFrequency[playerId][num]) {
            numberFrequency[playerId][num] = 0;
          }
          
          numberFrequency[playerId][num]++;
        });
      }
      
      // Process round 2 numbers
      if (game.runde2_zahlen && game.runde2_zahlen.length > 0) {
        game.runde2_zahlen.forEach(zahlObj => {
          const playerId = zahlObj.spieler_id;
          const num = zahlObj.zahl;
          
          if (!numberFrequency[playerId]) {
            numberFrequency[playerId] = {};
          }
          
          if (!numberFrequency[playerId][num]) {
            numberFrequency[playerId][num] = 0;
          }
          
          numberFrequency[playerId][num]++;
        });
      }
      
      // Ensure both players exist in stats
      if (!stats[schnickerId]) {
        stats[schnickerId] = {
          id: schnickerId,
          name: game.schnicker.name,
          avatarUrl: game.schnicker.avatar_url,
          wins: 0,
          losses: 0,
          ties: 0,
          favoriteNumber: null
        };
      }
      
      if (!stats[angeschnickterId]) {
        stats[angeschnickterId] = {
          id: angeschnickterId,
          name: game.angeschnickter.name,
          avatarUrl: game.angeschnickter.avatar_url,
          wins: 0,
          losses: 0,
          ties: 0,
          favoriteNumber: null
        };
      }
      
      // Update stats based on game result
      if (game.ergebnis === 'schnicker') {
        // Schnicker won
        stats[schnickerId].wins++;
        stats[angeschnickterId].losses++;
      } else if (game.ergebnis === 'angeschnickter') {
        // Angeschnickter won
        stats[angeschnickterId].wins++;
        stats[schnickerId].losses++;
      } else if (game.ergebnis === 'unentschieden') {
        // Tie game
        stats[schnickerId].ties++;
        stats[angeschnickterId].ties++;
      }
    });
    
    // Find favorite number for each player (cumulative across all rounds)
    Object.keys(stats).forEach(playerId => {
      const freqs = numberFrequency[playerId] || {};
      let maxFreq = 0;
      let favNumber: number | null = null;
      
      Object.entries(freqs).forEach(([num, freq]) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          favNumber = parseInt(num);
        }
      });
      
      stats[playerId].favoriteNumber = favNumber;
    });
    
    // Convert to array and sort by wins (descending)
    return Object.values(stats).sort((a, b) => b.wins - a.wins);
  }, [allPlayers, finishedGames]);

  return (
    <FullScreenLayout 
      headline="Leaderboard"
      description="Rangliste nach gewonnenen Schnicks"
      backgroundColor="bg-schnicken-darkest"
    >
      <div className="w-full max-w-md mx-auto">
        <div className="space-y-4 mb-8">
          {playerStats.map((player, index) => (
            <div 
              key={player.id} 
              className="bg-schnicken-dark rounded-lg shadow-lg p-4 flex items-center"
            >
              {/* Rank Number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-schnicken-primary flex items-center justify-center mr-4">
                <span className="text-[#fbc404] font-bold">{index + 1}</span>
              </div>
              
              {/* Player Avatar and Name */}
              <div className="relative flex-shrink-0">
                <Avatar
                  name={player.name}
                  avatarUrl={player.avatarUrl}
                  size="large"
                />
                
                {/* MVP Tag */}
                {mvpPlayerId === player.id && (
                  <div className="absolute -top-2 -right-2 bg-[#FBC404] text-black text-xs font-bold px-2 py-1 rounded-full">
                    MVP
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-grow">
                <h3 className="text-lg font-medium text-white">{player.name}</h3>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-green-400">{player.wins}</span>
                  <span className="text-sm text-gray-400 mx-1">-</span>
                  <span className="text-sm text-gray-400">{player.ties}</span>
                  <span className="text-sm text-gray-400 mx-1">-</span>
                  <span className="text-sm text-red-400">{player.losses}</span>
                </div>
                
                {/* Favorite Number */}
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <span className="text-xs text-[#81A79F] mr-1">Lieblingszahl:</span>
                    <span className="text-xs font-bold text-schnicken-light">
                      {player.favoriteNumber !== null ? player.favoriteNumber : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show a message if no games have been played yet */}
        {finishedGames.length === 0 && (
          <div className="bg-schnicken-accent/20 border border-schnicken-accent/30 rounded-lg p-4 text-center text-schnicken-light">
            Es wurden noch keine Schnicks gespielt. Schnick jemanden an, um in die Rangliste zu kommen!
          </div>
        )}
      </div>
    </FullScreenLayout>
  );
};
