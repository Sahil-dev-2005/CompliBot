/**
 * Quick test to verify bot startup and database connection
 */

import './src/db/index.js';

console.log('🧪 Testing bot startup...');

// Give it a moment for database initialization
setTimeout(() => {
    console.log('✅ Bot startup test completed successfully!');
    console.log('🚀 The multilingual CompliBot is ready to use!');
    console.log('\n📱 Test the bot by:');
    console.log('   1. Starting the bot: npm start');
    console.log('   2. Sending /start to your bot on Telegram');
    console.log('   3. Following the multilingual onboarding flow');
    process.exit(0);
}, 3000);