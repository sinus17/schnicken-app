import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FullScreenLayout } from './layout/FullScreenLayout';
import { ActionButton } from './ui/ActionButton';
import { useAppState } from '../contexts/AppStateContext';
import type { GameWithPlayers } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';

interface Round2ResultModalProps {
  game: GameWithPlayers;
  onClose?: () => void;
}

export const Round2ResultModal: React.FC<Round2ResultModalProps> = ({ game, onClose }) => {
  const { navigateTo } = useAppState();
  const { currentPlayer } = usePlayer();
  
  // Determine player roles and names
  const isSchnicker = currentPlayer?.id === game.schnicker.id;
  const schnicker = game.schnicker.name;
  const angeschnickter = game.angeschnickter.name;
  
  // Extract round numbers
  const round1Numbers = game.runde1_zahlen || [];
  const round2Numbers = game.runde2_zahlen || [];
  
  // Get the player's and opponent's numbers
  const getPlayerNumbers = () => {
    if (!currentPlayer) return { round1: null, round2: null };
    
    const r1 = round1Numbers.find(z => z.spieler_id === currentPlayer.id);
    const r2 = round2Numbers.find(z => z.spieler_id === currentPlayer.id);
    
    return {
      round1: r1 ? r1.zahl : null,
      round2: r2 ? r2.zahl : null
    };
  };
  
  const getOpponentNumbers = () => {
    if (!currentPlayer) return { round1: null, round2: null };
    
    const r1 = round1Numbers.find(z => z.spieler_id !== currentPlayer.id);
    const r2 = round2Numbers.find(z => z.spieler_id !== currentPlayer.id);
    
    return {
      round1: r1 ? r1.zahl : null,
      round2: r2 ? r2.zahl : null
    };
  };
  
  const playerNumbers = getPlayerNumbers();
  const opponentNumbers = getOpponentNumbers();
  const opponentName = isSchnicker ? angeschnickter : schnicker;
  
  // Determine if we're still waiting for opponent's number
  const isWaitingForOpponent = round2Numbers.length !== 2;
  
  // Determine result
  const determineResult = () => {
    if (isWaitingForOpponent) {
      return { 
        headline: "Warten auf Gegner...", 
        message: `${opponentName} hat noch keine Zahl für Runde 2 gewählt.`,
        resultType: "waiting"
      };
    }
    
    const [num1, num2] = round2Numbers.map(z => z.zahl);
    
    if (num1 === num2) {
      // Eigentor (Schnicker verliert)
      return {
        headline: "Eigentor! 🤦‍♂️",
        message: `${schnicker} muss die eigene Aufgabe erfüllen: ${game.aufgabe}`,
        resultType: "eigentor"
      };
    } else {
      // Unentschieden
      return {
        headline: "Unentschieden 🤝",
        message: "Die Zahlen waren unterschiedlich. Niemand muss die Aufgabe erfüllen.",
        resultType: "no_winner"
      };
    }
  };
  
  const result = determineResult();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigateTo('menu');
    }
  };
  
  // Track if we need to refresh the game data
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // Set up real-time listener specifically for this game's round 2 numbers
  useEffect(() => {
    console.log('Round2ResultModal rendering with game:', game);
    console.log('Round 2 numbers:', round2Numbers);
    
    // If we already have both numbers, no need to set up subscription
    if (round2Numbers.length === 2) return;
    
    // Subscribe to changes in the schnick_zahlen table specifically for this game's round 2
    const zahlenChannel = supabase
      .channel('round2-result-numbers')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'schnick_zahlen',
          filter: `schnick_id=eq.${game.id}&runde=eq.2`
        }, 
        (payload) => {
          console.log('Round2ResultModal detected number change:', payload);
          setNeedsRefresh(true);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(zahlenChannel);
    };
  }, [game.id, round2Numbers.length]);
  
  // Refresh game data when needed
  useEffect(() => {
    if (!needsRefresh) return;
    
    const fetchLatestNumbers = async () => {
      try {
        const { data, error } = await supabase
          .from('schnick_zahlen')
          .select('*')
          .eq('schnick_id', game.id)
          .eq('runde', 2);
          
        if (error) {
          console.error('Error fetching updated numbers:', error);
          return;
        }
        
        if (data) {
          // Update the local state to force re-render with new data
          game.runde2_zahlen = data;
          console.log('Updated round 2 numbers:', data);
          setNeedsRefresh(false);
        }
      } catch (err) {
        console.error('Failed to refresh round 2 numbers:', err);
      }
    };
    
    fetchLatestNumbers();
  }, [needsRefresh, game]);
  
  return (
    <FullScreenLayout
      backgroundColor="bg-schnicken-darkest"
      headline={result.headline}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Number comparison display */}
        <div className="bg-schnicken-dark p-6 rounded-lg">
          <h3 className="text-schnicken-light text-center mb-4 font-bold">Runde 2 Ergebnis</h3>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <p className="text-schnicken-light/80 text-sm mb-1">Du</p>
              <div className="bg-schnicken-primary rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                <span className="text-schnicken-darkest text-2xl font-bold">{playerNumbers.round2}</span>
              </div>
            </div>
            
            <div className="mx-4 text-schnicken-light/50">
              <span className="text-xl font-bold">VS</span>
            </div>
            
            <div className="flex-1 text-center">
              <p className="text-schnicken-light/80 text-sm mb-1">{opponentName}</p>
              {isWaitingForOpponent ? (
                <div className="bg-schnicken-accent/50 rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-schnicken-light"></div>
                </div>
              ) : (
                <div className="bg-schnicken-accent rounded-full h-16 w-16 mx-auto flex items-center justify-center">
                  <span className="text-schnicken-darkest text-2xl font-bold">{opponentNumbers.round2}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Result message */}
          <div className="text-xl font-medium text-schnicken-light text-center">{result.message}</div>
        </div>
        
        {/* Round summary */}
        <div className="bg-schnicken-dark p-4 rounded-lg">
          <h3 className="text-schnicken-light text-center mb-3 font-bold">Spielverlauf</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-schnicken-light/80 text-sm mb-1">Runde 1</p>
              <div className="flex justify-center space-x-4">
                <div className="bg-schnicken-primary/80 rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-schnicken-darkest font-bold">{playerNumbers.round1}</span>
                </div>
                <div className="bg-schnicken-accent/80 rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-schnicken-darkest font-bold">{opponentNumbers.round1}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-schnicken-light/80 text-sm mb-1">Runde 2</p>
              <div className="flex justify-center space-x-4">
                <div className="bg-schnicken-primary rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-schnicken-darkest font-bold">{playerNumbers.round2}</span>
                </div>
                <div className="bg-schnicken-accent rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-schnicken-darkest font-bold">{opponentNumbers.round2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <ActionButton
          onClick={handleClose}
          className="w-full py-3 text-lg"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
            </svg>
            Zurück zum Menü
          </div>
        </ActionButton>
      </div>
    </FullScreenLayout>
  );
};
