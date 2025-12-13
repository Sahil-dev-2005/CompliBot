import { Scenes, Markup } from 'telegraf';
import { addUser } from '../db/index.js';

const { WizardScene } = Scenes;

// Multilingual messages
const messages = {
    en: {
        welcome: 'Please select your language / कृपया अपनी भाषा चुनें',
        businessName: 'What is your Business Name?',
        gstin: 'Please enter your 15-digit GSTIN',
        gstinInvalid: '⚠️ That doesn\'t look like a valid GSTIN. Please try again (e.g., 29ABCDE1234F1Z5).',
        setupComplete: '✅ Setup Complete! I am ready to help you file.',
        gstinExists: '⚠️ This GSTIN is already registered. Use /status to check your details.',
        userExists: '⚠️ You are already registered. Use /status to check your details.',
        invalidState: '⚠️ Invalid state code in GSTIN. Please check your GSTIN format.',
        registrationFailed: '❌ Registration failed. Please try /start again or contact support.',
        invalidLanguage: '⚠️ Please select a valid language option from the buttons below.'
    },
    hi: {
        welcome: 'कृपया अपनी भाषा चुनें / Please select your language',
        businessName: 'आपके व्यवसाय का नाम क्या है?',
        gstin: 'कृपया अपना 15-अंकीय GSTIN दर्ज करें',
        gstinInvalid: '⚠️ यह एक वैध GSTIN नहीं लगता। कृपया पुनः प्रयास करें (जैसे, 29ABCDE1234F1Z5)।',
        setupComplete: '✅ सेटअप पूरा! मैं आपकी फाइलिंग में मदद करने के लिए तैयार हूं।',
        gstinExists: '⚠️ यह GSTIN पहले से पंजीकृत है। अपना विवरण जांचने के लिए /status का उपयोग करें।',
        userExists: '⚠️ आप पहले से पंजीकृत हैं। अपना विवरण जांचने के लिए /status का उपयोग करें।',
        invalidState: '⚠️ GSTIN में अमान्य राज्य कोड। कृपया अपना GSTIN प्रारूप जांचें।',
        registrationFailed: '❌ पंजीकरण असफल। कृपया /start फिर से करें या सहायता से संपर्क करें।',
        invalidLanguage: '⚠️ कृपया नीचे दिए गए बटन से एक वैध भाषा विकल्प चुनें।'
    },
    kn: {
        welcome: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ / Please select your language',
        businessName: 'ನಿಮ್ಮ ವ್ಯಾಪಾರದ ಹೆಸರೇನು?',
        gstin: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ 15-ಅಂಕಿಯ GSTIN ಅನ್ನು ನಮೂದಿಸಿ',
        gstinInvalid: '⚠️ ಅದು ಮಾನ್ಯವಾದ GSTIN ಆಗಿ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ (ಉದಾ., 29ABCDE1234F1Z5).',
        setupComplete: '✅ ಸೆಟಪ್ ಪೂರ್ಣಗೊಂಡಿದೆ! ನಾನು ನಿಮ್ಮ ಫೈಲಿಂಗ್‌ಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ.',
        gstinExists: '⚠️ ಈ GSTIN ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು /status ಬಳಸಿ.',
        userExists: '⚠️ ನೀವು ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಿ. ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು /status ಬಳಸಿ.',
        invalidState: '⚠️ GSTIN ನಲ್ಲಿ ಅಮಾನ್ಯ ರಾಜ್ಯ ಕೋಡ್. ದಯವಿಟ್ಟು ನಿಮ್ಮ GSTIN ಸ್ವರೂಪವನ್ನು ಪರಿಶೀಲಿಸಿ.',
        registrationFailed: '❌ ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು /start ಮತ್ತೆ ಮಾಡಿ ಅಥವಾ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.',
        invalidLanguage: '⚠️ ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಬಟನ್‌ಗಳಿಂದ ಮಾನ್ಯವಾದ ಭಾಷಾ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.'
    }
};

const onboardingScene = new WizardScene(
    'onboarding',

    // ===========================
    // STEP 1: Language Selection (The Gatekeeper)
    // ===========================
    (ctx) => {
        const keyboard = Markup.keyboard([
            ['🇬🇧 English', '🇮🇳 हिन्दी'],
            ['🚩 ಕನ್ನಡ']
        ]).resize().persistent();

        ctx.reply(messages.en.welcome, keyboard);
        return ctx.wizard.next();
    },

    // ===========================
    // STEP 2: Business Name
    // ===========================
    (ctx) => {
        const text = ctx.message?.text;
        let language = 'en';

        // Match language selection
        if (text === '🇬🇧 English') {
            language = 'en';
        } else if (text === '🇮🇳 हिन्दी') {
            language = 'hi';
        } else if (text === '🚩 ಕನ್ನಡ') {
            language = 'kn';
        } else {
            // Invalid selection, stay in current step
            ctx.reply(messages.en.invalidLanguage);
            return;
        }

        // Save language to wizard state
        ctx.wizard.state.language = language;

        // Ask for business name in selected language
        ctx.reply(messages[language].businessName, Markup.removeKeyboard());
        return ctx.wizard.next();
    },

    // ===========================
    // STEP 3: GSTIN Collection
    // ===========================
    (ctx) => {
        const language = ctx.wizard.state.language || 'en';
        
        // Save business name
        ctx.wizard.state.trade_name = ctx.message?.text;

        // Ask for GSTIN
        ctx.reply(messages[language].gstin);
        return ctx.wizard.next();
    },

    // ===========================
    // STEP 4: Memory Commit & Handover
    // ===========================
    async (ctx) => {
        const language = ctx.wizard.state.language || 'en';
        const gstin = ctx.message?.text?.toUpperCase();

        // Basic Regex Validation for GSTIN (15 chars)
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstinRegex.test(gstin)) {
            ctx.reply(messages[language].gstinInvalid);
            return; // Stay in current step
        }

        // Extract State Code (First 2 digits of GSTIN)
        const stateCode = gstin.substring(0, 2);

        // Prepare User Object
        const newUser = {
            telegram_chat_id: ctx.chat.id,
            gstin: gstin,
            trade_name: ctx.wizard.state.trade_name,
            state_code: stateCode,
            language: language
        };

        try {
            // Save to DB
            await addUser(newUser);
            
            // Send success message and remove keyboard
            ctx.reply(messages[language].setupComplete, Markup.removeKeyboard());
            
            // Clean up wizard state to save memory
            delete ctx.wizard.state;
            
            return ctx.scene.leave(); // Exit the wizard
        } catch (err) {
            console.error('❌ Registration Error:', err);
            
            let errorMessage = messages[language].registrationFailed;
            
            if (err.message.includes('UNIQUE constraint failed: users.gstin')) {
                errorMessage = messages[language].gstinExists;
            } else if (err.message.includes('UNIQUE constraint failed: users.telegram_chat_id')) {
                errorMessage = messages[language].userExists;
            } else if (err.message.includes('FOREIGN KEY constraint failed')) {
                errorMessage = messages[language].invalidState;
            }
            
            ctx.reply(errorMessage, Markup.removeKeyboard());
            
            // Clean up wizard state
            delete ctx.wizard.state;
            
            return ctx.scene.leave();
        }
    }
);

export default onboardingScene;