// Script to retroactively fix game results based on correct rules
// Rule: Round 1 same numbers = angeschnickter loses (ergebnis should be 'schnicker')
// Rule: Round 2 same numbers = eigentor, schnicker loses (ergebnis should be 'angeschnickter')

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHistoricalResults() {
  console.log('🔧 Fixing historical game results based on correct rules...');

  try {
    // Get all finished games with their numbers
    const { data: finishedGames, error } = await supabase
      .from('schnicks')
      .select(`
        id,
        ergebnis,
        status,
        schnicker_id,
        angeschnickter_id,
        schnick_zahlen (
          zahl,
          spieler_id,
          created_at
        ),
        spieler_schnicker:schnicker_id (
          id,
          name
        ),
        spieler_angeschnickter:angeschnickter_id (
          id,
          name
        )
      `)
      .eq('status', 'beendet');

    if (error) {
      console.error('Error fetching finished games:', error);
      return;
    }

    console.log(`📊 Found ${finishedGames?.length || 0} finished games to analyze`);

    let correctedGames = 0;
    let analysisLog = [];

    for (const game of finishedGames || []) {
      const numbers = game.schnick_zahlen || [];
      
      if (numbers.length < 2) {
        console.log(`⚠️  Game ${game.id}: Not enough numbers (${numbers.length}), skipping`);
        continue;
      }

      // Sort numbers by creation time to get rounds in order
      const sortedNumbers = numbers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      if (numbers.length === 2) {
        // Round 1 finish: check if same numbers
        const [num1, num2] = sortedNumbers;
        const round1Same = num1.zahl === num2.zahl;
        
        analysisLog.push({
          gameId: game.id,
          schnicker: game.spieler_schnicker?.name,
          angeschnickter: game.spieler_angeschnickter?.name,
          currentResult: game.ergebnis,
          round1Numbers: [num1.zahl, num2.zahl],
          round1Same,
          correctResult: round1Same ? 'schnicker' : 'unentschieden',
          needsCorrection: round1Same && game.ergebnis !== 'schnicker'
        });

        if (round1Same && game.ergebnis !== 'schnicker') {
          console.log(`🎯 Game ${game.id}: Round 1 same numbers (${num1.zahl}=${num2.zahl}) should be 'schnicker', currently '${game.ergebnis}'`);
          
          const { error: updateError } = await supabase
            .from('schnicks')
            .update({ ergebnis: 'schnicker' })
            .eq('id', game.id);

          if (updateError) {
            console.error(`❌ Error updating game ${game.id}:`, updateError);
          } else {
            correctedGames++;
            console.log(`✅ Fixed game ${game.id}: ${game.ergebnis} → schnicker (Round 1 same numbers)`);
          }
        }
        
      } else if (numbers.length === 4) {
        // Round 2 finish: check round 2 numbers
        const round1Numbers = sortedNumbers.slice(0, 2);
        const round2Numbers = sortedNumbers.slice(2, 4);
        
        const round1Same = round1Numbers[0].zahl === round1Numbers[1].zahl;
        const round2Same = round2Numbers[0].zahl === round2Numbers[1].zahl;
        
        let correctResult = 'unentschieden'; // Default for round 2 different numbers
        
        if (round1Same) {
          // Should have ended in round 1
          correctResult = 'schnicker';
        } else if (round2Same) {
          // Eigentor in round 2
          correctResult = 'angeschnickter';
        }
        
        analysisLog.push({
          gameId: game.id,
          schnicker: game.spieler_schnicker?.name,
          angeschnickter: game.spieler_angeschnickter?.name,
          currentResult: game.ergebnis,
          round1Numbers: [round1Numbers[0].zahl, round1Numbers[1].zahl],
          round2Numbers: [round2Numbers[0].zahl, round2Numbers[1].zahl],
          round1Same,
          round2Same,
          correctResult,
          needsCorrection: game.ergebnis !== correctResult
        });

        if (game.ergebnis !== correctResult) {
          console.log(`🎯 Game ${game.id}: Should be '${correctResult}', currently '${game.ergebnis}'`);
          console.log(`   Round 1: ${round1Numbers[0].zahl} vs ${round1Numbers[1].zahl} (same: ${round1Same})`);
          console.log(`   Round 2: ${round2Numbers[0].zahl} vs ${round2Numbers[1].zahl} (same: ${round2Same})`);
          
          const { error: updateError } = await supabase
            .from('schnicks')
            .update({ ergebnis: correctResult })
            .eq('id', game.id);

          if (updateError) {
            console.error(`❌ Error updating game ${game.id}:`, updateError);
          } else {
            correctedGames++;
            console.log(`✅ Fixed game ${game.id}: ${game.ergebnis} → ${correctResult}`);
          }
        }
      }
    }

    console.log(`\n📈 Detailed Analysis Log:`);
    analysisLog.forEach(log => {
      if (log.needsCorrection) {
        console.log(`🔄 Game ${log.gameId}: ${log.schnicker} vs ${log.angeschnickter}`);
        console.log(`   Current: ${log.currentResult} → Correct: ${log.correctResult}`);
        if (log.round2Numbers) {
          console.log(`   R1: [${log.round1Numbers.join(',')}] R2: [${log.round2Numbers.join(',')}]`);
        } else {
          console.log(`   R1: [${log.round1Numbers.join(',')}] (same: ${log.round1Same})`);
        }
      }
    });

    console.log(`\n🏁 Summary:`);
    console.log(`   - Analyzed ${finishedGames?.length || 0} finished games`);
    console.log(`   - Corrected ${correctedGames} games with wrong results`);
    console.log(`   - Games needing correction: ${analysisLog.filter(l => l.needsCorrection).length}`);

    // Show final statistics
    const { data: finalStats } = await supabase
      .from('schnicks')
      .select('ergebnis')
      .eq('status', 'beendet');

    if (finalStats) {
      const stats = finalStats.reduce((acc, game) => {
        acc[game.ergebnis || 'null'] = (acc[game.ergebnis || 'null'] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Final result distribution:');
      Object.entries(stats).forEach(([result, count]) => {
        console.log(`   ${result}: ${count} games`);
      });
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
fixHistoricalResults();
