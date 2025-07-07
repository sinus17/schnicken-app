import React, { useState, useEffect } from 'react';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { FormInput } from './ui/FormInput';
import { ActionButton } from './ui/ActionButton';
import { useGame, type GameWithPlayers } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';
import { usePlayer } from '../contexts/PlayerContext';
import { SchnickerRound1ResultModal } from './SchnickerRound1ResultModal';

export const SchnickerResponse: React.FC = () => {
  console.log('RENDERING SCHNICKER RESPONSE COMPONENT');
  const { currentPlayer } = usePlayer();
  const { activeGames, submitZahl, refreshGames } = useGame();
  const { navigateTo } = useAppState();
  
  const [selectedNumber, setSelectedNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultGame, setResultGame] = useState<GameWithPlayers | null>(null);
  
  // Filter für offene Spiele, bei denen der aktuelle Spieler der Schnicker ist,
  // das Spiel einen Bock-Wert hat, aber der Schnicker noch keine Zahl für Runde 1 eingegeben hat
  const pendingGames = activeGames ? activeGames.filter(game => 
    game.schnicker.id === currentPlayer?.id && 
    game.status === 'offen' &&
    game.bock_wert !== null &&
    !game.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
  ) : [];

  const currentGame = pendingGames[selectedGameIndex];
  
  // Debug-Info für das aktuelle Spiel
  useEffect(() => {
    console.log('SchnickerResponse - Verfügbare Spiele:', pendingGames.length);
    console.log('SchnickerResponse - Aktuelles Spiel:', currentGame);
    console.log('SchnickerResponse - Current Player:', currentPlayer);
  }, [pendingGames, currentGame, currentPlayer]);
  
  if (!pendingGames.length) {
    console.log('SchnickerResponse - Keine pendingGames gefunden, Komponente wird nicht gerendert');
    return null;
  }
  
  // Wenn das Ergebnis angezeigt werden soll
  if (showResult && resultGame) {
    return (
      <SchnickerRound1ResultModal
        game={resultGame}
        onClose={() => {
          setShowResult(false);
          setResultGame(null);
          
          // Zum nächsten Spiel wechseln oder zurück zum Menü, wenn alle beantwortet
          if (selectedGameIndex < pendingGames.length - 1) {
            console.log('Wechsle zum nächsten Spiel');
            setSelectedGameIndex(prev => prev + 1);
            setSelectedNumber('');
          } else {
            console.log('Navigiere zum Menü');
            navigateTo('menu');
          }
        }}
      />
    );
  }

  const handleConfirm = async () => {
    if (!currentGame || !selectedNumber) {
      console.log('Kann nicht bestätigen: kein Spiel oder keine Zahl', {currentGame, selectedNumber});
      return;
    }
    
    const parsedNumber = parseInt(selectedNumber);
    if (parsedNumber < 1 || parsedNumber > (currentGame.bock_wert || 17)) {
      console.log('Ungültige Eingabe', {parsedNumber, maxValue: currentGame.bock_wert});
      return; // Ungültige Eingabe
    }
    
    setIsUpdating(true);
    console.log('Sende Zahl', {zahl: parsedNumber, spieler: currentPlayer?.id, spiel: currentGame.id});
    
    try {
      // Submitte die Zahl für Runde 1, mit direkter Übergabe des aktuellen Spiels
      const success = await submitZahl(parsedNumber, 1, currentGame);
      console.log('Ergebnis des Speicherns:', {success});
      
      if (success) {
        // Nach erfolgreicher Speicherung die Spiele aktualisieren
        await refreshGames();
        
        // Aktualisiertes Spiel aus dem Context holen
        const updatedGame = activeGames.find(g => g.id === currentGame.id);
        
        if (updatedGame) {
          // Zeige immer das Ergebnis an, unabhängig vom Status
          setResultGame(updatedGame);
          setShowResult(true);
          return; // Frühzeitig beenden, Rest wird nach Schließen des Modals erledigt
        }
      }
      
      // Falls success bereits vorher behandelt wurde und das Modal angezeigt wird
      if (!showResult) {
        if (success) {
          setSelectedNumber('');
          
          // Zum nächsten Spiel wechseln oder zurück zum Menü, wenn alle beantwortet
          if (selectedGameIndex < pendingGames.length - 1) {
            console.log('Wechsle zum nächsten Spiel');
            setSelectedGameIndex(prev => prev + 1);
          } else {
            console.log('Navigiere zum Menü');
            navigateTo('menu');
          }
        } else {
          console.log('Speichern fehlgeschlagen');
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const headline = <>
    {currentGame.angeschnickter.name} hat {currentGame.bock_wert} Bock auf <span style={{ color: '#ffbb00' }}>{currentGame.aufgabe}</span>. Wie lautet deine Zahl?
  </>

  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={headline}
    >
      <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
        <div className="space-y-2">
          <FormInput
            value={selectedNumber}
            onChange={(value) => setSelectedNumber(value)}
            placeholder={`1-${currentGame.bock_wert}`}
            autoFocus
            type="number"
          />
        </div>
        
        <ActionButton
          onClick={handleConfirm}
          type="submit"
          className="w-full py-3 text-lg"
          disabled={isUpdating || 
            !selectedNumber || 
            parseInt(selectedNumber) < 1 || 
            parseInt(selectedNumber) > (currentGame.bock_wert || 17)
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
