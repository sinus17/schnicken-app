import './index.css'
import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Kontext-Provider
import { AppStateProvider, useAppState } from './contexts/AppStateContext'
import { PlayerProvider } from './contexts/PlayerContext'
import { GameProvider, useGame, type GameWithPlayers } from './contexts/GameContext'
import { usePlayer } from './contexts/PlayerContext'

// Komponenten
import { PlayerSelect } from './components/PlayerSelect'
import { MainMenu } from './components/MainMenu'
import { CreateGame } from './components/CreateGame'
import { Game } from './components/Game'
import { History } from './components/History'
import { AllSchnicks } from './components/AllSchnicks'
import { PendingResponse } from './components/PendingResponse'
import { SchnickerResponse } from './components/SchnickerResponse'
import { Round2Response } from './components/Round2Response'
import { Round1ResultModal } from './components/Round1ResultModal'
import { Round1CompletedResultModal } from './components/Round1CompletedResultModal'
// Debug components removed from production

// Wrapper Komponente, die offene Spiele prüft und entsprechende Aktionsscreens anzeigt
const GameResponseWrapper = ({ children }: { children: ReactNode }) => {
  // Extract all game-related hooks at the top level to avoid conditional hook errors
  const { activeGames, finishedGames, currentGame, refreshGames } = useGame();
  const { currentPlayer } = usePlayer();
  const [showRound1Result, setShowRound1Result] = useState(false);
  const [round1ResultGame, setRound1ResultGame] = useState<GameWithPlayers | null>(null);
  const [showRound1CompletedResult, setShowRound1CompletedResult] = useState(false);
  const [round1CompletedResultGame, setRound1CompletedResultGame] = useState<GameWithPlayers | null>(null);

  // Spieler ist angeschnickt und muss entweder Bock-Wert oder Zahl setzen
  const hasPendingResponses = activeGames?.some(game => 
    game.angeschnickter.id === currentPlayer?.id && 
    game.status === 'offen' && (
      // Fall 1: Bock-Wert noch nicht gesetzt
      game.bock_wert === null ||
      // Fall 2: Bock-Wert gesetzt, aber noch keine Zahl für Runde 1 eingegeben
      (game.bock_wert !== null && !game.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id))
    )
  );
  
  console.log('PENDING RESPONSE CHECK:', activeGames?.map(game => ({
    id: game.id,
    angeschnickter: game.angeschnickter.id === currentPlayer?.id,
    status: game.status,
    bock_wert: game.bock_wert,
    hat_zahl: game.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id),
    zeige_component: game.angeschnickter.id === currentPlayer?.id && 
                    game.status === 'offen' && 
                    (game.bock_wert === null || 
                    (game.bock_wert !== null && !game.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id)))
  })));
  
  console.log('DEBUG ROUTING:', { 
    currentPlayerId: currentPlayer?.id,
    isAngeschnickter: activeGames?.some(g => g.angeschnickter.id === currentPlayer?.id),
    isSchnicker: activeGames?.some(g => g.schnicker.id === currentPlayer?.id),
    hasPendingResponses,
    games: activeGames?.map(g => ({ 
      id: g.id, 
      angeschnickter: g.angeschnickter.id, 
      schnicker: g.schnicker.id,
      status: g.status,
      bock_wert: g.bock_wert
    }))
  });
  
  // Spieler ist Schnicker und muss seine Zahl für Runde 1 eingeben
  const hasPendingSchnickerResponses = activeGames?.some(game => 
    game.schnicker.id === currentPlayer?.id && 
    game.status === 'offen' &&
    game.bock_wert !== null &&
    !game.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
  );

  // Spieler muss eine Zahl für Runde 2 eingeben
  const hasRound2Responses = activeGames?.some(game => 
    game.status === 'runde2' &&
    !game.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
  );
  
  // Debug für Runde 2 Logik
  console.log('ROUND 2 CHECK:', { 
    currentPlayerId: currentPlayer?.id,
    hasRound2Responses,
    currentGame: currentGame ? {
      id: currentGame.id,
      status: currentGame.status,
      runde2_zahlen: currentGame.runde2_zahlen
    } : null,
    games: activeGames?.map(g => ({ 
      id: g.id, 
      status: g.status,
      shouldShow: g.status === 'runde2' && !g.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
    }))
  });

  // Prüfen, ob der Schnick sich umgedreht hat (Zahlen in Runde 1 unterschiedlich)
  const hasRound1ResultsToShow = activeGames?.some(game => 
    game.status === 'runde2' && 
    game.runde1_zahlen && 
    game.runde1_zahlen.length === 2 && 
    !game.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id) &&
    !showRound1Result
  );
  
  // Prüfen, ob es ein abgeschlossenes Spiel gibt, bei dem beide Spieler die gleiche Zahl in Runde 1 gewählt haben
  const hasCompletedRound1ResultsToShow = activeGames?.some(game => 
    game.status === 'beendet' &&
    game.ergebnis === 'angeschnickter' &&
    game.runde1_zahlen && 
    game.runde1_zahlen.length === 2 && 
    // Beide Zahlen gleich prüfen
    game.runde1_zahlen[0].zahl === game.runde1_zahlen[1].zahl &&
    !showRound1CompletedResult
  );

  // Finde das Spiel, für das ein Runde 1 Ergebnis angezeigt werden soll
  useEffect(() => {
    if (hasRound1ResultsToShow && activeGames && !showRound1Result) {
      const game = activeGames.find(game => 
        game.status === 'runde2' && 
        game.runde1_zahlen && 
        game.runde1_zahlen.length === 2 &&
        !game.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
      );
      
      if (game) {
        setRound1ResultGame(game);
        setShowRound1Result(true);
      }
    }
  }, [activeGames, hasRound1ResultsToShow, currentPlayer?.id, showRound1Result]);
  
  // Finde das Spiel, für das ein abgeschlossenes Runde 1 Ergebnis angezeigt werden soll
  useEffect(() => {
    if (hasCompletedRound1ResultsToShow && (activeGames || finishedGames) && !showRound1CompletedResult) {
      // Check both active and finished games since completed games move to finishedGames
      const allGames = [...(activeGames || []), ...(finishedGames || [])];
      const game = allGames.find(game => 
        game.status === 'beendet' &&
        game.ergebnis === 'angeschnickter' &&
        game.runde1_zahlen && 
        game.runde1_zahlen.length === 2 &&
        // Beide Zahlen gleich prüfen
        game.runde1_zahlen[0].zahl === game.runde1_zahlen[1].zahl &&
        // Only show for games where current player is involved
        (game.schnicker?.id === currentPlayer?.id || game.angeschnickter?.id === currentPlayer?.id)
      );
      
      if (game) {
        console.log('Showing Round1CompletedResult for game:', game.id, 'Result:', game.ergebnis);
        setRound1CompletedResultGame(game);
        setShowRound1CompletedResult(true);
      }
    }
  }, [activeGames, finishedGames, hasCompletedRound1ResultsToShow, currentPlayer?.id, showRound1CompletedResult]);

  // Wenn abgeschlossenes Runde 1 Ergebnis (gleiche Zahlen) angezeigt werden soll
  if (showRound1CompletedResult && round1CompletedResultGame) {
    const isSchnicker = currentPlayer?.id === round1CompletedResultGame.schnicker.id;
    const otherPlayerName = isSchnicker 
      ? round1CompletedResultGame.angeschnickter.name 
      : round1CompletedResultGame.schnicker.name;
      
    return (
      <Round1CompletedResultModal
        game={round1CompletedResultGame}
        isSchnicker={isSchnicker}
        otherPlayerName={otherPlayerName}
        onClose={() => {
          setShowRound1CompletedResult(false);
          setRound1CompletedResultGame(null);
        }}
      />
    );
  }
  
  // Wenn Runde 1 Ergebnis angezeigt werden soll (unterschiedliche Zahlen)
  if (showRound1Result && round1ResultGame) {
    // Determine if the current player is the schnicker or angeschnickter
    const isSchnicker = round1ResultGame.schnicker.id === currentPlayer?.id;
    const otherPlayerName = isSchnicker 
      ? round1ResultGame.angeschnickter.name 
      : round1ResultGame.schnicker.name;
    
    return (
      <Round1ResultModal
        game={round1ResultGame}
        isSchnicker={isSchnicker}
        otherPlayerName={otherPlayerName}
        onClose={async () => {
          // Force refresh games to make sure we have the latest status
          if (!isSchnicker) {
            await refreshGames();
          }
          setShowRound1Result(false);
          setRound1ResultGame(null);
        }}
      />
    );
  }
  
  // Check for active game explicitly selected from SchnickHistory
  if (currentGame && currentGame.status !== 'beendet') {
    console.log('Selected game details:', {
      id: currentGame.id,
      status: currentGame.status,
      isAngeschnickter: currentGame.angeschnickter.id === currentPlayer?.id,
      isSchnicker: currentGame.schnicker.id === currentPlayer?.id,
      bock_wert: currentGame.bock_wert,
      runde1_zahlen: currentGame.runde1_zahlen,
      runde2_zahlen: currentGame.runde2_zahlen,
    });

    // Priority check for Round 2 responses first
    if (currentGame.status === 'runde2' &&
        currentPlayer &&
        !currentGame.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id)) {
      console.log('Showing Round2Response for game:', currentGame.id);
      console.log('Round2 condition check:', {
        status: currentGame.status === 'runde2',
        playerHasResponse: currentGame.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
      });
      return <Round2Response forceShow={true} />;
    }
    
    // For angeschnickter who needs to set Bock-Wert or number in Round 1
    if (currentGame.angeschnickter.id === currentPlayer?.id && 
        currentGame.status === 'offen' && 
        (currentGame.bock_wert === null || 
         (currentGame.bock_wert !== null && !currentGame.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id)))) {
      return <PendingResponse />;
    }
    
    // For schnicker who needs to set number in Round 1
    if (currentGame.schnicker.id === currentPlayer?.id && 
        currentGame.status === 'offen' &&
        currentGame.bock_wert !== null &&
        !currentGame.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id)) {
      return <SchnickerResponse />;
    }
  }
  
  // General cases when no specific game is selected or the selected game doesn't need action
  if (hasPendingResponses) {
    // Angeschnickter muss Bock-Wert und Zahl setzen
    return <PendingResponse />;
  } else if (hasPendingSchnickerResponses) {
    // Schnicker muss seine Zahl für Runde 1 setzen
    return <SchnickerResponse />;
  } else if (hasRound2Responses) {
    // Spieler muss Zahl für Runde 2 setzen
    return <Round2Response />;
  }
  
  // Ansonsten normalen Inhalt anzeigen
  return <>{children}</>;
};

