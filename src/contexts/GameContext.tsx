import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Spieler, Schnick, SchnickZahl } from '../lib/supabase';
import { usePlayer } from './PlayerContext';

export interface GameWithPlayers extends Schnick {
  schnicker: Spieler;
  angeschnickter: Spieler;
  runde1_zahlen?: SchnickZahl[];
  runde2_zahlen?: SchnickZahl[];
}

interface GameContextType {
  activeGames: GameWithPlayers[];
  finishedGames: GameWithPlayers[];
  currentGame: GameWithPlayers | null;
  isLoading: boolean;
  createGame: (opponent: Spieler, aufgabe: string, bockWert?: number | null) => Promise<Schnick | null>;
  selectGame: (game: GameWithPlayers) => void;
  updateBockWert: (gameId: string, bockWert: number) => Promise<boolean>;
  clearCurrentGame: () => void;
  submitZahl: (zahl: number, runde: 1 | 2, game?: GameWithPlayers) => Promise<boolean>;
  refreshGames: () => Promise<void>;
  getGameResult: (game: GameWithPlayers) => string;
  getPlayerZahl: (game: GameWithPlayers, spielerId: string, runde: 1 | 2) => number | null;
  shouldShowNumber: (game: GameWithPlayers, spielerId: string, runde: 1 | 2) => boolean;
  getNextStep: (game: GameWithPlayers, spielerId: string) => string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentPlayer } = usePlayer();
  const [activeGames, setActiveGames] = useState<GameWithPlayers[]>([]);
  const [finishedGames, setFinishedGames] = useState<GameWithPlayers[]>([]);
  const [currentGame, setCurrentGame] = useState<GameWithPlayers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentPlayer) {
      refreshGames();

      // Supabase Realtime subscription für Spiele-Updates
      const schnickChannel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'schnicks' 
          }, 
          (payload) => {
            refreshGames();
          }
        )
        .subscribe();

      const zahlenChannel = supabase
        .channel('schnick-zahlen-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'schnick_zahlen' 
          }, 
          (payload) => {
            refreshGames();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(schnickChannel);
        supabase.removeChannel(zahlenChannel);
      };
    }
  }, [currentPlayer]);

  const refreshGames = async () => {
    if (!currentPlayer) return;
    
    setIsLoading(true);

    // Spiele laden, an denen der aktuelle Spieler beteiligt ist
    const { data: userGames, error: userGamesError } = await supabase
      .from('spieler_schnicks')
      .select('schnick_id')
      .eq('spieler_id', currentPlayer.id);

    if (userGamesError) {
      console.error('Fehler beim Laden der Spielerverknüpfungen:', userGamesError);
      setIsLoading(false);
      return;
    }
    
    if (!userGames || userGames.length === 0) {
      // Keine Spiele gefunden
      setActiveGames([]);
      setFinishedGames([]);
      setIsLoading(false);
      return;
    }
    
    // Extrahiere die Spiel-IDs
    const schnickIds = userGames.map(game => game.schnick_id);
    
    // Lade die vollständigen Spieldaten
    const { data: games, error } = await supabase
      .from('schnicks')
      .select('*')
      .in('id', schnickIds);

    if (error) {
      console.error('Fehler beim Laden der Spiele:', error);
      setIsLoading(false);
      return;
    }

    if (!games || games.length === 0) {
      // Keine Spiele gefunden
      setActiveGames([]);
      setFinishedGames([]);
      setIsLoading(false);
      return;
    }
    
    // Lade alle Spieler-Spiel Verknüpfungen
    const { data: spielerSchnicks, error: verknüpfungsError } = await supabase
      .from('spieler_schnicks')
      .select('*')
      .in('schnick_id', games.map(game => game.id));
      
    if (verknüpfungsError) {
      console.error('Fehler beim Laden der Spieler-Spiel Verknüpfungen:', verknüpfungsError);
      setIsLoading(false);
      return;
    }
    
    // Sammle alle Spieler-IDs
    const playerIds = new Set<string>();
    spielerSchnicks?.forEach(verknüpfung => {
      playerIds.add(verknüpfung.spieler_id);
    });

    // Lade alle beteiligten Spieler
    const { data: players, error: playerError } = await supabase
      .from('spieler')
      .select('*')
      .in('id', Array.from(playerIds));

    if (playerError) {
      console.error('Fehler beim Laden der Spieler:', playerError);
      setIsLoading(false);
      return;
    }

    const playersMap = players?.reduce((map, player) => {
      map[player.id] = player;
      return map;
    }, {} as Record<string, Spieler>) || {};
    
    // Spieler für jedes Spiel zuordnen
    const spielerSchnicksByGame = spielerSchnicks?.reduce((map, verknüpfung) => {
      if (!map[verknüpfung.schnick_id]) {
        map[verknüpfung.schnick_id] = [];
      }
      map[verknüpfung.schnick_id].push(verknüpfung.spieler_id);
      return map;
    }, {} as Record<string, string[]>) || {};

    // Zahlen für die Spiele laden
    const gameIds = games.map(game => game.id);
    const { data: zahlen, error: zahlenError } = await supabase
      .from('schnick_zahlen')
      .select('*')
      .in('schnick_id', gameIds);

    if (zahlenError) {
      console.error('Fehler beim Laden der Spielzahlen:', zahlenError);
      setIsLoading(false);
      return;
    }
    
    console.log('Geladene Spielzahlen:', zahlen);
    
    // Spiele mit Spielern und Zahlen erweitern
    const gamesWithPlayers: GameWithPlayers[] = games.map(game => {
      const gameZahlen = zahlen?.filter(z => z.schnick_id === game.id) || [];
      const gamePlayerIds = spielerSchnicksByGame[game.id] || [];
      
      // Die ersten beiden Spieler im Spiel bestimmen
      const spieler = gamePlayerIds.map(id => playersMap[id]).filter(Boolean);
      
      const runde1_zahlen = gameZahlen.filter(z => z.runde === 1);
      const runde2_zahlen = gameZahlen.filter(z => z.runde === 2);
      
      console.log(`Spiel ${game.id} (${game.status}): Runde 1 Zahlen: ${runde1_zahlen.length}, Runde 2 Zahlen: ${runde2_zahlen.length}`);
      
      return {
        ...game,
        // Der erste Spieler ist der Schnicker, der zweite der Angeschnickte
        // Dies ist eine Vereinfachung - in einer echten App würde man hier eine Rolle in der spieler_schnicks Tabelle haben
        schnicker: spieler[0] || { id: '', name: 'Unbekannt', created_at: '', avatar_url: null },
        angeschnickter: spieler[1] || { id: '', name: 'Unbekannt', created_at: '', avatar_url: null },
        runde1_zahlen,
        runde2_zahlen,
      };
    });

    // Aktive und beendete Spiele trennen
    const activeGamesList = gamesWithPlayers.filter(game => game.status !== 'beendet');
    const finishedGamesList = gamesWithPlayers.filter(game => game.status === 'beendet');
    
    console.log('Setting activeGames:', activeGamesList.length, activeGamesList.map(g => ({ id: g.id, status: g.status })));
    console.log('Setting finishedGames:', finishedGamesList.length, finishedGamesList.map(g => ({ id: g.id, status: g.status })));
    
    setActiveGames(activeGamesList);
    setFinishedGames(finishedGamesList);
    
    // Aktuelles Spiel aktualisieren, wenn eins ausgewählt ist
    if (currentGame) {
      const updatedGame = gamesWithPlayers.find(g => g.id === currentGame.id);
      if (updatedGame) {
        setCurrentGame(updatedGame);
      }
    }

    setIsLoading(false);
  };

  const createGame = async (opponent: Spieler, aufgabe: string, bockWert?: number | null) => {
    if (!currentPlayer) return null;

    // 1. Schnick-Eintrag erstellen
    const { data, error } = await supabase
      .from('schnicks')
      .insert([{
        schnicker_id: currentPlayer.id,
        angeschnickter_id: opponent.id,
        aufgabe,
        bock_wert: bockWert,
        status: 'offen',
        ergebnis: null
      }])
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen des Spiels:', error);
      return null;
    }

    if (data) {
      // 2. Einträge in der Verknüpfungstabelle für beide Spieler erstellen
      const { error: verknüpfungError } = await supabase
        .from('spieler_schnicks')
        .insert([
          { spieler_id: currentPlayer.id, schnick_id: data.id },
          { spieler_id: opponent.id, schnick_id: data.id }
        ]);

      if (verknüpfungError) {
        console.error('Fehler beim Erstellen der Spieler-Schnick Verknüpfungen:', verknüpfungError);
      }
    }

    await refreshGames();
    return data;
  };

  const submitZahl = async (zahl: number, runde: 1 | 2, game?: GameWithPlayers): Promise<boolean> => {
    // Use provided game if available, otherwise fall back to context's currentGame
    const gameToUse = game || currentGame;

    if (!currentPlayer || !gameToUse) {
      console.error('submitZahl: Kein Spieler oder kein Spiel aktiv', { currentPlayer, gameToUse });
      return false;
    }
    
    // Überprüfe, ob der Spieler in dieser Runde bereits eine Zahl abgegeben hat
    const zahlenArray = runde === 1 ? gameToUse.runde1_zahlen : gameToUse.runde2_zahlen;
    const hatBereitsGewählt = zahlenArray?.some(z => z.spieler_id === currentPlayer.id);
    
    if (hatBereitsGewählt) {
      console.error('submitZahl: Spieler hat bereits eine Zahl für diese Runde abgegeben');
      return false;
    }

    console.log('submitZahl: Versuche Zahl zu speichern', {
      schnick_id: gameToUse.id,
      spieler_id: currentPlayer.id,
      runde,
      zahl
    });

    try {
      // 1. Zahl in die Datenbank einfügen
      const { data, error } = await supabase
        .from('schnick_zahlen')
        .insert([{
          schnick_id: gameToUse.id,
          spieler_id: currentPlayer.id,
          runde,
          zahl
        }])
        .select()
        .single();

      if (error) {
        console.error('submitZahl: Fehler beim Speichern der Zahl:', error);
        return false;
      }

      console.log('submitZahl: Zahl erfolgreich gespeichert', data);
      
      // 2. Prüfen, ob die Runde abgeschlossen ist und das Spiel aktualisieren
      const { data: alleZahlen } = await supabase
        .from('schnick_zahlen')
        .select('*')
        .eq('schnick_id', gameToUse.id)
        .eq('runde', runde);

      console.log('submitZahl: Alle Zahlen für diese Runde:', alleZahlen);

      if (alleZahlen && alleZahlen.length === 2) {
        // Beide Spieler haben eine Zahl gewählt
        if (runde === 1) {
          // Runde 1 abgeschlossen, prüfen ob gleiche Zahlen
          const [zahl1, zahl2] = alleZahlen;
          console.log('submitZahl: Vergleiche Zahlen', { zahl1, zahl2 });
          
          if (zahl1.zahl === zahl2.zahl) {
            // Sofortiger Gewinn für den Schnicker
            console.log('submitZahl: Gleiche Zahlen - Gewinn für Schnicker');
            await supabase
              .from('schnicks')
              .update({
                status: 'beendet',
                ergebnis: 'angeschnickter'
              })
              .eq('id', gameToUse.id);
          } else {
            // Zu Runde 2 wechseln
            console.log('submitZahl: Unterschiedliche Zahlen - Weiter zu Runde 2');
            await supabase
              .from('schnicks')
              .update({
                status: 'runde2'
              })
              .eq('id', gameToUse.id);
          }
        } else if (runde === 2) {
          // Runde 2 abgeschlossen, Ergebnis bestimmen
          const [zahl1, zahl2] = alleZahlen;
          let ergebnis: 'schnicker' | 'angeschnickter' | 'unentschieden' = 'unentschieden';
          
          if (zahl1.zahl === zahl2.zahl) {
            // Gleiche Zahlen in Runde 2 = Eigentor (Schnicker verliert)
            ergebnis = 'schnicker';
          } else {
            // Unterschiedliche Zahlen = Unentschieden
            ergebnis = 'unentschieden';
          }
          
          await supabase
            .from('schnicks')
            .update({
              status: 'beendet',
              ergebnis
            })
            .eq('id', gameToUse.id);
        }
      }

      await refreshGames();
      return true;
    } catch (e) {
      console.error('submitZahl: Unerwarteter Fehler beim Speichern oder Aktualisieren:', e);
      return false;
    }
  };

  const selectGame = (game: GameWithPlayers) => {
    setCurrentGame(game);
  };
  
  const updateBockWert = async (gameId: string, bockWert: number): Promise<boolean> => {
    if (!gameId || typeof bockWert !== 'number' || bockWert < 1) return false;
    
    const { error } = await supabase
      .from('schnicks')
      .update({ bock_wert: bockWert })
      .eq('id', gameId);
      
    if (error) {
      console.error('Fehler beim Aktualisieren des Bock-Werts:', error);
      return false;
    }
    
    // Aktualisiere lokale Daten
    await refreshGames();
    
    // Prüfe, ob das Spiel das aktuelle Spiel ist, und aktualisiere es
    if (currentGame && currentGame.id === gameId) {
      const updatedGame = activeGames.find(g => g.id === gameId);
      if (updatedGame) {
        setCurrentGame({...updatedGame});
      }
    }
    
    return true;
  };

  const clearCurrentGame = () => {
    setCurrentGame(null);
  };

  const getPlayerZahl = (game: GameWithPlayers, spielerId: string, runde: 1 | 2): number | null => {
    const zahlen = runde === 1 ? game.runde1_zahlen : game.runde2_zahlen;
    if (!zahlen) return null;
    
    const spielerZahl = zahlen.find(z => z.spieler_id === spielerId);
    return spielerZahl ? spielerZahl.zahl : null;
  };

  const shouldShowNumber = (game: GameWithPlayers, spielerId: string, runde: 1 | 2): boolean => {
    // Wenn das Spiel beendet ist oder beide Zahlen für die aktuelle Runde vorliegen
    if (game.status === 'beendet') return true;
    
    const zahlen = runde === 1 ? game.runde1_zahlen : game.runde2_zahlen;
    if (!zahlen) return false;
    
    // Wenn zwei Zahlen für diese Runde existieren
    return zahlen.length === 2;
  };

  const getGameResult = (game: GameWithPlayers): string => {
    if (game.status !== 'beendet') {
      return 'Spiel läuft noch';
    }

    switch (game.ergebnis) {
      case 'schnicker':
        return `${game.schnicker.name} muss die Aufgabe erfüllen`;
      case 'angeschnickter':
        return `${game.angeschnickter.name} muss die Aufgabe erfüllen`;
      case 'unentschieden':
        return 'Unentschieden - niemand muss die Aufgabe erfüllen';
      default:
        return 'Unbekanntes Ergebnis';
    }
  };

  const getNextStep = (game: GameWithPlayers, spielerId: string): string => {
    // Für den Angeschnickten: Bock-Wert setzen
    if (game.status === 'offen' && spielerId === game.angeschnickter_id) {
      return 'Wähle deinen Bock-Wert';
    }
    
    // Für beide Spieler in Runde 1
    if (game.status === 'runde1') {
      const hatBereitsGewählt = game.runde1_zahlen?.some(z => z.spieler_id === spielerId);
      if (hatBereitsGewählt) {
        return 'Warte auf den anderen Spieler';
      } else {
        return `Wähle eine Zahl zwischen 1 und ${game.bock_wert}`;
      }
    }
    
    // Für beide Spieler in Runde 2
    if (game.status === 'runde2') {
      const hatBereitsGewählt = game.runde2_zahlen?.some(z => z.spieler_id === spielerId);
      if (hatBereitsGewählt) {
        return 'Warte auf den anderen Spieler';
      } else {
        // Finde die niedrigste Zahl aus Runde 1
        const minRunde1 = Math.min(
          ...(game.runde1_zahlen?.map(z => z.zahl) || [])
        );
        return `Wähle eine Zahl zwischen 1 und ${Math.min(minRunde1, 4)}`;
      }
    }
    
    return '';
  };

  return (
    <GameContext.Provider
      value={{
        activeGames,
        finishedGames,
        currentGame,
        isLoading,
        createGame,
        selectGame,
        updateBockWert,
        clearCurrentGame,
        submitZahl,
        refreshGames,
        getGameResult,
        getPlayerZahl,
        shouldShowNumber,
        getNextStep
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
