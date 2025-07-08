import React, { useState } from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';
import { useGame } from '../contexts/GameContext';
import type { GameWithPlayers } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';

interface Round1ResultModalProps {
  game: GameWithPlayers;
  isSchnicker: boolean;
  otherPlayerName: string;
  onClose: () => void;
}

export const Round1ResultModal: React.FC<Round1ResultModalProps> = ({ 
  game, 
  isSchnicker,
  otherPlayerName, 
  onClose 
}) => {
  const { currentPlayer } = usePlayer();
  const { submitZahl } = useGame();
  const headline = "Schnick geht weiter in Runde 2!";
  
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const schnickersZahl = game.runde1_zahlen?.find(z => z.spieler_id === game.schnicker.id)?.zahl;
  const angeschnicktensZahl = game.runde1_zahlen?.find(z => z.spieler_id === game.angeschnickter.id)?.zahl;

  // Check if both players have submitted their Round 1 numbers
  const bothRound1NumbersAvailable = schnickersZahl !== undefined && angeschnicktensZahl !== undefined;
  
  // Determine which player we're waiting for (if any)
  const waitingForPlayer = !bothRound1NumbersAvailable ? 
    (schnickersZahl === undefined ? game.schnicker.name : game.angeschnickter.name) : null;
  
  // Calculate the range number for Round 2
  const getRange = () => {
    // If either player chose 4 or lower, use 4 as the max range for Round 2
    if ((schnickersZahl && schnickersZahl <= 4) || (angeschnicktensZahl && angeschnicktensZahl <= 4)) {
      console.log('Round1ResultModal: Using fixed range 1-4 for Round 2');
      return 4;
    }
    // Otherwise use the minimum number from Round 1
    return Math.min(schnickersZahl || 1, angeschnicktensZahl || 1);
  };
  
  const lowestRound1Number = getRange();
  
  // Check if the other player has already submitted their Round 2 number
  const hasOtherPlayerSubmitted = !!game.runde2_zahlen?.find(z => 
    isSchnicker ? z.spieler_id === game.angeschnickter.id : z.spieler_id === game.schnicker.id
  );
  
  // Handle submission of Round 2 number
  const handleRound2Submit = async () => {
    if (!selectedNumber || !currentPlayer) return;
    
    const num = parseInt(selectedNumber);
    if (num < 1 || num > lowestRound1Number) return;
    
    setIsSubmitting(true);
    console.log('Round1ResultModal: Submitting Round 2 number', { num, game });
    // Pass the game explicitly to ensure we have the correct reference
    const success = await submitZahl(num, 2, game);
    setIsSubmitting(false);
    
    if (success) {
      onClose();
    } else {
      console.error('Round1ResultModal: Failed to submit Round 2 number');
    }
  };
  
  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6 mt-10">
        {/* Results display for Round 1 */}
        <div className="bg-schnicken-dark p-6 rounded-lg text-center">
          {/* Versus display for Round 1 numbers */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 text-center">
              <p className="text-schnicken-light/80 text-sm mb-5">{isSchnicker ? "Du" : game.schnicker.name}</p>
              <div className="bg-yellow-500 rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                <span className="text-schnicken-darkest text-2xl font-bold">{schnickersZahl}</span>
              </div>
            </div>
            
            <div className="mx-4 text-schnicken-light/50">
              <span className="text-xl font-bold">VS</span>
            </div>
            
            <div className="flex-1 text-center">
              <p className="text-schnicken-light/80 text-sm mb-5">{!isSchnicker ? "Du" : game.angeschnickter.name}</p>
              <div className="bg-yellow-500 rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                <span className="text-schnicken-darkest text-2xl font-bold">{angeschnicktensZahl}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show waiting message or Round 2 input */}
        {!bothRound1NumbersAvailable ? (
          <div className="bg-yellow-900/30 p-6 rounded-lg text-center">
            <p className="text-yellow-300 text-lg mb-2">
              Warte auf Zahl für Runde 1 von {waitingForPlayer}
            </p>
            <p className="text-schnicken-light/60 text-sm">
              Du kannst deine Zahl für Runde 2 erst eingeben, wenn alle Zahlen für Runde 1 abgegeben wurden.
            </p>
          </div>
        ) : (
          // Only show Round 2 input when both Round 1 numbers are available
          <>
            {hasOtherPlayerSubmitted && (
              <div className="bg-green-900/30 p-3 mb-4 rounded-lg text-center">
                <p className="text-green-300">
                  {`${otherPlayerName} hat bereits eine Zahl für Runde 2 gewählt.`}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-schnicken-light/80 mb-3">
                Du musst eine Zahl zwischen 1 und {lowestRound1Number} wählen.
              </p>
              
              {/* Round 2 Number Input */}
              <div className="mt-6">
                <input
                  type="number"
                  min={1}
                  max={lowestRound1Number}
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  className="block w-full px-4 py-3 text-center text-2xl bg-schnicken-darker text-black font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-schnicken-light"
                  placeholder={`1-${lowestRound1Number}`}
                  disabled={isSubmitting}
                />

              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <ActionButton
                  onClick={handleRound2Submit}
                  disabled={isSubmitting || !selectedNumber || parseInt(selectedNumber) < 1 || parseInt(selectedNumber) > lowestRound1Number}
                  className="w-full py-3"
                >
                  {isSubmitting ? "Wird gespeichert..." : "Zahl abgeben"}
                </ActionButton>
              </div>
            </div>
          </>
        )}
      </div>
    </FullScreenLayout>
  );
};
