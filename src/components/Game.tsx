import React, { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useAppState } from '../contexts/AppStateContext';
import Avatar from './Avatar';

export const Game: React.FC = () => {
  const { currentPlayer } = usePlayer();
  const { currentGame, submitZahl, getPlayerZahl, shouldShowNumber, getGameResult, getNextStep } = useGame();
  const { navigateTo } = useAppState();
  
  const [selectedZahl, setSelectedZahl] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!currentGame || !currentPlayer) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <div className="card">
          <p className="text-center py-4">Kein aktives Spiel ausgewählt.</p>
          <button onClick={() => navigateTo('menu')} className="btn btn-primary w-full">
            Zurück zum Menü
          </button>
        </div>
      </div>
    );
  }
  
  const handleZahlSubmit = async () => {
    if (selectedZahl === null) return;
    
    // Bestimme die aktuelle Runde
    const currentRound = currentGame.status === 'offen' || currentGame.status === 'runde1' ? 1 : 2;
    
    console.log(`Submitting zahl ${selectedZahl} for round ${currentRound}`);
    
    setIsSubmitting(true);
    const result = await submitZahl(selectedZahl, currentRound);
    console.log(`Submission result: ${result ? 'success' : 'failure'}`);
    setIsSubmitting(false);
    setSelectedZahl(null);
  };
  
  // Bestimme verfügbare Zahlen basierend auf dem Spielstatus
  const getAvailableNumbers = (): number[] => {
    console.log('Getting available numbers for status:', currentGame.status);
    
    if (currentGame.status === 'offen' || currentGame.status === 'runde1') {
      return Array.from({ length: currentGame.bock_wert }, (_, i) => i + 1);
    } else if (currentGame.status === 'runde2') {
      // Für Runde 2: Niedrigste Zahl aus Runde 1, aber maximal 4
      const runde1Zahlen = currentGame.runde1_zahlen?.map(z => z.zahl) || [];
      console.log('Runde 1 Zahlen:', runde1Zahlen);
      
      if (runde1Zahlen.length === 0) {
        console.warn('Keine Zahlen für Runde 1 gefunden!');
        return [];
      }
      
      const minRunde1 = Math.min(...runde1Zahlen);
      const maxZahl = Math.min(minRunde1, 4);
      console.log('Min Runde 1:', minRunde1, 'Max Zahl für Runde 2:', maxZahl);
      return Array.from({ length: maxZahl }, (_, i) => i + 1);
    }
    return [];
  };
  
  // Prüfe, ob der Spieler in der aktuellen Runde bereits gewählt hat
  const hatBereitsGewählt = (): boolean => {
    const round = currentGame.status === 'offen' || currentGame.status === 'runde1' ? 1 : 2;
    const zahlen = round === 1 ? currentGame.runde1_zahlen : currentGame.runde2_zahlen;
    const result = !!zahlen?.some(z => z.spieler_id === currentPlayer.id);
    console.log(`Spieler ${currentPlayer.name} hat in Runde ${round} ${result ? 'bereits' : 'noch nicht'} gewählt.`);
    console.log('Verfügbare Zahlen für diese Runde:', zahlen);
    return result;
  };

  // Spieler-Zahlen anzeigen
  const renderPlayerNumber = (spielerId: string, runde: 1 | 2) => {
    const zahl = getPlayerZahl(currentGame, spielerId, runde);
    const showNumber = shouldShowNumber(currentGame, spielerId, runde);
    
    if (zahl === null) {
      return <span className="text-gray-500">-</span>;
    }
    
    if (showNumber) {
      return <span className="font-bold">{zahl}</span>;
    }
    
    return <span className="text-gray-500">?</span>;
  };

  return (
    <div className="min-h-screen bg-schnicken-darkest">
      <div className="container max-w-md mx-auto p-4">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigateTo('menu')}
            className="p-2 -ml-2 text-schnicken-light/70 hover:text-schnicken-light"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold flex-1 text-center mr-7 text-schnicken-light">Schnick Details</h1>
        </div>

        {/* Schnick Header Information */}
        <div className="bg-schnicken-dark p-4 rounded-lg mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-sm text-schnicken-light/80">Aufgabe:</div>
              <div className="font-medium text-lg text-schnicken-light">{currentGame.aufgabe}</div>
            </div>
            <div className="flex items-center bg-schnicken-medium/50 text-schnicken-light text-xs px-3 py-1 rounded-full">
              {currentGame.status === 'beendet' ? 'Beendet' : 
               currentGame.status === 'runde1' ? 'Runde 1' : 
               currentGame.status === 'runde2' ? 'Runde 2' : 'Offen'}
            </div>
          </div>
          
          <div className="flex justify-between mt-3">
            <div className="text-sm">
              <span className="text-schnicken-light/70">Bock-Wert:</span> 
              <span className="ml-1 font-medium text-schnicken-light">{currentGame.bock_wert || '-'}</span>
            </div>
            <div className="text-sm">
              <span className="text-schnicken-light/70">Status:</span>
              <span className="ml-1 font-medium text-schnicken-light">
                {currentGame.ergebnis === 'schnicker' ? 'Schnicker gewinnt' : 
                 currentGame.ergebnis === 'angeschnickter' ? 'Angeschnickter gewinnt' : 
                 'Läuft'}
              </span>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="mb-4 flex items-center justify-between p-3 bg-schnicken-dark/80 rounded-lg border border-schnicken-medium/30">
          <div className="flex items-center">
            <Avatar
              name={currentGame.schnicker.name}
              avatarUrl={currentGame.schnicker.avatar_url}
              size="medium"
            />
            <div className="ml-3">
              <div className="font-medium text-schnicken-light">{currentGame.schnicker.name}</div>
              <div className="text-xs text-schnicken-light/70">Schnicker</div>
            </div>
          </div>

          <div className="mx-3 text-schnicken-light/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="flex items-center">
            <div className="mr-3 text-right">
              <div className="font-medium text-schnicken-light">{currentGame.angeschnickter.name}</div>
              <div className="text-xs text-schnicken-light/70">Angeschnickter</div>
            </div>
            <Avatar
              name={currentGame.angeschnickter.name}
              avatarUrl={currentGame.angeschnickter.avatar_url}
              size="medium"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6 mt-6">
          <h2 className="text-lg font-semibold mb-4 text-schnicken-light">Schnick Verlauf</h2>
          <div className="relative pl-8 border-l-2 border-schnicken-medium/40 space-y-6 py-2">
            {/* Created Event */}
            <div className="relative">
              <div className="absolute -left-[25px] h-6 w-6 rounded-full bg-schnicken-medium/70 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-schnicken-light" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                </svg>
              </div>
              <div className="text-sm">
                <div className="font-medium mb-1 text-schnicken-light">
                  {currentGame.schnicker.name} hat {currentGame.angeschnickter.name} angeschnickt
                </div>
                <div className="text-xs text-schnicken-light/60 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {new Date(currentGame.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Bock Set Event */}
            {currentGame.bock_wert !== null && (
              <div className="relative">
                <div className="absolute -left-[25px] h-6 w-6 rounded-full bg-schnicken-medium/70 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-schnicken-light" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1 text-schnicken-light">Spiel beendet</div>
                  <div className="bg-schnicken-dark/70 p-3 rounded-lg border border-schnicken-medium/20">
                    <div className="mb-2 text-schnicken-light">{currentGame.bock_wert} gesetzt</div>
                  </div>
                </div>
              </div>
            )}

            {/* Round 1 Numbers */}
            {currentGame.runde1_zahlen && currentGame.runde1_zahlen.length > 0 && (
              <div className="relative">
                <div className="absolute -left-[25px] h-6 w-6 rounded-full bg-schnicken-medium/70 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-schnicken-light" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1 text-schnicken-light">Runde 1: Zahlen abgegeben</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-schnicken-dark/70 p-3 rounded-lg border border-schnicken-medium/20">
                    <div className="flex items-center">
                      <span className="text-schnicken-light/70 mr-2">{currentGame.schnicker.name}:</span> 
                      <span className="text-schnicken-light">{renderPlayerNumber(currentGame.schnicker_id, 1)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-schnicken-light/70 mr-2">{currentGame.angeschnickter.name}:</span> 
                      <span className="text-schnicken-light">{renderPlayerNumber(currentGame.angeschnickter_id, 1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Round 2 Numbers (if exists) */}
            {currentGame.runde2_zahlen && currentGame.runde2_zahlen.length > 0 && (
              <div className="relative">
                <div className="absolute -left-[25px] h-6 w-6 rounded-full bg-schnicken-medium/70 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-schnicken-light" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1 text-schnicken-light">Runde 2: Zahlen abgegeben</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-schnicken-dark/70 p-3 rounded-lg border border-schnicken-medium/20">
                    <div className="flex items-center">
                      <span className="text-schnicken-light/70 mr-2">{currentGame.schnicker.name}:</span> 
                      <span className="text-schnicken-light">{renderPlayerNumber(currentGame.schnicker_id, 2)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-schnicken-light/70 mr-2">{currentGame.angeschnickter.name}:</span> 
                      <span className="text-schnicken-light">{renderPlayerNumber(currentGame.angeschnickter_id, 2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Game Result (if completed) */}
            {currentGame.status === 'beendet' && (
              <div className="relative">
                <div className="absolute -left-[25px] h-6 w-6 rounded-full bg-purple-500/50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-100" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1">Spiel beendet</div>
                  <div className="p-3 bg-purple-500/10 dark:bg-purple-900/30 rounded-lg">
                    <p>{getGameResult(currentGame)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {currentGame.status !== 'beendet' && (
          <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Dein Zug</h3>
              <p className="text-schnicken-light/80 mb-3">
                {getNextStep(currentGame, currentPlayer.id)}
              </p>
              
              {/* Debug-Info für Entwickler */}
              <details className="mb-2 text-xs bg-schnicken-dark/50 p-2 rounded-md">
                <summary className="cursor-pointer text-schnicken-light/60">Debug Info</summary>
                <div className="text-schnicken-light/70 mt-1 space-y-1">
                  <p>Status: {currentGame.status}</p>
                  <p>Runde 1 Zahlen: {JSON.stringify(currentGame.runde1_zahlen || [])}</p>
                  <p>Runde 2 Zahlen: {JSON.stringify(currentGame.runde2_zahlen || [])}</p>
                  <p>Hat bereits gewählt: {hatBereitsGewählt() ? 'Ja' : 'Nein'}</p>
                  <p>Verfügbare Zahlen: {JSON.stringify(getAvailableNumbers())}</p>
                </div>
              </details>
              
              {!hatBereitsGewählt() && getAvailableNumbers().length > 0 ? (
                <>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {getAvailableNumbers().map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedZahl(num)}
                        className={`py-3 rounded-md text-center font-medium ${
                          selectedZahl === num
                            ? 'bg-schnicken-highlight text-white'
                            : 'bg-schnicken-dark/80 text-schnicken-light/90 hover:bg-schnicken-medium/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleZahlSubmit}
                    disabled={selectedZahl === null || isSubmitting}
                    className="w-full py-3 rounded-md bg-schnicken-highlight text-white font-medium hover:bg-schnicken-highlight/80 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Zahl bestätigen'
                    )}
                  </button>
                </>
              ) : (
                <div className="bg-schnicken-dark/80 p-4 rounded-lg text-center">
                  <p className="text-schnicken-light/90">{hatBereitsGewählt() ? 'Du hast bereits gewählt.' : 'Keine Zahlen verfügbar.'}</p>
                  <p className="text-xs text-schnicken-light/60 mt-1">
                    Warte auf den anderen Spieler...
                  </p>
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  );
};
