import React, { useState, useEffect } from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';
import { useGame } from '../contexts/GameContext';
import type { GameWithPlayers } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';
import { usePlayer } from '../contexts/PlayerContext';
import { Round2ResultModal } from './Round2ResultModal';

interface Round2ResponseProps {
  forceShow?: boolean;
}

export const Round2Response: React.FC<Round2ResponseProps> = ({ forceShow = false }) => {
  const { currentPlayer } = usePlayer();
  const { activeGames, currentGame: contextCurrentGame, submitZahl } = useGame();
  const { navigateTo } = useAppState();
  
  console.log('Round2Response rendering', { activeGames, contextCurrentGame });
  
  const [selectedNumber, setSelectedNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // Filter für Spiele mit Status "runde2", bei denen der aktuelle Spieler noch keine Zahl für Runde 2 eingegeben hat
  const pendingGames = activeGames ? activeGames.filter(game => {
    // Explicitly log all runde2_zahlen to debug
    console.log('Checking game for pending status:', game.id, 'runde2_zahlen:', game.runde2_zahlen);
    
    return game.status === 'runde2' &&
      !game.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id);
  }) : [];

  // Use currentGame from context if it's in runde2 state, otherwise use from pendingGames
  const currentGame = (contextCurrentGame && contextCurrentGame.status === 'runde2') ? 
    contextCurrentGame : 
    pendingGames[selectedGameIndex];
  
  console.log('Round2Response selected game:', { 
    currentGame, 
    contextGameStatus: contextCurrentGame?.status,
    hasPendingGames: pendingGames.length > 0,
    needsResponse: currentPlayer && currentGame && 
      !currentGame.runde2_zahlen?.some(z => z.spieler_id === currentPlayer.id)
  });
  
  // Only return null if we don't have any valid game to show and forceShow is not enabled
  if (!currentGame && !forceShow) {
    console.log('Round2Response: No game to show');
    return null;
  }
  
  console.log('Round2Response rendering with forceShow =', forceShow);

  // Use contextCurrentGame as a fallback if currentGame is not available
  const gameToUse = currentGame || contextCurrentGame;
  
  if (!gameToUse) {
    console.log('Round2Response: No game to show even with forceShow');
    return null;
  }
  
  // Check if both round 2 numbers are available to show immediate result
  useEffect(() => {
    if (gameToUse && gameToUse.runde2_zahlen && gameToUse.runde2_zahlen.length === 2) {
      console.log('Round2Response: Both round 2 numbers available, showing result automatically');
      setShowResult(true);
    }
  }, [gameToUse, gameToUse?.runde2_zahlen?.length]);
  
  // Additional deep watch for changes to runde2_zahlen array contents
  // This ensures we catch updates even when the array reference doesn't change
  useEffect(() => {
    const zahlenString = JSON.stringify(gameToUse?.runde2_zahlen || []);
    console.log('Round2Response: Monitoring runde2_zahlen changes', zahlenString);
    
    if (gameToUse?.runde2_zahlen?.length === 2) {
      console.log('Round2Response: Both round 2 numbers detected via deep watch');
      setShowResult(true);
    }
  }, [JSON.stringify(gameToUse?.runde2_zahlen)]);
  
  // Check if player already submitted their number for round 2
  const playerSubmittedR2 = currentPlayer && gameToUse.runde2_zahlen?.some(z => z.spieler_id === currentPlayer.id);
  
  if (playerSubmittedR2) {
    console.log('Round2Response: Player already submitted a number for round 2', 
      gameToUse.runde2_zahlen?.filter(z => z.spieler_id === currentPlayer.id));
      
    // Always show confirmation screen when player already submitted
    const playerNumber = gameToUse.runde2_zahlen?.find(z => z.spieler_id === currentPlayer.id)?.zahl;
    
    return (
      <FullScreenLayout
        backgroundColor="bg-schnicken-darkest"
        headline="Runde 2"
      >
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-schnicken-dark p-6 rounded-lg text-center">
            <p className="text-schnicken-light text-lg mb-4">
              Du hast bereits deine Zahl für Runde 2 abgegeben.
            </p>
            <div className="bg-schnicken-primary rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
              <span className="text-schnicken-darkest text-2xl font-bold">{playerNumber}</span>
            </div>
            <p className="text-schnicken-light">
              Warte auf das Ergebnis des Spiels.
            </p>
          </div>
          <ActionButton
            onClick={navigateTo.bind(null, 'menu')}
            className="w-full py-3"
          >
            Zurück zum Menü
          </ActionButton>
        </div>
      </FullScreenLayout>
    );
  }

  // Ermittle die Zahl für den Bereich in Runde 2
  const findLowestRound1Number = (game: GameWithPlayers): number => {
    if (!game.runde1_zahlen || game.runde1_zahlen.length !== 2) {
      console.log('Round2Response: Invalid runde1_zahlen, defaulting to 1', game.runde1_zahlen);
      return 1;
    }
    
    const numbers = game.runde1_zahlen.map(z => z.zahl);
    console.log('Round2Response: Round 1 numbers:', numbers);
    
    // If any player chose 4 or lower, use 4 as the max range for Round 2
    if (numbers.some(num => num <= 4)) {
      console.log('Round2Response: Using fixed range 1-4 for Round 2');
      return 4;
    }
    
    // Otherwise use the minimum number from Round 1
    return Math.min(...numbers);
  };
  
  const lowestRound1Number = findLowestRound1Number(gameToUse);
  
  // Ermittle den Spielertyp (Schnicker oder Angeschnickter)
  const isSchnicker = currentPlayer?.id === gameToUse.schnicker.id;
  const otherPlayerName = isSchnicker ? gameToUse.angeschnickter.name : gameToUse.schnicker.name;
  
  const handleConfirm = async () => {
    if (!gameToUse || !selectedNumber) return;
    
    const parsedNumber = parseInt(selectedNumber);
    if (parsedNumber < 1 || parsedNumber > lowestRound1Number) {
      return; // Ungültige Eingabe
    }
    
    console.log('Submitting number for round 2:', parsedNumber);
    setIsUpdating(true);
    
    // Submitte die Zahl für Runde 2
    const success = await submitZahl(parsedNumber, 2);
    setIsUpdating(false);
    console.log('Submit result:', success);
    
    if (success) {
      // Prüfen ob das Spiel abgeschlossen ist und ein Ergebnis angezeigt werden soll
      const updatedGame = activeGames?.find(g => g.id === gameToUse.id);
      
      if (updatedGame && updatedGame.status === 'beendet') {
        // Spiel ist beendet, zeige Ergebnis an
        console.log('Game is completed, showing result', updatedGame.ergebnis);
        setShowResult(true);
      } else {
        // Zum nächsten Spiel wechseln oder zurück zum Menü, wenn alle beantwortet
        console.log('Moving to next game or menu');
        handleNextGame();
      }
    }
  };
  
  const handleNextGame = () => {
    setSelectedNumber('');
    if (selectedGameIndex < pendingGames.length - 1) {
      setSelectedGameIndex(prev => prev + 1);
    } else {
      navigateTo('menu');
    }
  };
  
  // Wenn das Ergebnis angezeigt wird
  if (showResult) {
    return (
      <Round2ResultModal
        game={gameToUse}
        onClose={handleNextGame}
      />
    );
  }
  
  console.log('Round2Response rendering UI with lowestRound1Number =', lowestRound1Number);

  const headline = `Runde 2: Wähle eine Zahl zwischen 1 und ${lowestRound1Number}`;

  // Extract Round 1 numbers for display
  const getPlayerRound1Number = (): number | null => {
    if (!gameToUse.runde1_zahlen || !currentPlayer) return null;
    const playerNumber = gameToUse.runde1_zahlen.find(z => z.spieler_id === currentPlayer.id);
    return playerNumber ? playerNumber.zahl : null;
  };
  
  const getOpponentRound1Number = (): number | null => {
    if (!gameToUse.runde1_zahlen || !currentPlayer) return null;
    const opponentNumber = gameToUse.runde1_zahlen.find(z => z.spieler_id !== currentPlayer.id);
    return opponentNumber ? opponentNumber.zahl : null;
  };
  
  const playerRound1Number = getPlayerRound1Number();
  const opponentRound1Number = getOpponentRound1Number();
  
  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Versus display for Round 1 numbers */}
        <div className="bg-schnicken-dark p-4 rounded-lg">
          <h3 className="text-schnicken-light text-center mb-3 font-bold">Zahlen aus Runde 1</h3>
          <div className="flex justify-between items-center">
            <div className="flex-1 text-center">
              <p className="text-schnicken-light/80 text-sm mb-1">Du</p>
              <div className="bg-schnicken-primary rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                <span className="text-schnicken-darkest text-2xl font-bold">{playerRound1Number}</span>
              </div>
            </div>
            
            <div className="mx-4 text-schnicken-light/50">
              <span className="text-xl font-bold">VS</span>
            </div>
            
            <div className="flex-1 text-center">
              <p className="text-schnicken-light/80 text-sm mb-1">{otherPlayerName}</p>
              <div className="bg-schnicken-accent rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                <span className="text-schnicken-darkest text-2xl font-bold">{opponentRound1Number}</span>
              </div>
            </div>
          </div>
          
          <p className="text-schnicken-light text-sm italic text-center mt-4">
            {isSchnicker
              ? `Bei gleichen Zahlen ist es ein Eigentor und du musst deine eigene Aufgabe erfüllen!`
              : `Bei gleichen Zahlen ist es ein Eigentor und ${otherPlayerName} muss die Aufgabe selbst erfüllen!`}
          </p>
        </div>
        
        {/* Number selection */}
        <div>
          <h3 className="font-medium text-lg mb-2 text-schnicken-light">Wähle deine Zahl für Runde 2</h3>
          <p className="text-schnicken-light/80 mb-3">
            Du kannst eine Zahl zwischen 1 und {lowestRound1Number} wählen.
          </p>
          
          {/* Regular number input field - matching Round 1 style */}
          <div className="mb-4">
            <input
              type="number"
              min={1}
              max={lowestRound1Number}
              value={selectedNumber}
              onChange={(e) => setSelectedNumber(e.target.value)}
              className="w-full p-4 bg-schnicken-dark text-black font-bold rounded-lg text-xl text-center"
              placeholder={`1-${lowestRound1Number}`}
              disabled={isUpdating}
            />

          </div>
        </div>
        
        {/* Debug info */}
        <details className="mb-2 text-xs bg-schnicken-dark/50 p-2 rounded-md">
          <summary className="cursor-pointer text-schnicken-light/60">Debug Info</summary>
          <div className="text-schnicken-light/70 mt-1 space-y-1">
            <p>Game Status: {gameToUse.status}</p>
            <p>Runde 1 Zahlen: {JSON.stringify(gameToUse.runde1_zahlen || [])}</p>
            <p>Runde 2 Zahlen: {JSON.stringify(gameToUse.runde2_zahlen || [])}</p>
            <p>Lowest Round 1: {lowestRound1Number}</p>
            <p>Selected Number: {selectedNumber}</p>
          </div>
        </details>
        
        <ActionButton
          onClick={handleConfirm}
          type="submit"
          className="w-full py-3 text-lg"
          disabled={isUpdating || 
            !selectedNumber || 
            parseInt(selectedNumber) < 1 || 
            parseInt(selectedNumber) > lowestRound1Number
          }
        >
          {isUpdating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-schnicken-light mx-auto"></div>
          ) : (
            'Weiter'
          )}
        </ActionButton>
      </div>
    </FullScreenLayout>
  );
};
