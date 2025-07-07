import React, { useState, useEffect } from 'react';
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
  const { activeGames, updateBockWert, submitZahl, refreshGames, selectGame } = useGame();
  const { navigateTo } = useAppState();

  // Eingabe-Werte
  const [bockWert, setBockWert] = useState<string>('');
  const [selectedNumber, setSelectedNumber] = useState<string>('');

  // UI-Status
  const [isUpdating, setIsUpdating] = useState(false);
  const [savedBockWertUI, setSavedBockWertUI] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultGame, setResultGame] = useState<GameWithPlayers | null>(null);

  // Beim ersten Laden Spieldaten aktualisieren
  useEffect(() => {
    refreshGames();
  }, []);

  // Offene Spiele des aktuellen Spielers finden
  const openGames = activeGames?.filter(game => 
    game.angeschnickter.id === currentPlayer?.id && 
    game.status === 'offen'
  ) || [];

  // Aktuelles Spiel = erstes offenes Spiel
  const localGame = openGames[0];
  
  // Stellen sicher, dass das Spiel auch im GameContext gesetzt ist
  useEffect(() => {
    if (localGame && selectGame) {
      console.log('Setze aktuelles Spiel im GameContext:', localGame.id);
      selectGame(localGame);
    }
  }, [localGame, selectGame]);

  // Debugging-Log
  useEffect(() => {
    console.log('--- PendingResponse Status ---');
    console.log('Offene Spiele:', openGames.length);
    console.log('Aktuelles Spiel:', localGame?.id || 'keins');
    console.log('Bock-Wert UI:', savedBockWertUI);
    console.log('Eingabe Bock-Wert:', bockWert);
    console.log('Eingabe Zahl:', selectedNumber);
  }, [openGames, localGame, savedBockWertUI, bockWert, selectedNumber]);

  // Falls kein aktuelles Spiel gefunden wird, navigiere zum Menü
  useEffect(() => {
    if (!localGame && !isUpdating) {
      console.log('Kein passendes Spiel gefunden, navigiere zum Menü.');
      navigateTo('menu');
    }
  }, [localGame, navigateTo, isUpdating]);

  // Button-Handler
  const handleSubmit = async () => {
    if (!localGame) return;

    setIsUpdating(true);

    try {
      // Erster Schritt: Bock-Wert speichern
      if (!savedBockWertUI) {
        const parsedBockWert = parseInt(bockWert);
        if (isNaN(parsedBockWert) || parsedBockWert < 1) return;

        console.log('Speichere Bock-Wert:', parsedBockWert);

        const success = await updateBockWert(localGame.id, parsedBockWert);
        if (success) {
          console.log('Bock-Wert erfolgreich gespeichert');
          setSavedBockWertUI(parsedBockWert); // UI-Update für Schritt 2
          setBockWert(''); // Eingabefeld leeren

          // Daten im Hintergrund aktualisieren
          setTimeout(() => {
            refreshGames();
          }, 300);
        }
      } 
      // Zweiter Schritt: Zahl für Runde 1 einreichen
      else {
        const parsedNumber = parseInt(selectedNumber);
        if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > savedBockWertUI) return;

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
            setSavedBockWertUI(null);
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
          setSavedBockWertUI(null);
          navigateTo('menu');
        }}
      />
    );
  }

  // Dynamische Überschrift je nach aktuellem Schritt
  const headline = !savedBockWertUI
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
          {/* Bock-Wert Eingabe - nur anzeigen wenn noch nicht gespeichert */}
          {!savedBockWertUI && (
            <FormInput
              value={bockWert}
              onChange={(value) => setBockWert(value)}
              placeholder="Bock-Wert (1-17)"
              autoFocus
              type="number"
            />
          )}
          
          {/* Zahlen-Eingabe für Runde 1 - immer anzeigen, aber nur wenn Bock-Wert gesetzt ist aktivieren */}
          {savedBockWertUI && (
            <div className="flex flex-col">
              <FormInput
                value={selectedNumber}
                onChange={(value) => setSelectedNumber(value)}
                placeholder={`Zahl (1-${savedBockWertUI})`}
                autoFocus
                type="number"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <ActionButton
            disabled={isUpdating || (!savedBockWertUI ? !bockWert : !selectedNumber)}
            onClick={handleSubmit}
          >
            {!savedBockWertUI ? 'Antworten' : 'Zahl einreichen'}
          </ActionButton>
          

        </div>
      </div>
    </FullScreenLayout>
  );
};
