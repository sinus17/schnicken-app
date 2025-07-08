import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Spieler, Schnick, SchnickZahl } from '../lib/supabase';
import { usePlayer } from './PlayerContext';
import { sendWhatsAppMessage, WhatsAppNotifications } from '../services/WhatsAppService';

export interface GameWithPlayers extends Schnick {
  schnicker: Spieler;
  angeschnickter: Spieler;
  runde1_zahlen?: SchnickZahl[];
  runde2_zahlen?: SchnickZahl[];
}

// Action type for notifications
type ActionNotificationType = 
  | 'new_schnick' 
  | 'bock_input_needed' 
  | 'round1_input_needed' 
  | 'round2_input_needed' 
  | 'result_available' 
  | null;

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
  // Action notification state
  actionRequired: boolean;
  actionType: ActionNotificationType;
  resetActionNotification: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentPlayer } = usePlayer();
  const [activeGames, setActiveGames] = useState<GameWithPlayers[]>([]);
  const [finishedGames, setFinishedGames] = useState<GameWithPlayers[]>([]);
  const [currentGame, setCurrentGame] = useState<GameWithPlayers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add a notification flag to indicate when important actions require attention
  const [actionRequired, setActionRequired] = useState(false);
  const [actionType, setActionType] = useState<ActionNotificationType>(null);

  // Track if any game-related update is being processed
  const [updatingGames, setUpdatingGames] = useState(false);
  
  // Helper to send WhatsApp notifications without blocking the UI
  const sendGameNotification = async (notificationFunction: () => string) => {
    try {
      // Create the notification message
      const message = notificationFunction();
      
      // Send notification asynchronously (don't await) to prevent UI blocking
      sendWhatsAppMessage(message).catch(error => {
        console.error('Failed to send WhatsApp notification:', error);
      });
    } catch (error) {
      console.error('Error preparing WhatsApp notification:', error);
    }
  };
  
  // Function to handle real-time game updates with payload inspection
  const handleGameUpdate = async (payload: any) => {
    if (!currentPlayer || updatingGames) return;
    
    try {
      // Set flag to prevent multiple concurrent updates
      setUpdatingGames(true);
      
      // Get details about what changed
      const { eventType, table, record } = payload;
      console.log(`Real-time update: ${eventType} on ${table}`, record);
      
      // For quick status checks - just update the current game if it matches
      if (table === 'schnicks') {
        // Check if this is a new game where current player is involved
        const isNewGameForCurrentPlayer = 
          eventType === 'INSERT' && 
          (record.schnicker_id === currentPlayer.id || record.angeschnickter_id === currentPlayer.id);
        
        // This is a new angeschnickt event - prioritize showing it
        if (isNewGameForCurrentPlayer) {
          console.log('New game detected for current player - refreshing immediately');
          // Set notification for new schnick
          if (record.angeschnickter_id === currentPlayer.id) {
            setActionRequired(true);
            setActionType('new_schnick');
            
            // Send action required notification to angeschnickter
            await sendGameNotification(() => {
              return WhatsAppNotifications.actionRequired(
                currentPlayer.name,
                'set_bock_value'
              );
            });
          } else {
            // This player is the schnicker in a new game
            setActionRequired(true);
            setActionType('round1_input_needed');
            
            // Send action required notification to schnicker
            await sendGameNotification(() => {
              return WhatsAppNotifications.actionRequired(
                currentPlayer.name,
                'submit_round1_number'
              );
            });
          }
          await refreshGames();
          return;
        }
        
        // Check for status changes that require action
        if (eventType === 'UPDATE' && record.status) {
          // Status changed to runde2, player might need to enter a number
          if (record.status === 'runde2') {
            setActionRequired(true);
            setActionType('round2_input_needed');
            
            // Send action required notification for Round 2
            await sendGameNotification(() => {
              return WhatsAppNotifications.actionRequired(
                currentPlayer.name,
                'submit_round2_number'
              );
            });
          }
          // Status changed to beendet, results are available
          else if (record.status === 'beendet') {
            setActionRequired(true);
            setActionType('result_available');
            
            // Note: We don't send game result notification here as it's already sent
            // in the submitZahl function with more detailed game data
          }
        }
        
        // Update for existing current game
        if (currentGame && record.id === currentGame.id) {
          // Targeted update for the current game
          console.log('Updating current game based on real-time event');
          await updateCurrentGameOnly();
          return;
        }
      }
      
      // For number submissions - check if it affects current player
      if (table === 'schnick_zahlen') {
        const isRelevantToCurrentUser = 
          // The current player submitted a number
          record.spieler_id === currentPlayer.id ||
          // Or a number was submitted in a game where current player is involved
          (currentGame && 
           (currentGame.schnicker.id === currentPlayer.id || 
            currentGame.angeschnickter.id === currentPlayer.id) && 
           record.schnick_id === currentGame.id);
        
        if (isRelevantToCurrentUser) {
          console.log('Number submitted in a game relevant to current player');
          // Priority update for the current game if it matches
          if (currentGame && record.schnick_id === currentGame.id) {
            await updateCurrentGameOnly();
          } else {
            // Otherwise refresh all games
            await refreshGames();
          }
          return;
        }
      }
      
      // If we get here, do a full refresh since something relevant changed
      await refreshGames();
      
    } catch (error) {
      console.error('Error handling real-time update:', error);
    } finally {
      setUpdatingGames(false);
    }
  };
  
  // Function to update only the current game (more efficient)
  const updateCurrentGameOnly = async () => {
    if (!currentGame || !currentPlayer) return;
    
    try {
      const { data, error } = await supabase
        .from('schnicks')
        .select(`
          id, schnicker_id, angeschnickter_id, aufgabe, status, bock_wert, ergebnis, created_at, updated_at,
          schnicker:schnicker_id(id, name, farbe),
          angeschnickter:angeschnickter_id(id, name, farbe)
        `)
        .eq('id', currentGame.id)
        .single();
      
      if (error) {
        console.error('Error updating current game:', error);
        return;
      }
      
      if (data) {
        // Get runde1_zahlen and runde2_zahlen for this game
        const { data: zahlenData, error: zahlenError } = await supabase
          .from('schnick_zahlen')
          .select('*')
          .eq('schnick_id', data.id);
          
        if (zahlenError) {
          console.error('Error loading game numbers:', zahlenError);
        }
        
        // Format the game with players and numbers
        // Convert to proper Spieler objects
        const schnickerData = data.schnicker as unknown as Spieler;
        const angeschnickterData = data.angeschnickter as unknown as Spieler;
        
        const formattedGame: GameWithPlayers = {
          ...data,
          schnicker: schnickerData,
          angeschnickter: angeschnickterData,
          runde1_zahlen: zahlenData?.filter(z => z.runde === 1) || [],
          runde2_zahlen: zahlenData?.filter(z => z.runde === 2) || []
        };
        
        // Update the current game state
        setCurrentGame(formattedGame);
        
        // Also update the game in the active games list
        setActiveGames(prev => 
          prev.map(g => g.id === formattedGame.id ? formattedGame : g)
        );
      }
    } catch (err) {
      console.error('Error in updateCurrentGameOnly:', err);
    }
  };

  // Function to reset action notifications after they've been handled
  const resetActionNotification = () => {
    setActionRequired(false);
    setActionType(null);
  };

  useEffect(() => {
    if (currentPlayer) {
      // Initial load of all games
      refreshGames();

      // Enhanced Supabase Realtime subscription for game updates
      const schnickChannel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'schnicks' 
          }, 
          (payload) => {
            handleGameUpdate(payload);
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
            handleGameUpdate(payload);
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
      const spieler = gamePlayerIds.map((id: string) => playersMap[id]).filter(Boolean);
      
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
      
      // Send WhatsApp notification for new schnick
      await sendGameNotification(() => {
        return WhatsAppNotifications.newSchnick(
          currentPlayer.name,
          opponent.name,
          aufgabe
        );
      });
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
    
    // Track which game we're submitting to for optimistic UI update
    const gameId = gameToUse.id;

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
      
      // Add optimistic UI update for the submitted number
      // This makes the UI immediately reflect the change without waiting for the server
      const newZahlEntry: SchnickZahl = {
        id: data.id,
        schnick_id: gameId,
        spieler_id: currentPlayer.id,
        runde: runde,
        zahl: zahl,
        created_at: new Date().toISOString()
      };
      
      // Update the current game state locally with the new number
      if (currentGame && currentGame.id === gameId) {
        const updatedGame = { ...currentGame };
        if (runde === 1) {
          updatedGame.runde1_zahlen = [...(updatedGame.runde1_zahlen || []), newZahlEntry];
        } else {
          updatedGame.runde2_zahlen = [...(updatedGame.runde2_zahlen || []), newZahlEntry];
        }
        setCurrentGame(updatedGame);
        
        // Also update the game in the active games list
        setActiveGames(prev => 
          prev.map(g => g.id === gameId ? updatedGame : g)
        );
        
        // Send WhatsApp notification for round number submission
        // Determine which player we're waiting for (if any)
        const otherPlayerId = currentPlayer.id === gameToUse.schnicker_id ? 
          gameToUse.angeschnickter_id : gameToUse.schnicker_id;
        
        // Find the other player's name
        const otherPlayer = gameToUse.schnicker_id === otherPlayerId ? 
          gameToUse.schnicker : gameToUse.angeschnickter;
          
        // Check if we're waiting for the other player
        const zahlenArray = runde === 1 ? updatedGame.runde1_zahlen : updatedGame.runde2_zahlen;
        const otherPlayerSubmitted = zahlenArray?.some(z => z.spieler_id === otherPlayerId);
        
        // If other player hasn't submitted yet, mention we're waiting for them
        const waitingForPlayer = otherPlayerSubmitted ? null : otherPlayer.name;
        
        // Send appropriate notification based on round
        await sendGameNotification(() => {
          if (runde === 1) {
            return WhatsAppNotifications.round1Submission(
              currentPlayer.name,
              waitingForPlayer
            );
          } else {
            return WhatsAppNotifications.round2Submission(
              currentPlayer.name,
              waitingForPlayer
            );
          }
        });
      }
      
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
            // Sofortiger Gewinn für den Schnicker (gleiche Zahlen = Schnicker gewinnt)
            console.log('submitZahl: Gleiche Zahlen - Gewinn für Schnicker');
            await supabase
              .from('schnicks')
              .update({
                status: 'beendet',
                ergebnis: 'schnicker_won'
              })
              .eq('id', gameToUse.id);
              
            // Set action required notification for immediate UI update
            setActionRequired(true);
            setActionType('result_available');
            console.log('submitZahl: Result available notification set - immediate win');
            
            // Send WhatsApp notification for game result
            if (gameToUse.schnicker && gameToUse.angeschnickter) {
              const round1Numbers = alleZahlen.map(z => {
                const player = z.spieler_id === gameToUse.schnicker_id ? 
                  gameToUse.schnicker.name : gameToUse.angeschnickter.name;
                return { player, number: z.zahl };
              });
              
              await sendGameNotification(() => {
                return WhatsAppNotifications.gameResult(
                  gameToUse.schnicker.name,
                  gameToUse.angeschnickter.name,
                  'schnicker_won', // Schnicker wins immediately
                  round1Numbers,
                  undefined, // No round2Numbers
                  gameToUse.aufgabe,
                  gameToUse.bock_wert || 0
                );
              });
            }
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
            
          // Send WhatsApp notification for final game result
          if (gameToUse.schnicker && gameToUse.angeschnickter) {
            // Get Round 1 numbers
            const { data: round1Data } = await supabase
              .from('schnick_zahlen')
              .select('*')
              .eq('schnick_id', gameToUse.id)
              .eq('runde', 1);
              
            const round1Numbers = round1Data?.map(z => {
              const player = z.spieler_id === gameToUse.schnicker_id ? 
                gameToUse.schnicker.name : gameToUse.angeschnickter.name;
              return { player, number: z.zahl };
            }) || [];
            
            // Get Round 2 numbers
            const round2Numbers = alleZahlen.map(z => {
              const player = z.spieler_id === gameToUse.schnicker_id ? 
                gameToUse.schnicker.name : gameToUse.angeschnickter.name;
              return { player, number: z.zahl };
            });
            
            // Set action required notification for immediate UI update
            setActionRequired(true);
            setActionType('result_available');
            
            // Send WhatsApp notification with full game result
            await sendGameNotification(() => {
              return WhatsAppNotifications.gameResult(
                gameToUse.schnicker.name,
                gameToUse.angeschnickter.name,
                ergebnis,
                round1Numbers,
                round2Numbers,
                gameToUse.aufgabe,
                gameToUse.bock_wert || 0
              );
            });
          }
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
        
        // Send WhatsApp notification for bock value update
        if (currentPlayer) {
          await sendGameNotification(() => {
            return WhatsAppNotifications.bockUpdate(
              currentPlayer.name,
              bockWert
            );
          });
        }
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

  const shouldShowNumber = (game: GameWithPlayers, _spielerId: string, runde: 1 | 2): boolean => {
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
        getNextStep,
        // Action notification state
        actionRequired,
        actionType,
        resetActionNotification
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
