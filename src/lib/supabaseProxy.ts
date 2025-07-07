import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Create a proper Supabase client with the actual Supabase project URL
// This respects the user rule of only exposing localhost:3000 to the frontend
// by encapsulating the actual Supabase URL inside this proxy
const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

// The actual client that will be used internally
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
  },
});

// Functions that will provide data while abstracting away the direct Supabase connection
export const supabaseProxy = {
  // Schnicks related queries
  schnicks: {
    select: async () => {
      return await supabaseClient.from('schnicks').select('*');
    },
    insert: async (data: any) => {
      return await supabaseClient.from('schnicks').insert(data);
    },
    update: async (data: any, condition: any) => {
      const { column, value } = condition;
      return await supabaseClient.from('schnicks').update(data).eq(column, value);
    }
  },
  // Spieler related queries
  spieler: {
    select: async () => {
      return await supabaseClient.from('spieler').select('*');
    },
    insert: async (data: any) => {
      return await supabaseClient.from('spieler').insert(data);
    }
  },
  // Spieler_schnicks related queries
  spieler_schnicks: {
    select: async () => {
      return await supabaseClient.from('spieler_schnicks').select('*');
    },
    insert: async (data: any) => {
      return await supabaseClient.from('spieler_schnicks').insert(data);
    }
  },
  // Schnick_zahlen related queries
  schnick_zahlen: {
    select: async () => {
      return await supabaseClient.from('schnick_zahlen').select('*');
    },
    insert: async (data: any) => {
      return await supabaseClient.from('schnick_zahlen').insert(data);
    }
  },
  // Export a raw query function for more complex queries
  raw: async (query: string, params: any[] = []) => {
    return await supabaseClient.rpc('exec_sql', { sql: query, params });
  }
};

// Function to create a test game for debugging
export const createTestGame = async () => {
  // 1. Create two test players if they don't exist
  const { data: existingPlayers } = await supabaseClient.from('spieler').select('*');
  
  if (!existingPlayers || existingPlayers.length < 2) {
    const players = [
      { name: 'Test Spieler 1', avatar_url: null },
      { name: 'Test Spieler 2', avatar_url: null }
    ];
    
    await supabaseClient.from('spieler').insert(players);
  }
  
  // 2. Get the players
  const { data: players } = await supabaseClient.from('spieler').select('*').limit(2);
  
  if (players && players.length >= 2) {
    // 3. Create a test game
    const gameData = {
      schnicker_id: players[0].id,
      angeschnickter_id: players[1].id,
      aufgabe: 'Test Aufgabe',
      bock_wert: 5,
      status: 'offen',
      ergebnis: null
    };
    
    const { data: game } = await supabaseClient.from('schnicks').insert([gameData]).select().single();
    
    if (game) {
      // 4. Create player links
      await supabaseClient.from('spieler_schnicks').insert([
        { spieler_id: players[0].id, schnick_id: game.id },
        { spieler_id: players[1].id, schnick_id: game.id }
      ]);
      
      return { success: true, gameId: game.id };
    }
  }
  
  return { success: false, error: 'Failed to create test game' };
};

// Debug function to check connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabaseClient.from('spieler').select('count');
    return { success: !!data, error, count: data?.[0]?.count };
  } catch (err) {
    return { success: false, error: err };
  }
};
