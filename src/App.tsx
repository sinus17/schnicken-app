import './index.css'
import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Kontext-Provider
import { AuthProvider } from './contexts/AuthContext'
import { AppStateProvider, useAppState } from './contexts/AppStateContext'
import { PlayerProvider } from './contexts/PlayerContext'
import { GameProvider, useGame, type GameWithPlayers } from './contexts/GameContext'
import { usePlayer } from './contexts/PlayerContext'

// Auth Components
import { PrivateRoute } from './components/PrivateRoute'

// Komponenten
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
// AutoRefreshHandler removed to prevent duplicate Supabase instances
// Debug components removed from production

// Wrapper Komponente, die offene Spiele prüft und entsprechende Aktionsscreens anzeigt
const GameResponseWrapper = ({ children }: { children: ReactNode }) => {
  // Extract all game-related hooks at the top level to avoid conditional hook errors
  const { activeGames, finishedGames, currentGame, refreshGames, actionRequired, actionType } = useGame();
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
  
  // These checks are now handled by the needsRound1Input and needsRound2Input variables
  // in the GameResponseWrapper component
  
  // Debug für Runde 2 Logik
  console.log('ROUND 2 CHECK:', { 
    currentPlayerId: currentPlayer?.id,
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
  // This section should take priority over other checks - we handle required actions immediately
  // We also need to check for games that need input, even if actionRequired flag isn't set
  const needsBockInput = activeGames?.some(g => 
    g.angeschnickter?.id === currentPlayer?.id && 
    g.status === 'offen' && 
    g.bock_wert === null
  );
  
  const needsRound1Input = activeGames?.some(g => 
    g.status === 'runde1' || 
    (g.status === 'offen' && g.bock_wert !== null && 
     !g.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id))
  );
  
  const needsRound2Input = activeGames?.some(g => 
    g.status === 'runde2' && 
    !g.runde2_zahlen?.some(z => z.spieler_id === currentPlayer?.id)
  );
  
  console.log(`GameResponseWrapper: Action checks - required:${actionRequired}, type:${actionType}, bockInput:${needsBockInput}, round1:${needsRound1Input}, round2:${needsRound2Input}`);
  
  if (actionRequired || needsBockInput || needsRound1Input || needsRound2Input) {
    console.log(`GameResponseWrapper: Rendering response for required action`);
    
    // Use React.memo and stable keys to prevent unnecessary re-renders
    // and optimize component mounts/unmounts
    
    // Handle different action types based on the detection in GameContext
    // Priority: bock_input > round1 > round2
    if (actionType === 'bock_input_needed' || needsBockInput) {
      // Skip other checks and immediately render PendingResponse
      console.log('GameResponseWrapper: Rendering bock_input_needed screen');
      return <PendingResponse key="action-bock-input" />;
    } 
    else if (actionType === 'round1_input_needed' || needsRound1Input) {
      // Check if user is schnicker or angeschnickter to show appropriate screen
      const isSchnicker = activeGames?.some(g => {
        const statusCheck = g.status === 'runde1' || g.status === 'offen';
        const schnickerCheck = g.schnicker?.id === currentPlayer?.id;
        const bockWertCheck = g.bock_wert !== null;
        const noRunde1ZahlCheck = !g.runde1_zahlen?.some(z => z.spieler_id === currentPlayer?.id);
        
        console.log('GameResponseWrapper: Checking isSchnicker for game', {
          gameId: g.id,
          currentPlayerId: currentPlayer?.id,
          schnickerId: g.schnicker?.id,
          statusCheck,
          schnickerCheck,
          bockWertCheck,
          bockWert: g.bock_wert,
          noRunde1ZahlCheck,
          runde1Zahlen: g.runde1_zahlen,
          allConditionsMet: statusCheck && schnickerCheck && bockWertCheck && noRunde1ZahlCheck
        });
        
        return statusCheck && schnickerCheck && bockWertCheck && noRunde1ZahlCheck;
      });
      
      console.log('GameResponseWrapper: isSchnicker result:', isSchnicker);
      
      if (isSchnicker) {
        console.log('GameResponseWrapper: Rendering round1_input_needed screen for schnicker');
        return <SchnickerResponse key="action-round1-schnicker" />;
      } else {
        console.log('GameResponseWrapper: Rendering round1_input_needed screen for angeschnickter');
        return <PendingResponse key="action-round1-angeschnickter" />;
      }
    }
    else if (actionType === 'round2_input_needed' || needsRound2Input) {
      console.log('GameResponseWrapper: Rendering round2_input_needed screen');
      return <Round2Response key="action-round2" />;
    } else if (actionType === 'result_available') {
      // Result screens are already handled by other code above
      console.log('GameResponseWrapper: Skipping result_available, handled elsewhere');
      return null;
    }
  }
  
  // These checks are now handled by the more robust logic above with needsBockInput, needsRound1Input, etc.
  // We don't need fallback checks anymore as we're directly checking game state
  
  // Ansonsten normalen Inhalt anzeigen
  // Make sure we actually use the children prop to fix lint warning
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
        return <MainMenu />
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
    <AuthProvider>
      <AppStateProvider>
        <PlayerProvider>
          <GameProvider>
            {/* PrivateRoute now inside PlayerProvider to ensure it can access player data */}
            <PrivateRoute>
              {/* AutoRefreshHandler removed to prevent multiple Supabase clients */}
              <AppContent />
            </PrivateRoute>
          </GameProvider>
        </PlayerProvider>
      </AppStateProvider>
    </AuthProvider>
  )
}

export default App
