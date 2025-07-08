import React, { useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { supabase } from '../lib/supabaseClient';

/**
 * AutoRefreshHandler - A utility component that monitors for game events
 * and automatically refreshes the screen and navigates to the appropriate view
 * when action is required from the player.
 */
export const AutoRefreshHandler: React.FC = () => {
  const { navigateTo, currentView } = useAppState();
  const { actionRequired, actionType, resetActionNotification, refreshGames } = useGame();
  const { currentPlayer } = usePlayer();
  
  // Set up direct subscription to schnick_zahlen table for real-time updates
  useEffect(() => {
    if (!currentPlayer) return;
    
    console.log('Setting up direct subscription to schnick_zahlen table for Round 2 monitoring');
    
    // Subscribe specifically to zahlen changes which might indicate Round 2 results
    const zahlenChannel = supabase
      .channel('auto-refresh-zahlen')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'schnick_zahlen',
        }, 
        (payload) => {
          console.log('AutoRefreshHandler: Detected new zahl:', payload);
          
          // If this is a Round 2 number, refresh games to update UI
          if (payload.new && payload.new.runde === 2) {
            console.log('Round 2 number detected - triggering refresh');
            refreshGames();
            
            // Force navigation to menu to show the result
            if (currentView !== 'menu') {
              navigateTo('menu');
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(zahlenChannel);
    };
  }, [currentPlayer, currentView, navigateTo, refreshGames]);
  
  // Set up an interval to periodically check for updates as a fallback
  useEffect(() => {
    // Refresh games every 10 seconds to ensure we have the latest data
    const intervalId = setInterval(() => {
      refreshGames();
    }, 10000); // 10 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshGames]);
  
  // Handle action notifications
  useEffect(() => {
    if (!actionRequired || !actionType || !currentPlayer) return;
    
    console.log(`AutoRefreshHandler: Action required: ${actionType}`);
    
    // Perform immediate refresh to ensure we have the latest data
    const handleAction = async () => {
      await refreshGames();
      
      // Navigate based on action type
      switch (actionType) {
        case 'new_schnick':
          // A new game where the player is angeschnickter
          console.log('New schnick received - navigating to menu');
          if (currentView !== 'menu') {
            navigateTo('menu');
          }
          break;
          
        case 'round1_input_needed':
          // Player needs to enter round 1 number
          console.log('Round 1 input needed - navigating to menu');
          if (currentView !== 'menu') {
            navigateTo('menu');
          }
          break;
          
        case 'round2_input_needed':
          // Player needs to enter round 2 number
          console.log('Round 2 input needed - navigating to menu');
          if (currentView !== 'menu') {
            navigateTo('menu');
          }
          break;
          
        case 'result_available':
          // Game result is available
          console.log('Result available - navigating to menu');
          if (currentView !== 'menu') {
            navigateTo('menu');
          }
          break;
      }
      
      // Reset the notification after handling
      resetActionNotification();
    };
    
    handleAction();
  }, [actionRequired, actionType, currentPlayer, currentView, navigateTo, resetActionNotification, refreshGames]);
  
  // This component doesn't render anything
  return null;
};
