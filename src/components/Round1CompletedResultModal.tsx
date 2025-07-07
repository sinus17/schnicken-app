import React from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';
import type { GameWithPlayers } from '../contexts/GameContext';

interface Round1CompletedResultModalProps {
  game: GameWithPlayers;
  isSchnicker: boolean;
  otherPlayerName: string;
  onClose: () => void;
}

export const Round1CompletedResultModal: React.FC<Round1CompletedResultModalProps> = ({ 
  game, 
  isSchnicker,
  otherPlayerName, 
  onClose 
}) => {
  const schnickersZahl = game.runde1_zahlen?.find(z => z.spieler_id === game.schnicker.id)?.zahl;
  
  const headline = "Schnick durchgegangen! 🎯";
  
  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-schnicken-dark p-6 rounded-lg text-center">
          <div className="text-xl font-medium text-schnicken-light mb-4">
            Gleiche Zahlen! Schnick erfolgreich!
          </div>
          
          <div className="text-schnicken-light mb-4">
            Ihr habt beide {schnickersZahl} gewählt
          </div>
          
          <div className="text-schnicken-light mb-1">
            {isSchnicker ? (
              <>
                <strong>{otherPlayerName}</strong> muss jetzt die Aufgabe erfüllen:
                <div className="text-schnicken-yellow text-xl mt-2 font-medium">
                  {game.aufgabe}
                </div>
              </>
            ) : (
              <>
                <strong>Du</strong> musst jetzt die Aufgabe erfüllen:
                <div className="text-schnicken-yellow text-xl mt-2 font-medium">
                  {game.aufgabe}
                </div>
              </>
            )}
          </div>
        </div>
        
        <ActionButton
          onClick={onClose}
          className="w-full py-3 text-lg"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Verstanden
          </div>
        </ActionButton>
      </div>
    </FullScreenLayout>
  );
};
