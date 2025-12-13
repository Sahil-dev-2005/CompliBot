import { Telegraf, session, Markup } from 'telegraf';
import dotenv from 'dotenv';
import stage from './scenes/index.js'; // <--- IMPORT THIS
import { getUser } from './db/index.js'; // <--- IMPORT THIS
import { analyzeIntent } from './modules/aiHelper.js';

dotenv.config();

if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN is missing from environment variables');
    throw new Error('❌ BOT_TOKEN is missing');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Log bot initialization
console.log('🤖 Telegram bot initialized with token:', process.env.BOT_TOKEN.substring(0, 10) + '...');

// Middleware
bot.use(session());
bot.use(stage.middleware()); // <--- ENABLE THIS

// Global Error Handling
bot.catch((err, ctx) => {
    console.error(`❌ Global Error:`, err);
    ctx.reply('⚠️ Oops, something went wrong.');
});

// START COMMAND (The Entry Point)
bot.start(async (ctx) => {
    try {
        console.log(`🤖 Bot start command from chat ID: ${ctx.chat.id}`);
        
        const existingUser = await getUser(ctx.chat.id);

        if (existingUser) {
            console.log(`👋 Returning user: ${existingUser.trade_name} (${existingUser.gstin})`);
            ctx.reply(`👋 Welcome back, ${existingUser.trade_name}!\n\nUse /status to check filing status.`);
        } else {
            console.log(`🆕 New user starting onboarding for chat ID: ${ctx.chat.id}`);
            ctx.scene.enter('onboarding');
        }
    } catch (error) {
        console.error('❌ Error in bot start command:', error);
        ctx.reply('⚠️ Sorry, there was an error processing your request. Please try again.');
    }
});

// Status command to check user registration (multilingual)
bot.command('status', async (ctx) => {
    try {
        const user = await getUser(ctx.chat.id);
        if (user) {
            const statusMessages = {
                en: `📊 *Your Status*\n\nBusiness: ${user.trade_name}\nGSTIN: ${user.gstin}\nState: ${user.state_code}\nLanguage: ${user.language}\nRegistered: ${user.registration_date || 'N/A'}\n\n✅ You can now use the web dashboard!`,
                hi: `📊 *आपकी स्थिति*\n\nव्यवसाय: ${user.trade_name}\nGSTIN: ${user.gstin}\nराज्य: ${user.state_code}\nभाषा: ${user.language}\nपंजीकृत: ${user.registration_date || 'N/A'}\n\n✅ अब आप वेब डैशबोर्ड का उपयोग कर सकते हैं!`,
                kn: `📊 *ನಿಮ್ಮ ಸ್ಥಿತಿ*\n\nವ್ಯಾಪಾರ: ${user.trade_name}\nGSTIN: ${user.gstin}\nರಾಜ್ಯ: ${user.state_code}\nಭಾಷೆ: ${user.language}\nನೋಂದಾಯಿಸಲಾಗಿದೆ: ${user.registration_date || 'N/A'}\n\n✅ ಈಗ ನೀವು ವೆಬ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಬಳಸಬಹುದು!`
            };
            
            const message = statusMessages[user.language] || statusMessages.en;
            ctx.reply(message, { parse_mode: 'Markdown' });
        } else {
            ctx.reply('❌ You are not registered yet. Please use /start to begin registration.');
        }
    } catch (error) {
        console.error('❌ Error in status command:', error);
        ctx.reply('⚠️ Error retrieving your status. Please try again.');
    }
});

// Helper Command to clear session/DB for testing (Optional)
bot.command('reset', (ctx) => {
    // You might want to add a deleteUser function to db/index.js for this
    ctx.reply('Debug: Please manually delete your row in the users table to reset.');
});

// Demo command to show helper integration
bot.command('demo', async (ctx) => {
    try {
        const user = await getUser(ctx.chat.id);
        if (!user) {
            ctx.reply('❌ Please register first using /start');
            return;
        }

        // Import helpers (Context Injector pattern)
        const { generateSMS } = await import('./modules/smsHelper.js');
        const { generateGSTJson } = await import('./modules/jsonHelper.js');

        // Bot acts as Context Injector - fetches data and passes to helpers
        const smsData = {
            gstin: user.gstin,
            trade_name: user.trade_name,
            type: 'filing_reminder',
            month: '102025',
            language: user.language
        };

        const jsonData = {
            gstin: user.gstin,
            trade_name: user.trade_name,
            fp: '102025',
            return_type: 'GSTR3B',
            summary: {
                total_taxable: 100000,
                total_igst: 18000,
                total_cgst: 0,
                total_sgst: 0
            }
        };

        // Generate outputs using helpers
        const smsContent = generateSMS(smsData);
        const gstJson = generateGSTJson(jsonData);

        ctx.reply(`🔧 *Helper Demo*\n\n📱 *SMS Output:*\n${smsContent}\n\n📄 *JSON Sample:*\n\`\`\`json\n${JSON.stringify(gstJson, null, 2).substring(0, 500)}...\n\`\`\``, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('❌ Error in demo command:', error);
        ctx.reply('⚠️ Error running demo. Please try again.');
    }
});

bot.on('text', async (ctx) => {
    // Ignore commands (starting with /)
    if (ctx.message.text.startsWith('/')) return;

    // Show "typing..." status while AI thinks
    ctx.sendChatAction('typing');

    const analysis = await analyzeIntent(ctx.message.text);

    switch (analysis.intent) {
        case 'FILE_RETURN':
            ctx.reply("📂 It looks like you want to file a return. Let's get started!");
            // TODO: Trigger the Filing Scene here later
            // ctx.scene.enter('filing_wizard'); 
            break;

        case 'STATUS_CHECK':
            // We can call the DB here immediately!
            ctx.reply("📊 Checking your filing status... (Feature coming in next commit)");
            break;

        case 'KNOWLEDGE_QUERY':
        case 'GREETING':
            // Just reply with what Gemini generated
            ctx.reply(analysis.reply);
            break;

        default:
            ctx.reply("I didn't quite catch that. Try saying 'File my return' or ask about GST penalties.");
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;