import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';

export const History: React.FC = () => {
  const { currentPlayer } = usePlayer();
  const { finishedGames, selectGame, getGameResult } = useGame();
  const { navigateTo } = useAppState();

  if (!currentPlayer) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <div className="card">
          <p className="text-center py-4">Kein Spieler ausgewählt.</p>
          <button onClick={() => navigateTo('menu')} className="btn btn-primary w-full">
            Zum Hauptmenü
          </button>
        </div>
      </div>
    );
  }

  const handleViewGame = (game: typeof finishedGames[number]) => {
    selectGame(game);
    navigateTo('game');
  };

  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="card mb-4">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('menu')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold flex-1 text-center mr-7">Spielverlauf</h1>
        </div>

        {finishedGames.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">Keine abgeschlossenen Spiele</p>
          </div>
        ) : (
          <div className="space-y-3">
            {finishedGames.map((game) => {
              const isSchnicker = currentPlayer.id === game.schnicker_id;
              const isAngeschnickter = currentPlayer.id === game.angeschnickter_id;
              const isInvolved = isSchnicker || isAngeschnickter;
              
              let resultClass = '';
              let displayText = '';
              
              if (isInvolved) {
                // Current player is involved in this game
                const opponent = isSchnicker ? game.angeschnickter : game.schnicker;
                displayText = isSchnicker ? `vs. ${opponent.name} (geschnickt)` : `vs. ${opponent.name} (Schnicker)`;
                
                if (
                  (isSchnicker && game.ergebnis === 'angeschnickter') ||
                  (!isSchnicker && game.ergebnis === 'schnicker')
                ) {
                  resultClass = 'border-green-500';
                } else if (
                  (isSchnicker && game.ergebnis === 'schnicker') ||
                  (!isSchnicker && game.ergebnis === 'angeschnickter')
                ) {
                  resultClass = 'border-red-500';
                } else {
                  resultClass = 'border-gray-300';
                }
              } else {
                // Current player is not involved - show the game between other players
                displayText = `${game.schnicker.name} vs. ${game.angeschnickter.name}`;
                resultClass = 'border-gray-300';
              }
              
              return (
                <div 
                  key={game.id}
                  onClick={() => handleViewGame(game)}
                  className={`card border-l-4 ${resultClass} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${!isInvolved ? 'opacity-75' : ''}`}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">
                        {displayText}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {game.aufgabe}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(game.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Ergebnis:</span> {getGameResult(game)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
