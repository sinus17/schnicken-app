/**
 * WhatsAppService.ts
 * Service to send WhatsApp notifications via WHAPI API for game events
 */

const API_URL = 'https://gate.whapi.cloud';
const API_TOKEN = 'coRWJTwRGdqohY8gykipkezKA4SPO5dh';
const CHANNEL = 'ROCKET-24F79';
// Format for WhatsApp groups requires using the 'g.us' suffix
export const GROUP_ID = '120363394823396676@g.us';
const APP_URL = 'https://schnicken.netlify.app/';

interface WhatsAppResponse {
  sent: boolean;
  message: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Send a text message to the WhatsApp group
 * @param message The text message to send
 * @returns Promise with the API response
 */
export const sendWhatsAppMessage = async (message: string): Promise<WhatsAppResponse> => {
  try {
    // Fire and forget - don't wait for response to avoid blocking UI
    fetch(`${API_URL}/messages/text`, {
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
    }).then(response => {
      if (!response.ok) {
        response.json().then(errorData => {
          console.error('WhatsApp API error:', errorData);
        });
      } else {
        response.json().then(data => {
          console.log('WhatsApp message sent:', data);
        });
      }
    }).catch(error => {
      console.error('Failed to send WhatsApp message:', error);
    });
    
    // Return a dummy successful response to avoid blocking the UI
    return {
      sent: true,
      message: {
        id: 'async-' + Date.now().toString()
      }
    };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    // Still return success to avoid blocking the UI
    return {
      sent: true,
      message: {
        id: 'error-' + Date.now().toString()
      }
    };
  }
};

/**
 * Format notification messages for different game events
 */
export const WhatsAppNotifications = {
  /**
   * New Schnick notification
   */
  newSchnick: (schnicker: string, angeschnickter: string, aufgabe: string): string => {
    return `🎮 *NEUER SCHNICK* 🎮\n\n${schnicker} hat ${angeschnickter} angeschnickt!\n\nAufgabe: ${aufgabe}\n\nSpiel läuft...\n\n📱 Spiel öffnen: ${APP_URL}`;
  },

  /**
   * Bock value update notification
   */
  bockUpdate: (player: string, bockValue: number): string => {
    return `💰 *BOCK UPDATE* 💰\n\n${player} hat ${bockValue} Bock eingesetzt.\n\n📱 Spiel öffnen: ${APP_URL}`;
  },

  /**
   * Round 1 number submission notification
   */
  round1Submission: (player: string, waitingForPlayer: string | null): string => {
    const waitingMessage = waitingForPlayer 
      ? `\n\n⏳ Warte auf ${waitingForPlayer} für Runde 1...` 
      : '\n\nBeide Spieler haben ihre Zahl abgegeben!';
    return `🔢 *RUNDE 1 ZAHL* 🔢\n\n${player} hat eine Zahl für Runde 1 abgegeben.${waitingMessage}\n\n📱 Spiel öffnen: ${APP_URL}`;
  },

  /**
   * Round 2 number submission notification
   */
  round2Submission: (player: string, waitingForPlayer: string | null): string => {
    const waitingMessage = waitingForPlayer 
      ? `\n\n⏳ Warte auf ${waitingForPlayer} für Runde 2...` 
      : '\n\nBeide Spieler haben ihre Zahl abgegeben!';
    return `🔢 *RUNDE 2 ZAHL* 🔢\n\n${player} hat eine Zahl für Runde 2 abgegeben.${waitingMessage}\n\n📱 Spiel öffnen: ${APP_URL}`;
  },

  /**
   * Game result notification with complete game history
   */
  gameResult: (
    schnicker: string, 
    angeschnickter: string, 
    resultType: string, 
    round1Numbers: {player: string, number: number}[], 
    round2Numbers?: {player: string, number: number}[],
    aufgabe?: string,
    bockWert?: number
  ): string => {
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
  },
  
  /**
   * Action required notification with direct URL
   */
  actionRequired: (player: string, actionType: string): string => {
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
  }
};

export default { sendWhatsAppMessage, WhatsAppNotifications };
