// Script to check MVP statistics and see who has the most wins

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMVPStats() {
  console.log('🏆 Checking MVP Statistics...');

  try {
    // Get all finished games with player details
    const { data: finishedGames, error } = await supabase
      .from('schnicks')
      .select(`
        id,
        ergebnis,
        status,
        created_at,
        spieler_schnicker:schnicker_id (
          id,
          name
        ),
        spieler_angeschnickter:angeschnickter_id (
          id,
          name
        )
      `)
      .eq('status', 'beendet')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching finished games:', error);
      return;
    }

    console.log(`📊 Found ${finishedGames?.length || 0} finished games\n`);

    const playerWins = {};
    
    console.log('🎮 Game Details:');
    finishedGames?.forEach((game, index) => {
      const schnicker = game.spieler_schnicker;
      const angeschnickter = game.spieler_angeschnickter;
      
      console.log(`${index + 1}. ${schnicker?.name} vs ${angeschnickter?.name} → ${game.ergebnis}`);
      
      if (game.ergebnis === 'schnicker' && schnicker?.id) {
        // Schnicker won
        if (!playerWins[schnicker.id]) {
          playerWins[schnicker.id] = { name: schnicker.name, wins: 0 };
        }
        playerWins[schnicker.id].wins++;
        console.log(`   → ${schnicker.name} WINS! (Total: ${playerWins[schnicker.id].wins})`);
      } else if (game.ergebnis === 'angeschnickter' && angeschnickter?.id) {
        // Angeschnickter won
        if (!playerWins[angeschnickter.id]) {
          playerWins[angeschnickter.id] = { name: angeschnickter.name, wins: 0 };
        }
        playerWins[angeschnickter.id].wins++;
        console.log(`   → ${angeschnickter.name} WINS! (Total: ${playerWins[angeschnickter.id].wins})`);
      } else if (game.ergebnis === 'unentschieden') {
        console.log(`   → TIE, no winner`);
      }
    });

    console.log('\n🏆 Final MVP Statistics:');
    const sortedPlayers = Object.entries(playerWins)
      .map(([playerId, data]) => ({ playerId, ...data }))
      .sort((a, b) => b.wins - a.wins);

    if (sortedPlayers.length === 0) {
      console.log('No players have any wins yet!');
    } else {
      sortedPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        const mvp = index === 0 ? ' ← MVP!' : '';
        console.log(`${medal} ${player.name}: ${player.wins} wins${mvp}`);
      });
    }

    // Show overall statistics
    console.log('\n📈 Overall Game Results:');
    const resultStats = finishedGames?.reduce((acc, game) => {
      acc[game.ergebnis] = (acc[game.ergebnis] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(resultStats || {}).forEach(([result, count]) => {
      console.log(`   ${result}: ${count} games`);
    });

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
checkMVPStats();