// Hauptansicht wählen basierend auf dem AppState
const AppContent = () => {
  const { currentView, navigateTo } = useAppState();
  const { currentGame } = useGame();
  const { currentPlayer } = usePlayer();
  
  // Check if we need to show Round2Response and force view to menu
  // This helps ensure we always show the appropriate response component when needed
  React.useEffect(() => {
    if (currentGame && 
        currentGame.status === 'runde2' && 
        !currentGame.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id) &&
        currentView !== 'menu') {
      console.log('Forcing view to menu to show Round2Response');
      navigateTo('menu');
    }
  }, [currentGame, currentPlayer, currentView, navigateTo]);
  
  // Inhaltskomponente basierend auf der aktuellen Ansicht
  const ViewComponent = () => {
    switch (currentView) {
      case 'player-select':
        return <PlayerSelect />
      case 'menu':
        return <MainMenu />
      case 'create-game':
        return <CreateGame />
      case 'game':
        return <Game />
      case 'history':
        return <History />
      case 'schnicks':
        return <AllSchnicks />
      default:
        return <PlayerSelect />
    }
  };
  
  // Wickle den Inhalt in den GameResponseWrapper
  return (
    <GameResponseWrapper>
      <ViewComponent />
    </GameResponseWrapper>
  );
}

function App() {
  return (
    <AppStateProvider>
      <PlayerProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </PlayerProvider>
    </AppStateProvider>
  )
}

export default App
