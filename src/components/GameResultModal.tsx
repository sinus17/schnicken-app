import React from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';

type ResultType = 'schnicker_won' | 'angeschnickter_won' | 'eigentor' | 'no_winner';

interface GameResultModalProps {
  game: any;
  resultType: ResultType;
  onClose: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({ game, resultType, onClose }) => {
  let headline = '';
  let message = '';
  
  const schnicker = game.schnicker.name;
  const angeschnickter = game.angeschnickter.name;
  
  switch(resultType) {
    case 'schnicker_won':
      headline = 'Schnick durchgegangen! 🎯';
      message = `${angeschnickter} muss jetzt folgende Aufgabe erfüllen: ${game.aufgabe}`;
      break;
    case 'angeschnickter_won':
      headline = 'Schnick nicht durchgegangen 🛑';
      message = `Die Zahlen waren unterschiedlich. ${schnicker} hatte kein Glück, niemand muss die Aufgabe erfüllen.`;
      break;
    case 'eigentor':
      headline = 'Eigentor! 🤦‍♂️';
      message = `${schnicker} muss jetzt die eigene Aufgabe erfüllen: ${game.aufgabe}`;
      break;
    case 'no_winner':
      headline = 'Unentschieden 🤝';
      message = 'Die Zahlen waren unterschiedlich. Niemand muss die Aufgabe erfüllen.';
      break;
  }

  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-schnicken-dark p-6 rounded-lg text-center">
          <div className="text-xl font-medium text-schnicken-light">{message}</div>
        </div>
        
        <ActionButton
          onClick={onClose}
          className="w-full py-3 text-lg"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Schließen
          </div>
        </ActionButton>
      </div>
    </FullScreenLayout>
  );
};
