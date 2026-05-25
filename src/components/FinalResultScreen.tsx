import React from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import type { GameWithPlayers } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';

interface FinalResultScreenProps {
  game: GameWithPlayers;
  onClose: () => void;
}

export const FinalResultScreen: React.FC<FinalResultScreenProps> = ({ game, onClose }) => {
  const { currentPlayer } = usePlayer();

  const schnicker = game.schnicker?.name ?? 'Schnicker';
  const angeschnickter = game.angeschnickter?.name ?? 'Angeschnickter';
  const isSchnicker = currentPlayer?.id === game.schnicker?.id;
  const isAngeschnickter = currentPlayer?.id === game.angeschnickter?.id;
  const isInvolved = isSchnicker || isAngeschnickter;

  const round1Numbers = game.runde1_zahlen || [];
  const round2Numbers = game.runde2_zahlen || [];

  const playerNumber = (zahlen: typeof round1Numbers, spielerId?: string) =>
    spielerId ? zahlen.find(z => z.spieler_id === spielerId)?.zahl ?? null : null;

  const r1Schnicker = playerNumber(round1Numbers, game.schnicker?.id);
  const r1Angeschnickter = playerNumber(round1Numbers, game.angeschnickter?.id);
  const r2Schnicker = playerNumber(round2Numbers, game.schnicker?.id);
  const r2Angeschnickter = playerNumber(round2Numbers, game.angeschnickter?.id);

  let headline = 'Schnick beendet';
  let emoji = '🏁';
  let resultMessage = '';

  switch (game.ergebnis) {
    case 'schnicker':
      headline = 'Schnick durchgegangen!';
      emoji = '🎯';
      resultMessage = isAngeschnickter
        ? `Du musst die Aufgabe erfüllen: ${game.aufgabe}`
        : isSchnicker
          ? `${angeschnickter} muss die Aufgabe erfüllen: ${game.aufgabe}`
          : `${angeschnickter} muss die Aufgabe erfüllen: ${game.aufgabe}`;
      break;
    case 'angeschnickter':
      headline = 'Eigentor!';
      emoji = '🤦';
      resultMessage = isSchnicker
        ? `Du musst die eigene Aufgabe erfüllen: ${game.aufgabe}`
        : `${schnicker} muss die eigene Aufgabe erfüllen: ${game.aufgabe}`;
      break;
    case 'unentschieden':
      headline = 'Unentschieden';
      emoji = '🤝';
      resultMessage = 'Die Zahlen waren unterschiedlich. Niemand muss die Aufgabe erfüllen.';
      break;
    default:
      resultMessage = 'Das Spiel ist beendet.';
  }

  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={
        <>
          <span className="mr-2">{emoji}</span>
          {headline}
        </>
      }
    >
      {/* Close Button - top right */}
      <button
        onClick={onClose}
        aria-label="Schließen"
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-schnicken-dark text-schnicken-light flex items-center justify-center hover:bg-schnicken-medium/80 transition-colors shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className="w-full max-w-sm space-y-6">
        {/* Game info */}
        <div className="bg-schnicken-dark p-4 rounded-lg text-center">
          <div className="text-sm text-schnicken-light/70 mb-1">Schnick</div>
          <div className="text-lg font-medium text-schnicken-light">
            {schnicker} → {angeschnickter}
          </div>
          {game.aufgabe && (
            <div className="text-sm text-schnicken-light/80 mt-2">
              Aufgabe: <span className="text-schnicken-light">{game.aufgabe}</span>
            </div>
          )}
          {game.bock_wert !== null && (
            <div className="text-sm text-schnicken-light/80 mt-1">
              Bock-Wert: <span className="text-schnicken-light">{game.bock_wert}</span>
            </div>
          )}
        </div>

        {/* Round numbers */}
        <div className="bg-schnicken-dark p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            {/* Round 1 */}
            <div className="text-center">
              <p className="text-schnicken-light/80 text-sm mb-2">Runde 1</p>
              <div className="flex justify-center items-center space-x-2">
                <div className="bg-schnicken-primary/80 rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-schnicken-darkest font-bold">{r1Schnicker ?? '-'}</span>
                </div>
                <span className="text-schnicken-light/50 text-sm">vs</span>
                <div className="bg-schnicken-accent/80 rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-schnicken-darkest font-bold">{r1Angeschnickter ?? '-'}</span>
                </div>
              </div>
            </div>

            {/* Round 2 */}
            <div className="text-center">
              <p className="text-schnicken-light/80 text-sm mb-2">Runde 2</p>
              {round2Numbers.length > 0 ? (
                <div className="flex justify-center items-center space-x-2">
                  <div className="bg-schnicken-primary rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="text-schnicken-darkest font-bold">{r2Schnicker ?? '-'}</span>
                  </div>
                  <span className="text-schnicken-light/50 text-sm">vs</span>
                  <div className="bg-schnicken-accent rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="text-schnicken-darkest font-bold">{r2Angeschnickter ?? '-'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-schnicken-light/40 text-sm pt-2">— nicht gespielt —</div>
              )}
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-schnicken-medium/30 p-6 rounded-lg text-center border border-schnicken-medium/50">
          <div className="text-lg font-medium text-schnicken-light">{resultMessage}</div>
          {!isInvolved && (
            <div className="text-xs text-schnicken-light/60 mt-2">Du warst nicht beteiligt.</div>
          )}
        </div>
      </div>
    </FullScreenLayout>
  );
};
