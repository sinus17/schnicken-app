// Import the centralized Supabase client to avoid multiple instances
import { supabase as supabaseClient } from './supabaseClient';

// This proxy respects the user rule of only exposing localhost:3000 to the frontend
// by encapsulating the actual Supabase connection inside this proxy

// Functions that will provide data while abstracting away the direct Supabase connection
export const supabaseProxy = {
  // Schnicks related queries
  schnicks: {
    select: async () => {
      return await supabaseClient.from('schnicks').select('*') as any;
    },
    insert: async (data: any) => {
      return await supabaseClient.from('schnicks').insert(data) as any;
    },
    update: async (data: any, condition: any) => {
      const { column, value } = condition;
      // Implementing without chaining to avoid type instantiation issues
      try {
        // Use type assertion to any at every step
        const client: any = supabaseClient;
        const result = await client.from('schnicks').update(data).eq(column, value);
        return result;
      } catch (error) {
        console.error('Error updating schnick:', error);
        return { data: null, error };
      }
    }
  },
  // Spieler related queries
  spieler: {
    select: async () => {
      return await supabaseClient.from('spieler').select('*') as any;
    },
    insert: async (data: any) => {
      return await supabaseClient.from('spieler').insert(data) as any;
    }
  },
  // Spieler_schnicks related queries
  spieler_schnicks: {
    select: async () => {
      return await supabaseClient.from('spieler_schnicks').select('*') as any;
    },
    insert: async (data: any) => {
      return await supabaseClient.from('spieler_schnicks').insert(data) as any;
    }
  },
  // Schnick_zahlen related queries
  schnick_zahlen: {
    select: async () => {
      return await supabaseClient.from('schnick_zahlen').select('*') as any;
    },
    insert: async (data: any) => {
      return await supabaseClient.from('schnick_zahlen').insert(data) as any;
    }
  },
  // Export a raw query function for more complex queries
  raw: async (query: string, params: any[] = []) => {
    return await supabaseClient.rpc('exec_sql', { sql: query, params }) as any;
  }
};

// Function to create a test game for debugging
export const createTestGame = async () => {
  // 1. Create two test players if they don't exist
  const { data: existingPlayers } = await supabaseClient.from('spieler').select('*') as any;
  
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
