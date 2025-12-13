/**
 * Safe Bot Restart Script
 * Handles Telegram bot conflicts and provides clean restart
 */

const { spawn } = require('child_process');

console.log('🔄 Restarting CompliBot safely...\n');

// Wait a moment to ensure any previous instances are cleared
console.log('⏳ Waiting for previous bot instances to clear...');

setTimeout(() => {
    console.log('🚀 Starting CompliBot...\n');

    // Start the bot process
    const botProcess = spawn('npm', ['run', 'bot'], {
        stdio: 'inherit',
        shell: true
    });

    // Handle process events
    botProcess.on('error', (error) => {
        console.error('❌ Failed to start bot:', error.message);
    });

    botProcess.on('close', (code) => {
        console.log(`\n🔄 Bot process exited with code ${code}`);
        if (code === 1) {
            console.log('💡 If you see a 409 conflict error, wait 2-3 minutes and try again.');
            console.log('   Only one bot instance can run at a time.');
        }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping bot...');
        botProcess.kill('SIGINT');
        process.exit(0);
    });

}, 3000); // Wait 3 seconds