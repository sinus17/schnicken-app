import React, { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';
import type { GameWithPlayers } from '../contexts/GameContext';
import type { SchnickZahl } from '../lib/supabase';
import { FullScreenLayout } from './layout/FullScreenLayout';

export const AllSchnicks: React.FC = () => {
  const { currentPlayer } = usePlayer();
  const { activeGames, finishedGames, selectGame } = useGame();
  const { navigateTo } = useAppState();

  // Combine all games (active and finished)
  const allGames = useMemo(() => {
    const combined = [...(activeGames || []), ...(finishedGames || [])];
    return combined.sort((a, b) => {
      // Sort by created_at, newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activeGames, finishedGames]);

  // Determine appropriate status text
  const getStatusText = (game: GameWithPlayers) => {
    switch (game.status) {
      case 'offen':
        return game.bock_wert === null ? 'Bock wählen' : 'Offen';
      case 'runde1': {
        // Check if current player has submitted their number
        const playerSubmitted = game.runde1_zahlen?.some((z: SchnickZahl) => 
          z.spieler_id === currentPlayer?.id
        );
        return playerSubmitted ? 'Warten' : 'Zahl wählen';
      }
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
      return `${diffMinutes} Min`;
    } else if (diffHours < 24) {
      return `${diffHours} Std`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} Tag${diffDays === 1 ? '' : 'e'}`;
    }
  };

  // Check if user is involved in a game
  const isUserGame = (game: GameWithPlayers) => {
    return game.schnicker?.id === currentPlayer?.id || game.angeschnickter?.id === currentPlayer?.id;
  };

  const handleGameSelect = (game: GameWithPlayers) => {
    selectGame(game);
    
    // Check if game is still active and show appropriate response screens
    if (game.status !== 'beendet') {
      // Navigate back to menu to show GameResponseWrapper
      navigateTo('menu');
    } else {
      // For completed games, show the game details view
      navigateTo('game');
    }
  };

  return (
    <FullScreenLayout 
      headline="Alle Schnicks"
      backgroundColor="bg-schnicken-darkest"
    >
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button 
          onClick={() => navigateTo('menu')}
          className="flex items-center bg-schnicken-dark px-3 py-2 rounded-full shadow-md text-schnicken-light hover:bg-schnicken-highlight transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Zurück
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto space-y-4">
        {allGames.length === 0 ? (
          <div className="text-center text-schnicken-light/50 py-8">
            <p className="text-lg">Noch keine Schnicks vorhanden</p>
            <p className="text-sm mt-2">Gehe zurück und starte deinen ersten Schnick!</p>
          </div>
        ) : (
          <>
            <div className="text-center text-schnicken-light/70 text-sm mb-6">
              {allGames.length} Schnick{allGames.length === 1 ? '' : 's'} gefunden
            </div>
            
            {allGames.map((game) => {
              const isUserInvolved = isUserGame(game);
              
              return (
                <div 
                  key={game.id} 
                  className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-schnicken-dark/40 border ${
                    isUserInvolved 
                      ? 'border-schnicken-accent/50 bg-schnicken-dark/20' 
                      : 'border-schnicken-dark/30 bg-schnicken-dark/10'
                  }`}
                  onClick={() => handleGameSelect(game)}
                >
                  {/* Header with players and status */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          game.schnicker?.id === currentPlayer?.id ? 'text-schnicken-accent' : 'text-schnicken-light'
                        }`}>
                          {game.schnicker?.name || 'Unbekannt'}
                        </span>
                        <span className="text-schnicken-light/50">vs</span>
                        <span className={`font-medium ${
                          game.angeschnickter?.id === currentPlayer?.id ? 'text-schnicken-accent' : 'text-schnicken-light'
                        }`}>
                          {game.angeschnickter?.name || 'Unbekannt'}
                        </span>
                      </div>
                      {isUserInvolved && (
                        <span className="text-xs bg-schnicken-accent/20 text-schnicken-accent px-2 py-1 rounded-full">
                          Dein Spiel
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-xs px-3 py-1 rounded-full ${getStatusBgClass(game.status)}`}>
                      {getStatusText(game)}
                    </div>
                  </div>
                  
                  {/* Game details */}
                  <div className="space-y-2">
                    <div className="text-schnicken-light">
                      <span className="font-medium">Aufgabe:</span> {game.aufgabe || 'Keine Aufgabe'}
                    </div>
                    
                    {game.bock_wert !== null && (
                      <div className="text-schnicken-light/70 text-sm">
                        <span className="font-medium">Bock-Wert:</span> {game.bock_wert}
                      </div>
                    )}
                    
                    {game.status === 'beendet' && game.ergebnis && (
                      <div className="text-schnicken-light/70 text-sm">
                        <span className="font-medium">Ergebnis:</span> {
                          game.ergebnis === 'schnicker' ? `${game.schnicker?.name} muss die Aufgabe erfüllen` :
                          game.ergebnis === 'angeschnickter' ? `${game.angeschnickter?.name} muss die Aufgabe erfüllen` :
                          'Unentschieden'
                        }
                      </div>
                    )}
                  </div>
                  
                  {/* Footer with time */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-schnicken-light/10">
                    <div className="text-xs text-schnicken-accent flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      vor {formatRelativeTime(game.created_at)}
                    </div>
                    
                    {/* Round progress indicator */}
                    <div className="flex items-center space-x-1">
                      {[1, 2].map((round) => {
                        const roundNumbers = round === 1 ? game.runde1_zahlen : game.runde2_zahlen;
                        const hasNumbers = roundNumbers && roundNumbers.length > 0;
                        const isComplete = roundNumbers && roundNumbers.length === 2;
                        
                        return (
                          <div
                            key={round}
                            className={`w-2 h-2 rounded-full ${
                              isComplete ? 'bg-green-500' :
                              hasNumbers ? 'bg-yellow-500' :
                              'bg-schnicken-light/20'
                            }`}
                            title={`Runde ${round}${isComplete ? ' abgeschlossen' : hasNumbers ? ' läuft' : ' nicht gestartet'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </FullScreenLayout>
  );
};
