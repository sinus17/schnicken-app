import React, { useEffect, useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { supabase } from '../lib/supabaseClient';

/**
 * AutoRefreshHandler - A utility component that monitors for game events
 * and automatically refreshes the screen and navigates to the appropriate view
 * when action is required from the player.
 */
// Input pages where we should not auto-refresh to avoid disturbing user input
const INPUT_VIEWS = ['create-game', 'game', 'round1-response', 'round2-response', 'schnicker-response'];

export const AutoRefreshHandler: React.FC = () => {
  const { navigateTo, currentView } = useAppState();
  const { actionRequired, actionType, resetActionNotification, refreshGames } = useGame();
  const { currentPlayer } = usePlayer();
  const [isInputPageActive, setIsInputPageActive] = useState(false);
  
  // Check if current view is an input page where refresh should be disabled
  useEffect(() => {
    setIsInputPageActive(INPUT_VIEWS.includes(currentView));
    console.log(`Current view: ${currentView}, input page active: ${INPUT_VIEWS.includes(currentView)}`);
  }, [currentView]);
  
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
            
            // If user is on an input page, don't navigate away
            if (isInputPageActive) {
              console.log('User is on an input page, not navigating away for Round 2 result');
              return;
            }
            
            // Force navigation to menu to show the result
            if (currentView !== 'menu') {
              console.log('Navigating to menu to show Round 2 result');
              navigateTo('menu');
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(zahlenChannel);
    };
  }, [currentPlayer, currentView, isInputPageActive, navigateTo, refreshGames]);
  
  // No longer using auto-refresh interval to reduce performance impact
  // Instead, we rely on real-time subscriptions and manual refresh
  // This helps prevent multiple Supabase client instances and unnecessary re-renders
  
  // Handle action notifications
  useEffect(() => {
    if (!actionRequired || !actionType || !currentPlayer) return;
    
    console.log(`AutoRefreshHandler: Action required: ${actionType}`);
    
    // If user is on an input page, don't disturb them unless it's critical
    if (isInputPageActive) {
      console.log(`User is on an input page, not interrupting for action: ${actionType}`);
      
      // Only these critical actions should interrupt user input
      const criticalActions = ['new_schnick']; 
      if (!criticalActions.includes(actionType)) {
        // For non-critical actions, just reset the notification without navigating
        resetActionNotification();
        return;
      }
      
      console.log('Critical action detected, will interrupt user input');
    }
    
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
  }, [actionRequired, actionType, currentPlayer, currentView, isInputPageActive, navigateTo, resetActionNotification, refreshGames]);
  
  // This component doesn't render anything
  return null;
};
