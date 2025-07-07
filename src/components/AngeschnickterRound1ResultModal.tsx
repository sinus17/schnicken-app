import React from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';
import type { GameWithPlayers } from '../contexts/GameContext';

interface AngeschnickterRound1ResultModalProps {
  game: GameWithPlayers;
  onClose: () => void;
}

export const AngeschnickterRound1ResultModal: React.FC<AngeschnickterRound1ResultModalProps> = ({ 
  game, 
  onClose 
}) => {
  const schnickersZahl = game.runde1_zahlen?.find(z => z.spieler_id === game.schnicker.id)?.zahl;
  const angeschnicktensZahl = game.runde1_zahlen?.find(z => z.spieler_id === game.angeschnickter.id)?.zahl;
  
  // Prüfen ob der Schnicker bereits eine Zahl eingegeben hat
  const schnickersZahlSubmitted = game.runde1_zahlen?.some(z => z.spieler_id === game.schnicker.id);
  
  // Wenn beide Zahlen vorliegen, prüfen ob sie gleich sind
  const isSameNumber = schnickersZahl && angeschnicktensZahl && schnickersZahl === angeschnicktensZahl;
  
  // Headline basierend auf dem Spielstatus
  let headline = "Deine Zahl wurde gespeichert";
  
  if (schnickersZahlSubmitted) {
    headline = isSameNumber ? 
      "Schnick durchgegangen! 🎯" : 
      "Schnick geht weiter in Runde 2!";
  }
  
  // Bestimme die maximale Zahl für Runde 2
  const maxNumberForRound2 = Math.min(
    schnickersZahl || 1,
    angeschnicktensZahl || 1,
    4 // Maximale Zahl ist 4, falls die niedrigste Zahl aus Runde 1 größer ist
  );
  
  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-schnicken-dark p-6 rounded-lg text-center">
          {!schnickersZahlSubmitted ? (
            <>
              <div className="text-xl font-medium text-schnicken-light mb-4">
                Deine Zahl wurde gespeichert!
              </div>
              
              <div className="text-schnicken-light mb-4">
                Du hast {angeschnicktensZahl} gewählt
              </div>
              
              <div className="text-schnicken-light">
                <div className="text-lg font-medium mb-2">
                  Warten auf Zahl von {game.schnicker.name}
                </div>
                Das Ergebnis wird angezeigt, sobald {game.schnicker.name} eine Zahl gewählt hat.
              </div>
            </>
          ) : isSameNumber ? (
            <>
              <div className="text-xl font-medium text-schnicken-light mb-4">
                Gleiche Zahlen! Du musst die Aufgabe erfüllen!
              </div>
              
              <div className="text-schnicken-light mb-1">
                Ihr habt beide {angeschnicktensZahl} gewählt
              </div>
              
              <div className="text-schnicken-light mt-4">
                Du musst jetzt folgende Aufgabe erfüllen:
              </div>
              <div className="text-schnicken-yellow text-xl mt-2 font-medium">
                {game.aufgabe}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-medium text-schnicken-light mb-4">
                Die Zahlen waren unterschiedlich!
              </div>
              
              <div className="text-schnicken-light mb-1">
                Du hast {angeschnicktensZahl} gewählt
              </div>
              <div className="text-schnicken-light mb-4">
                {game.schnicker.name} hat {schnickersZahl} gewählt
              </div>
              
              <div className="text-schnicken-light">
                Es geht in die zweite Runde! Du darfst jetzt eine Zahl zwischen 
                1 und {maxNumberForRound2} wählen.
              </div>
              
              <div className="text-schnicken-light mt-4 text-sm italic">
                Danach wird {game.schnicker.name} ebenfalls eine Zahl zwischen 1 und {maxNumberForRound2} wählen.
                Bei gleichen Zahlen ist es ein Eigentor und {game.schnicker.name} muss die eigene Aufgabe erfüllen!
              </div>
            </>
          )}
        </div>
        
        <ActionButton
          onClick={onClose}
          className="w-full py-3 text-lg"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isSameNumber ? 'Verstanden' : 'Weiter zu Runde 2'}
          </div>
        </ActionButton>
      </div>
    </FullScreenLayout>
  );
};
