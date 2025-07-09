// Script to fix incorrect game results in the database
// Run with: node src/scripts/fix-game-results.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGameResults() {
  console.log('🔧 Fixing game results...');

  try {
    // 1. Fix simple cases: convert 'schnicker_won' to 'schnicker' and 'angeschnickter_won' to 'angeschnickter'
    console.log('📝 Fixing simple result format issues...');
    
    const { data: schnicker_won_games, error: error1 } = await supabase
      .from('schnicks')
      .update({ ergebnis: 'schnicker' })
      .eq('ergebnis', 'schnicker_won')
      .select('id');

    if (error1) {
      console.error('Error fixing schnicker_won games:', error1);
    } else {
      console.log(`✅ Fixed ${schnicker_won_games?.length || 0} games with 'schnicker_won' result`);
    }

    const { data: angeschnickter_won_games, error: error2 } = await supabase
      .from('schnicks')
      .update({ ergebnis: 'angeschnickter' })
      .eq('ergebnis', 'angeschnickter_won')
      .select('id');

    if (error2) {
      console.error('Error fixing angeschnickter_won games:', error2);
    } else {
      console.log(`✅ Fixed ${angeschnickter_won_games?.length || 0} games with 'angeschnickter_won' result`);
    }

    // 2. Get all finished games and their numbers to check for incorrect tie results
    console.log('🔍 Checking for incorrectly marked tie games...');
    
    const { data: finishedGames, error: error3 } = await supabase
      .from('schnicks')
      .select(`
        id,
        ergebnis,
        status,
        schnick_zahlen (
          zahl,
          spieler_id,
          created_at
        )
      `)
      .eq('status', 'beendet');

    if (error3) {
      console.error('Error fetching finished games:', error3);
      return;
    }

    console.log(`📊 Found ${finishedGames?.length || 0} finished games`);

    let fixedGames = 0;

    for (const game of finishedGames || []) {
      const numbers = game.schnick_zahlen || [];
      
      if (numbers.length === 2) {
        // Round 1 finish: both players had same number
        const [num1, num2] = numbers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        if (num1.zahl === num2.zahl && game.ergebnis === 'unentschieden') {
          // This should be schnicker win (angeschnickter loses when same numbers in round 1)
          console.log(`🎯 Game ${game.id}: Round 1 tie should be schnicker win (${num1.zahl} = ${num2.zahl})`);
          
          const { error: updateError } = await supabase
            .from('schnicks')
            .update({ ergebnis: 'schnicker' })
            .eq('id', game.id);

          if (updateError) {
            console.error(`❌ Error updating game ${game.id}:`, updateError);
          } else {
            fixedGames++;
            console.log(`✅ Fixed game ${game.id}: unentschieden → schnicker`);
          }
        }
      } else if (numbers.length === 4) {
        // Round 2 finish: check round 2 numbers
        const round2Numbers = numbers.slice(2).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        if (round2Numbers.length === 2) {
          const [num1, num2] = round2Numbers;
          
          if (num1.zahl === num2.zahl && game.ergebnis === 'schnicker') {
            // This should be angeschnickter win (eigentor when same numbers in round 2)
            console.log(`🎯 Game ${game.id}: Round 2 eigentor should be angeschnickter win (${num1.zahl} = ${num2.zahl})`);
            
            const { error: updateError } = await supabase
              .from('schnicks')
              .update({ ergebnis: 'angeschnickter' })
              .eq('id', game.id);

            if (updateError) {
              console.error(`❌ Error updating game ${game.id}:`, updateError);
            } else {
              fixedGames++;
              console.log(`✅ Fixed game ${game.id}: schnicker → angeschnickter (eigentor)`);
            }
          }
        }
      }
    }

    console.log(`\n🏁 Summary:`);
    console.log(`   - Fixed ${fixedGames} incorrectly marked tie/eigentor games`);
    console.log(`   - Fixed ${schnicker_won_games?.length || 0} 'schnicker_won' format issues`);
    console.log(`   - Fixed ${angeschnickter_won_games?.length || 0} 'angeschnickter_won' format issues`);

    // 3. Show final statistics
    const { data: finalStats, error: error4 } = await supabase
      .from('schnicks')
      .select('ergebnis')
      .eq('status', 'beendet');

    if (finalStats) {
      const stats = finalStats.reduce((acc, game) => {
        acc[game.ergebnis || 'null'] = (acc[game.ergebnis || 'null'] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Final result distribution:');
      Object.entries(stats).forEach(([result, count]) => {
        console.log(`   ${result}: ${count} games`);
      });
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
fixGameResults();
