import React, { useState, useEffect, useRef } from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { FormInput } from './ui/FormInput';
import { ActionButton } from './ui/ActionButton';
import { useGame, type GameWithPlayers } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';
import { usePlayer } from '../contexts/PlayerContext';
import { AngeschnickterRound1ResultModal } from './AngeschnickterRound1ResultModal';

/**
 * Komponente zur Antwort des angeschnickten Spielers:
 * 1. Bock-Wert eingeben
 * 2. Zahl für Runde 1 wählen
 * 
 * Vereinfachter Flow: Beide Eingaben werden direkt nacheinander angezeigt
 */
export const PendingResponse: React.FC = () => {
  console.log('RENDERING PENDING RESPONSE COMPONENT');
  const { currentPlayer } = usePlayer();
  const { activeGames, updateBockWert, submitZahl, refreshGames, selectGame, actionType } = useGame();
  const { navigateTo } = useAppState();

  // Eingabe-Werte
  const [bockWert, setBockWert] = useState<string>('');
  const [selectedNumber, setSelectedNumber] = useState<string>('');

  // UI-Status
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultGame, setResultGame] = useState<GameWithPlayers | null>(null);

  // Beim ersten Laden Spieldaten aktualisieren
  useEffect(() => {
    refreshGames();
  }, []);

  // Offene Spiele des aktuellen Spielers finden
  const openGames = activeGames?.filter(game => {
    // Check both game.angeschnickter_id and game.angeschnickter.id to ensure we catch all cases
    const isAngeschnickter = 
      (game.angeschnickter_id === currentPlayer?.id) || 
      (game.angeschnickter?.id === currentPlayer?.id);
    
    // Check if player is schnicker (might need to enter round 1 number)
    const isSchnicker = 
      (game.schnicker_id === currentPlayer?.id) || 
      (game.schnicker?.id === currentPlayer?.id);
    
    const isPlayerInGame = isAngeschnickter || isSchnicker;
    
    // Check if player has submitted round 1 number
    const hasSubmittedR1 = game.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id);
    
    // Game is relevant if:
    // 1. Player is angeschnickter and game is 'offen' (needs bock value)
    // 2. Player is in game and game is 'runde1' and player hasn't submitted round 1 number
    const shouldShow = 
      (isAngeschnickter && game.status === 'offen') ||
      (isPlayerInGame && game.status === 'runde1' && !hasSubmittedR1);
    
    console.log('PendingResponse: Checking game', {
      gameId: game.id,
      currentPlayerId: currentPlayer?.id,
      angeschnickter_id: game.angeschnickter_id,
      angeschnickter: game.angeschnickter?.id,
      isAngeschnickter,
      isSchnicker,
      isPlayerInGame,
      status: game.status,
      bock_wert: game.bock_wert,
      hasSubmittedR1,
      shouldShow
    });
    
    return shouldShow;
  }) || [];

  // Aktuelles Spiel = erstes offenes Spiel
  const localGame = openGames[0];
  
  // Stellen sicher, dass das Spiel auch im GameContext gesetzt ist
  useEffect(() => {
    if (localGame && selectGame) {
      console.log('Setze aktuelles Spiel im GameContext:', localGame.id);
      selectGame(localGame);
    }
  }, [localGame, selectGame]);

  // Determine current step based on actual game data and player role
  const isAngeschnickter = localGame && (
    (localGame.angeschnickter_id === currentPlayer?.id) || 
    (localGame.angeschnickter?.id === currentPlayer?.id)
  );
  const isSchnicker = localGame && (
    (localGame.schnicker_id === currentPlayer?.id) || 
    (localGame.schnicker?.id === currentPlayer?.id)
  );
  
  const hasBockWert = localGame?.bock_wert !== null && localGame?.bock_wert !== undefined;
  const currentBockWert = localGame?.bock_wert;
  
  // If player is schnicker, they don't need to enter bock value, only round 1 number
  const needsBockValue = isAngeschnickter && !hasBockWert;
  const needsRound1Number = localGame?.status === 'runde1' && !localGame?.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id);

  // Debugging-Log
  useEffect(() => {
    console.log('--- PendingResponse Status ---');
    console.log('Offene Spiele:', openGames.length);
    console.log('Aktuelles Spiel:', localGame?.id || 'keins');
    console.log('Spieler Rolle:', { isAngeschnickter, isSchnicker });
    console.log('Bock-Wert aus DB:', currentBockWert);
    console.log('Hat Bock-Wert:', hasBockWert);
    console.log('Braucht Bock-Wert:', needsBockValue);
    console.log('Braucht Runde 1 Zahl:', needsRound1Number);
    console.log('Eingabe Bock-Wert:', bockWert);
    console.log('Eingabe Zahl:', selectedNumber);
  }, [openGames, localGame, currentBockWert, hasBockWert, needsBockValue, needsRound1Number, bockWert, selectedNumber, isAngeschnickter, isSchnicker]);

  // Force refresh games when the component mounts to ensure we have the latest data
  // but only do this once using a ref to prevent infinite loops
  const initialRefreshDone = useRef(false);
  
  useEffect(() => {
    if (!initialRefreshDone.current) {
      console.log('PendingResponse: Initial refreshGames to ensure latest data');
      initialRefreshDone.current = true;
      refreshGames();
    }
  }, [refreshGames]);

  // We'll use a ref to track navigation state to prevent multiple navigation attempts
  const navigationAttempted = React.useRef(false);
  
  // Falls kein aktuelles Spiel gefunden wird, navigiere zum Menü, aber nur wenn keine Aktion erforderlich ist
  useEffect(() => {
    // Only navigate away if there's no game AND we're sure no action is required AND we haven't navigated already
    if (!localGame && !isUpdating && !navigationAttempted.current) {
      console.log('PendingResponse: Checking if navigation is needed...');
      
      // Check if we were shown because of an explicit action requirement
      // If we were, then DON'T navigate away even if no game is found
      // Also check if bockWert is null (meaning we need to input it)
      const isInputInProgress = bockWert !== '' || selectedNumber !== '';
      const shouldStayForAction = actionType === 'bock_input_needed' || 
                                isInputInProgress || 
                                (openGames && openGames.some(g => g.bock_wert === null));
      
      if (shouldStayForAction) {
        console.log('PendingResponse: Action required, staying on this screen despite no game found.');
        // If we're staying because of an action requirement, don't keep refreshing - just once
        if (!initialRefreshDone.current) {
          console.log('PendingResponse: Refreshing games once for action requirement');
          initialRefreshDone.current = true;
          refreshGames();
        }
      } else {
        // Set the flag before navigating to prevent multiple attempts
        navigationAttempted.current = true;
        console.log('PendingResponse: Kein aktives Spiel gefunden und keine Aktion erforderlich, navigiere zum Menü');
        setTimeout(() => navigateTo('menu'), 100); // Small delay to prevent race conditions
      }
    } else if (localGame) {
      // Reset navigation flag if we have a game
      navigationAttempted.current = false;
    }
  }, [localGame, navigateTo, isUpdating, actionType, refreshGames]);

  // Button-Handler
  const handleSubmit = async () => {
    if (!localGame) return;

    setIsUpdating(true);

    try {
      // Erster Schritt: Bock-Wert speichern (nur für Angeschnickter)
      if (needsBockValue) {
        const parsedBockWert = parseInt(bockWert);
        if (isNaN(parsedBockWert) || parsedBockWert < 1) return;

        console.log('Speichere Bock-Wert:', parsedBockWert);

        const success = await updateBockWert(localGame.id, parsedBockWert);
        if (success) {
          console.log('Bock-Wert erfolgreich gespeichert');
          setBockWert(''); // Eingabefeld leeren

          // Daten im Hintergrund aktualisieren
          setTimeout(() => {
            refreshGames();
          }, 300);
        }
      } 
      // Zweiter Schritt: Zahl für Runde 1 einreichen (für beide Spieler)
      else if (needsRound1Number) {
        const parsedNumber = parseInt(selectedNumber);
        if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > currentBockWert!) return;

        console.log('Reiche Zahl ein:', parsedNumber);

        const success = await submitZahl(parsedNumber, 1);
        if (success) {
          console.log('Zahl erfolgreich eingereicht');
          
          // Nach erfolgreicher Speicherung die Spiele aktualisieren
          await refreshGames(); // Spiele aktualisieren, um die aktuelle Spielsituation zu bekommen
          
          // Aktualisiertes Spiel aus dem Context holen
          const updatedGame = activeGames?.find(g => g.id === localGame.id);
          
          if (updatedGame) {
            // Immer das Ergebnis anzeigen, unabhängig davon ob der Schnicker schon seine Zahl eingegeben hat
            setResultGame(updatedGame);
            setShowResult(true);
            return; // Frühzeitig beenden, Rest wird nach Schließen des Modals erledigt
          } else {
            // Fallback: Zurück zum Menü
            setSelectedNumber('');
            navigateTo('menu');
          }
        }
      }
    } catch (error) {
      console.error('Fehler bei der Verarbeitung:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Falls kein Spiel mehr da ist, nichts anzeigen
  if (!localGame) {
    return null;
  }
  
  // Wenn das Ergebnis angezeigt werden soll
  if (showResult && resultGame) {
    return (
      <AngeschnickterRound1ResultModal
        game={resultGame}
        onClose={() => {
          setShowResult(false);
          setResultGame(null);
          setSelectedNumber('');
          navigateTo('menu');
        }}
      />
    );
  }

  // Dynamische Überschrift je nach aktuellem Schritt
  const headline = needsBockValue
    ? <>
        {currentPlayer?.name}, wie viel Bock hast Du, <span style={{ color: '#ffbb00' }}>{localGame.aufgabe}</span>?
      </>
    : `Wie lautet deine Zahl?`;

  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
        <div className="space-y-4">
          {/* Bock-Wert Eingabe - nur für Angeschnickter und nur wenn noch nicht gespeichert */}
          {needsBockValue && (
            <FormInput
              value={bockWert}
              onChange={(value) => setBockWert(value)}
              placeholder="Bock-Wert (1-17)"
              autoFocus
              type="number"
            />
          )}
          
          {/* Zahlen-Eingabe für Runde 1 - nur wenn Spieler eine Zahl eingeben muss */}
          {needsRound1Number && currentBockWert && (
            <div className="flex flex-col">
              <FormInput
                value={selectedNumber}
                onChange={(value) => setSelectedNumber(value)}
                placeholder={`Zahl (1-${currentBockWert})`}
                autoFocus
                type="number"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <ActionButton
            disabled={isUpdating || (needsBockValue ? !bockWert : !selectedNumber)}
            onClick={handleSubmit}
          >
            {needsBockValue ? 'Antworten' : 'Zahl einreichen'}
          </ActionButton>
          

        </div>
      </div>
    </FullScreenLayout>
  );
};
