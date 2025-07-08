/**
 * WhatsApp Notification Test Script
 * Sends sample notifications for each message type to verify format and delivery
 */
import { sendWhatsAppMessage, WhatsAppNotifications } from '../services/WhatsAppService';

/**
 * Sends a test message of each notification type with fictional data
 */
const sendTestMessages = async () => {
  console.log('Starting WhatsApp notification tests...');
  
  // Test 1: New Schnick Notification
  await sendWhatsAppMessage(
    WhatsAppNotifications.newSchnick(
      'Thomas', 
      'Philipp', 
      'Einen Handstand machen'
    )
  );
  console.log('✓ New Schnick notification sent');
  
  // Test 2: Bock Value Update
  await sendWhatsAppMessage(
    WhatsAppNotifications.bockUpdate(
      'Philipp',
      5
    )
  );
  console.log('✓ Bock update notification sent');
  
  // Test 3: Round 1 Submission - Waiting
  await sendWhatsAppMessage(
    WhatsAppNotifications.round1Submission(
      'Thomas',
      'Philipp'
    )
  );
  console.log('✓ Round 1 submission (waiting) notification sent');
  
  // Test 4: Round 1 Submission - Complete
  await sendWhatsAppMessage(
    WhatsAppNotifications.round1Submission(
      'Philipp',
      null
    )
  );
  console.log('✓ Round 1 submission (complete) notification sent');
  
  // Test 5: Round 2 Submission - Waiting
  await sendWhatsAppMessage(
    WhatsAppNotifications.round2Submission(
      'Thomas',
      'Philipp'
    )
  );
  console.log('✓ Round 2 submission (waiting) notification sent');
  
  // Test 6: Round 2 Submission - Complete
  await sendWhatsAppMessage(
    WhatsAppNotifications.round2Submission(
      'Philipp',
      null
    )
  );
  console.log('✓ Round 2 submission (complete) notification sent');
  
  // Test 7: Action Required - Bock Input
  await sendWhatsAppMessage(
    WhatsAppNotifications.actionRequired(
      'Philipp',
      'set_bock_value'
    )
  );
  console.log('✓ Action required (bock input) notification sent');
  
  // Test 8: Action Required - Round 1 Input
  await sendWhatsAppMessage(
    WhatsAppNotifications.actionRequired(
      'Thomas',
      'submit_round1_number'
    )
  );
  console.log('✓ Action required (round 1) notification sent');
  
  // Test 9: Action Required - Round 2 Input
  await sendWhatsAppMessage(
    WhatsAppNotifications.actionRequired(
      'Philipp',
      'submit_round2_number'
    )
  );
  console.log('✓ Action required (round 2) notification sent');
  
  // Test 10: Game Result - Schnicker Wins (Round 1)
  await sendWhatsAppMessage(
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
    )
  );
  console.log('✓ Game result (schnicker wins in round 1) notification sent');
  
  // Test 11: Game Result - Unentschieden (Round 2)
  await sendWhatsAppMessage(
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
    )
  );
  console.log('✓ Game result (tie in round 2) notification sent');
  
  // Test 12: Game Result - Eigentor (Round 2)
  await sendWhatsAppMessage(
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
    )
  );
  console.log('✓ Game result (eigentor in round 2) notification sent');
  
  console.log('All WhatsApp notification tests completed!');
};

// Run the tests when this file is executed directly
if (require.main === module) {
  sendTestMessages().catch(console.error);
}

export default sendTestMessages;
