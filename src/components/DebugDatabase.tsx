import { useState } from 'react';
import { supabase } from '../lib/supabase';

type DebugResult = {
  schnicks: any[];
  spielerSchnicks: any[];
  players: any[];
  zahlen: any[];
  error: string | null;
  loading: boolean;
};

export const DebugDatabase = () => {
  const [debugResult, setDebugResult] = useState<any>({
    schnicks: [],
    spielerSchnicks: [],
    players: [],
    zahlen: [],
    error: null,
    loading: false
  });

  const runDebugQuery = async () => {
    setDebugResult((prev: any) => ({ ...prev, loading: true }));
    
    try {
      // Direct query to check schnicks
      const { data: schnicks, error: schnicksError } = await supabase
        .from('schnicks')
        .select('*')
        .order('created_at', { ascending: false });

      if (schnicksError) {
        console.error('Error querying schnicks:', schnicksError);
        setDebugResult((prev: any) => ({ 
          ...prev, 
          error: schnicksError.message,
          loading: false 
        }));
        return;
      }
      
      console.log('Found schnicks:', schnicks);
      
      // Get all spieler_schnicks relationships
      let spielerSchnicks: any[] = [];
      let players: any[] = [];
      let zahlen: any[] = [];
      
      if (schnicks && schnicks.length > 0) {
        const schnickIds = schnicks.map((s: any) => s.id);
        
        const { data: spielerSchnickData, error: spielerSchnickError } = await supabase
          .from('spieler_schnicks')
          .select('*')
          .in('schnick_id', schnickIds);
          
        if (!spielerSchnickError && spielerSchnickData) {
          spielerSchnicks = spielerSchnickData;
          
          // Get all player IDs
          const playerIds = [...new Set(spielerSchnickData.map((ps: any) => ps.spieler_id))];
          
          const { data: playerData, error: playerError } = await supabase
            .from('spieler')
            .select('*')
            .in('id', playerIds);
            
          if (!playerError && playerData) {
            players = playerData;
          }
        }
        
        // Get all zahlen
        const { data: zahlenData, error: zahlenError } = await supabase
          .from('schnick_zahlen')
          .select('*')
          .in('schnick_id', schnickIds);
          
        if (!zahlenError && zahlenData) {
          zahlen = zahlenData;
        }
      }
      
      // Update debug results
      setDebugResult({
        schnicks,
        spielerSchnicks,
        players,
        zahlen,
        error: null,
        loading: false
      });
      
    } catch (error: any) {
      console.error('Error in debug query:', error);
      setDebugResult((prev: any) => ({ 
        ...prev, 
        error: error.message,
        loading: false 
      }));
    }
  };
  
  // Create test data
  const createTestData = async () => {
    setDebugResult((prev: any) => ({ ...prev, loading: true }));
    
    try {
      // 1. First check if there are any players
      const { data: existingPlayers, error: playerCheckError } = await supabase
        .from('spieler')
        .select('*')
        .limit(2);
        
      if (playerCheckError) {
        throw new Error(`Error checking players: ${playerCheckError.message}`);
      }
      
      // Create players if needed
      let player1;
      let player2;
      
      if (!existingPlayers || existingPlayers.length < 2) {
        console.log('Creating test players');
        
        const { data: newPlayers, error: createPlayerError } = await supabase
          .from('spieler')
          .insert([
            { name: `Test Player 1 - ${new Date().getTime()}` },
            { name: `Test Player 2 - ${new Date().getTime()}` }
          ])
          .select();
          
        if (createPlayerError || !newPlayers) {
          throw new Error(`Error creating players: ${createPlayerError?.message}`);
        }
        
        player1 = newPlayers[0];
        player2 = newPlayers[1];
      } else {
        player1 = existingPlayers[0];
        player2 = existingPlayers[1];
      }
      
      // 2. Create a new test schnick
      const { data: schnick, error: schnickError } = await supabase
        .from('schnicks')
        .insert({
          aufgabe: `Debug Schnick ${new Date().toLocaleTimeString()}`,
          status: 'offen',
          ergebnis: null,
          bock_wert: 1
        })
        .select();
        
      if (schnickError || !schnick) {
        throw new Error(`Error creating schnick: ${schnickError?.message}`);
      }
      
      console.log('Created test schnick:', schnick);
      
      // 3. Link players to the schnick
      const { error: linkError } = await supabase
        .from('spieler_schnicks')
        .insert([
          { schnick_id: schnick[0].id, spieler_id: player1.id },
          { schnick_id: schnick[0].id, spieler_id: player2.id }
        ]);
        
      if (linkError) {
        throw new Error(`Error linking players to schnick: ${linkError.message}`);
      }
      
      console.log('Test data created successfully');
      runDebugQuery();
      
    } catch (error: any) {
      console.error('Error creating test data:', error);
      setDebugResult(prev => ({ 
        ...prev, 
        error: `Error creating test data: ${error.message}`,
        loading: false 
      }));
    }
  };
  
  return (
    <div className="fixed bottom-0 right-0 p-4 w-full max-w-lg bg-black/80 border border-gray-700 rounded-tl-lg z-50 text-white text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Database Debug</h3>
        <div className="space-x-2">
          <button 
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            onClick={runDebugQuery}
            disabled={debugResult.loading}
          >
            {debugResult.loading ? 'Loading...' : 'Query DB'}
          </button>
          <button 
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
            onClick={createTestData}
            disabled={debugResult.loading}
          >
            Create Test Data
          </button>
        </div>
      </div>
      
      {debugResult.error && (
        <div className="bg-red-800/50 p-2 rounded mb-2">
          Error: {debugResult.error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <h4 className="font-semibold border-b border-gray-600 mb-1">Schnicks ({debugResult.schnicks.length})</h4>
          <div className="max-h-40 overflow-auto">
            {debugResult.schnicks.map((schnick: any) => (
              <div key={schnick.id} className="mb-1 border-l-2 border-blue-500 pl-1">
                <div>{schnick.id.substring(0, 8)}...</div>
                <div>Status: {schnick.status}</div>
                <div>Aufgabe: {schnick.aufgabe}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold border-b border-gray-600 mb-1">Spieler-Schnicks ({debugResult.spielerSchnicks.length})</h4>
          <div className="max-h-40 overflow-auto">
            {debugResult.spielerSchnicks.map((ps: any) => (
              <div key={`${ps.schnick_id}-${ps.spieler_id}`} className="mb-1 border-l-2 border-green-500 pl-1">
                <div>Schnick: {ps.schnick_id.substring(0, 8)}...</div>
                <div>Spieler: {ps.spieler_id.substring(0, 8)}...</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold border-b border-gray-600 mb-1">Players ({debugResult.players.length})</h4>
          <div className="max-h-40 overflow-auto">
            {debugResult.players.map((player: any) => (
              <div key={player.id} className="mb-1 border-l-2 border-yellow-500 pl-1">
                <div>{player.id.substring(0, 8)}...</div>
                <div>Name: {player.name}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold border-b border-gray-600 mb-1">Zahlen ({debugResult.zahlen.length})</h4>
          <div className="max-h-40 overflow-auto">
            {debugResult.zahlen.map((zahl: any) => (
              <div key={zahl.id} className="mb-1 border-l-2 border-purple-500 pl-1">
                <div>Schnick: {zahl.schnick_id.substring(0, 8)}...</div>
                <div>Spieler: {zahl.spieler_id.substring(0, 8)}...</div>
                <div>Runde: {zahl.runde}, Zahl: {zahl.zahl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
