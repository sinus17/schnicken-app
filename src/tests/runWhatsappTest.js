/**
 * Simple runner for WhatsApp notification tests
 * This script is designed to run outside of the React environment
 * to avoid performance issues with the main app
 */

// Mock the WhatsApp service functions for direct testing
const APP_URL = 'https://schnicken.netlify.app/';
const API_URL = 'https://gate.whapi.cloud';
const API_TOKEN = 'coRWJTwRGdqohY8gykipkezKA4SPO5dh';
const CHANNEL = 'ROCKET-24F79';
// Format for WhatsApp groups requires using the 'g.us' format
const GROUP_ID = '120363394823396676@g.us';

// Actual implementation to directly send messages
const sendWhatsAppMessage = async (message) => {
  try {
    const response = await fetch(`${API_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'X-Channel': CHANNEL
      },
      body: JSON.stringify({
        to: GROUP_ID,
        body: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Message sent successfully:', data.message?.id);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
};

// Mock notification functions
const WhatsAppNotifications = {
  newSchnick: (schnicker, angeschnickter, aufgabe) => {
    return `🎮 *NEUER SCHNICK* 🎮\n\n${schnicker} hat ${angeschnickter} angeschnickt!\n\nAufgabe: ${aufgabe}\n\nSpiel läuft...\n\n📱 Spiel öffnen: ${APP_URL}`;
  },
  
  bockUpdate: (player, bockValue) => {
    return `💰 *BOCK UPDATE* 💰\n\n${player} hat ${bockValue} Bock eingesetzt.\n\n📱 Spiel öffnen: ${APP_URL}`;
  },
  
  round1Submission: (player, waitingForPlayer) => {
    const waitingMessage = waitingForPlayer 
      ? `\n\n⏳ Warte auf ${waitingForPlayer} für Runde 1...` 
      : '\n\nBeide Spieler haben ihre Zahl abgegeben!';
    return `🔢 *RUNDE 1 ZAHL* 🔢\n\n${player} hat eine Zahl für Runde 1 abgegeben.${waitingMessage}\n\n📱 Spiel öffnen: ${APP_URL}`;
  },
  
  round2Submission: (player, waitingForPlayer) => {
    const waitingMessage = waitingForPlayer 
      ? `\n\n⏳ Warte auf ${waitingForPlayer} für Runde 2...` 
      : '\n\nBeide Spieler haben ihre Zahl abgegeben!';
    return `🔢 *RUNDE 2 ZAHL* 🔢\n\n${player} hat eine Zahl für Runde 2 abgegeben.${waitingMessage}\n\n📱 Spiel öffnen: ${APP_URL}`;
  },
  
  actionRequired: (player, actionType) => {
    let actionDescription = '';
    let emoji = '⚠️';
    
    switch(actionType) {
      case 'set_bock_value':
      case 'bock_input_needed':
        actionDescription = 'einen Bock-Wert einzugeben';
        emoji = '💰';
        break;
      case 'submit_round1_number':
      case 'round1_input_needed':
        actionDescription = 'eine Zahl für Runde 1 abzugeben';
        emoji = '1️⃣';
        break;
      case 'submit_round2_number':
      case 'round2_input_needed':
        actionDescription = 'eine Zahl für Runde 2 abzugeben';
        emoji = '2️⃣';
        break;
      default:
        actionDescription = 'zu handeln';
        break;
    }
    
    return `${emoji} *AKTION ERFORDERLICH* ${emoji}\n\n${player} muss ${actionDescription}!\n\n🔔 Bitte öffne die App und reagiere:\n${APP_URL}`;
  },
  
  gameResult: (
    schnicker, 
    angeschnickter, 
    resultType, 
    round1Numbers, 
    round2Numbers,
    aufgabe,
    bockWert
  ) => {
    let resultMessage = '';
    let winner = '';
    let loser = '';
    
    switch(resultType) {
      case 'schnicker_won':
        resultMessage = `${schnicker} hat gewonnen! ${angeschnickter} muss die Aufgabe erfüllen.`;
        winner = schnicker;
        loser = angeschnickter;
        break;
      case 'angeschnickter_won':
        resultMessage = `${angeschnickter} hat gewonnen! Keine Aufgabe wird erfüllt.`;
        winner = angeschnickter;
        break;
      case 'eigentor':
      case 'schnicker':
        resultMessage = `Eigentor! ${schnicker} muss die eigene Aufgabe erfüllen.`;
        winner = angeschnickter;
        loser = schnicker;
        break;
      case 'unentschieden':
      case 'no_winner':
        resultMessage = `Unentschieden! Keine Aufgabe wird erfüllt.`;
        break;
    }
    
    let message = `🏆 *SPIELERGEBNIS* 🏆\n\n`;
    
    // Game summary
    message += `*Schnick:* ${schnicker} → ${angeschnickter}\n`;
    if (aufgabe) message += `*Aufgabe:* ${aufgabe}\n`;
    if (bockWert) message += `*Bock-Wert:* ${bockWert}\n`;
    
    // Result
    message += `\n*Ergebnis:* ${resultMessage}\n\n`;
    
    // Round details
    message += "*Runde 1 Zahlen:*\n";
    round1Numbers.forEach(entry => {
      message += `- ${entry.player}: ${entry.number}\n`;
    });
    
    if (round2Numbers && round2Numbers.length > 0) {
      message += "\n*Runde 2 Zahlen:*\n";
      round2Numbers.forEach(entry => {
        message += `- ${entry.player}: ${entry.number}\n`;
      });
    }
    
    // Final result
    if (loser) {
      message += `\n🏆 ${winner} hat gewonnen! ${loser} muss die Aufgabe erfüllen.`;
    } else if (winner) {
      message += `\n🏆 ${winner} hat gewonnen!`;
    } else {
      message += "\n🤝 Unentschieden - Keine Aufgabe wird erfüllt.";
    }
    
    // App link
    message += `\n\n📱 Zum Spiel: ${APP_URL}`;
    
    return message;
  }
};

/**
 * Sends test messages with a delay between each to avoid rate limits
 */
async function sendTestMessages() {
  console.log('Starting WhatsApp notification tests...');
  
  // Add delay between messages to avoid rate limiting
  const sendWithDelay = async (message, description) => {
    console.log(`Sending: ${description}...`);
    const result = await sendWhatsAppMessage(message);
    console.log(result ? '✓ Sent successfully' : '✗ Failed to send');
    // Wait 1 second between messages to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  };
  
  // Test 1: New Schnick Notification
  await sendWithDelay(
    WhatsAppNotifications.newSchnick(
      'Thomas', 
      'Philipp', 
      'Einen Handstand machen'
    ),
    'New Schnick notification'
  );
  
  // Test 2: Bock Value Update
  await sendWithDelay(
    WhatsAppNotifications.bockUpdate(
      'Philipp',
      5
    ),
    'Bock update notification'
  );
  
  // Test 3: Round 1 Submission - Waiting
  await sendWithDelay(
    WhatsAppNotifications.round1Submission(
      'Thomas',
      'Philipp'
    ),
    'Round 1 submission (waiting) notification'
  );
  
  // Test 4: Round 1 Submission - Complete
  await sendWithDelay(
    WhatsAppNotifications.round1Submission(
      'Philipp',
      null
    ),
    'Round 1 submission (complete) notification'
  );
  
  // Test 5: Round 2 Submission - Waiting
  await sendWithDelay(
    WhatsAppNotifications.round2Submission(
      'Thomas',
      'Philipp'
    ),
    'Round 2 submission (waiting) notification'
  );
  
  // Test 6: Round 2 Submission - Complete
  await sendWithDelay(
    WhatsAppNotifications.round2Submission(
      'Philipp',
      null
    ),
    'Round 2 submission (complete) notification'
  );
  
  // Test 7: Action Required - Bock Input
  await sendWithDelay(
    WhatsAppNotifications.actionRequired(
      'Philipp',
      'set_bock_value'
    ),
    'Action required (bock input) notification'
  );
  
  // Test 8: Action Required - Round 1 Input
  await sendWithDelay(
    WhatsAppNotifications.actionRequired(
      'Thomas',
      'submit_round1_number'
    ),
    'Action required (round 1) notification'
  );
  
  // Test 9: Action Required - Round 2 Input
  await sendWithDelay(
    WhatsAppNotifications.actionRequired(
      'Philipp',
      'submit_round2_number'
    ),
    'Action required (round 2) notification'
  );
  
  // Test 10: Game Result - Schnicker Wins (Round 1)
  await sendWithDelay(
    WhatsAppNotifications.gameResult(
      'Thomas', 
      'Philipp',
      'schnicker_won',
      [
        { player: 'Thomas', number: 3 },
        { player: 'Philipp', number: 3 }
      ],
      undefined,
      'Einen Handstand machen',
      5
    ),
    'Game result (schnicker wins in round 1) notification'
  );
  
  // Test 11: Game Result - Unentschieden (Round 2)
  await sendWithDelay(
    WhatsAppNotifications.gameResult(
      'Thomas', 
      'Philipp',
      'unentschieden',
      [
        { player: 'Thomas', number: 2 },
        { player: 'Philipp', number: 1 }
      ],
      [
        { player: 'Thomas', number: 4 },
        { player: 'Philipp', number: 3 }
      ],
      'Einen Handstand machen',
      5
    ),
    'Game result (tie in round 2) notification'
  );
  
  // Test 12: Game Result - Eigentor (Round 2)
  await sendWithDelay(
    WhatsAppNotifications.gameResult(
      'Thomas', 
      'Philipp',
      'schnicker',
      [
        { player: 'Thomas', number: 2 },
        { player: 'Philipp', number: 1 }
      ],
      [
        { player: 'Thomas', number: 3 },
        { player: 'Philipp', number: 3 }
      ],
      'Einen Handstand machen',
      5
    ),
    'Game result (eigentor in round 2) notification'
  );
  
  console.log('All WhatsApp notification tests completed!');
}

// Required for fetch in Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Run the tests
sendTestMessages().catch(console.error);
