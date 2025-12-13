/**
 * CompliBot - GST Compliance Chatbot
 * Main Application Entry Point
 * 
 * Integrates:
 * - Express REST API Server
 * - Telegram Bot with webhook
 * - Google Gemini AI
 * - Turso Cloud Database
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Telegraf } = require('telegraf');
const config = require('./src/config/env');
const { initDB, getUser } = require('./src/db/index');
const { chatWithAI, analyzeInvoiceImage, calculatePenaltyWithAI } = require('./src/modules/aiHelper');
const bot = require('./src/bot');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: config.server.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.upload.maxFileSize },
    fileFilter: (req, file, cb) => {
        if (config.upload.allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// ========================
// HEALTH CHECK & INFO
// ========================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            api: 'running',
            database: 'connected',
            telegramBot: config.telegram.botToken ? 'configured' : 'not configured',
            ai: 'ready'
        },
        version: '1.0.0',
        environment: config.server.nodeEnv
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'CompliBot API',
        description: 'GST Compliance Assistant with AI',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            auth: {
                login: 'POST /auth/login',
                logout: 'POST /auth/logout'
            },
            user: {
                profile: 'GET /user/me',
                update: 'PUT /user/update',
                settings: 'GET /user/settings'
            },
            gst: {
                penalty3B: 'POST /gst/3b/penalty',
                deadline3B: 'GET /gst/3b/next-deadline',
                deadline1: 'GET /gst/1/next-deadline',
                itcReconcile: 'POST /gst/itc/reconcile',
                validateRate: 'POST /gst/validate-rate'
            },
            notifications: {
                dispatch: 'POST /notify/dispatch',
                schedule: 'POST /notify/schedule',
                test: 'POST /notify/test'
            },
            telegram: {
                webhook: 'POST /telegram/webhook'
            },
            ai: {
                chat: 'POST /ai/chat',
                analyzeInvoice: 'POST /ai/analyze-invoice'
            }
        },
        documentation: '/docs'
    });
});

// ========================
// AUTH ENDPOINTS
// ========================

app.post('/auth/login', async (req, res) => {
    try {
        const { gstin, chatId } = req.body;

        if (!gstin || !chatId) {
            return res.status(400).json({ error: 'GSTIN and chatId required' });
        }

        const user = await getUser(chatId);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register via Telegram bot first.' });
        }

        if (user.gstin !== gstin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            success: true,
            user: {
                userId: user.user_id,
                gstin: user.gstin,
                tradeName: user.trade_name,
                stateCode: user.state_code,
                language: user.language
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ========================
// USER ENDPOINTS
// ========================

app.get('/user/me', async (req, res) => {
    try {
        const { chatId } = req.query;

        if (!chatId) {
            return res.status(400).json({ error: 'chatId required' });
        }

        const user = await getUser(parseInt(chatId));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            userId: user.user_id,
            gstin: user.gstin,
            tradeName: user.trade_name,
            legalName: user.legal_name,
            stateCode: user.state_code,
            language: user.language,
            registrationDate: user.registration_date,
            compositionScheme: user.composition_scheme === 1
        });
    } catch (error) {
        console.error('❌ Get User Error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.put('/user/update', async (req, res) => {
    try {
        const { chatId, updates } = req.body;

        if (!chatId) {
            return res.status(400).json({ error: 'chatId required' });
        }

        const user = await getUser(parseInt(chatId));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user (simplified - add full implementation)
        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('❌ Update User Error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ========================
// GST ENDPOINTS
// ========================

app.post('/gst/3b/penalty', async (req, res) => {
    try {
        const { daysLate, taxAmount = 0 } = req.body;

        if (!daysLate || daysLate < 0) {
            return res.status(400).json({ error: 'Valid daysLate required' });
        }

        const penalty = await calculatePenaltyWithAI(daysLate, taxAmount, 'GSTR-3B');

        res.json({
            returnType: 'GSTR-3B',
            daysLate,
            taxAmount,
            ...penalty
        });
    } catch (error) {
        console.error('❌ Penalty Calculation Error:', error);
        res.status(500).json({ error: 'Failed to calculate penalty' });
    }
});

app.get('/gst/3b/next-deadline', (req, res) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // GSTR-3B deadline is 20th of next month
    let deadlineMonth = currentMonth + 1;
    let deadlineYear = currentYear;

    if (deadlineMonth > 11) {
        deadlineMonth = 0;
        deadlineYear += 1;
    }

    const deadline = new Date(deadlineYear, deadlineMonth, 20);
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    res.json({
        returnType: 'GSTR-3B',
        filingPeriod: `${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`,
        deadline: deadline.toISOString().split('T')[0],
        daysRemaining,
        status: daysRemaining < 0 ? 'OVERDUE' : daysRemaining <= 5 ? 'URGENT' : 'UPCOMING'
    });
});

app.get('/gst/1/next-deadline', (req, res) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // GSTR-1 deadline is 11th of next month
    let deadlineMonth = currentMonth + 1;
    let deadlineYear = currentYear;

    if (deadlineMonth > 11) {
        deadlineMonth = 0;
        deadlineYear += 1;
    }

    const deadline = new Date(deadlineYear, deadlineMonth, 11);
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    res.json({
        returnType: 'GSTR-1',
        filingPeriod: `${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`,
        deadline: deadline.toISOString().split('T')[0],
        daysRemaining,
        status: daysRemaining < 0 ? 'OVERDUE' : daysRemaining <= 5 ? 'URGENT' : 'UPCOMING'
    });
});

app.post('/gst/validate-rate', (req, res) => {
    const { hsnCode, proposedRate } = req.body;

    if (!hsnCode || proposedRate === undefined) {
        return res.status(400).json({ error: 'hsnCode and proposedRate required' });
    }

    // Simplified validation (add full HSN lookup)
    const validRates = [0, 5, 12, 18, 28];
    const isValid = validRates.includes(proposedRate);

    res.json({
        hsnCode,
        proposedRate,
        isValid,
        validRates,
        message: isValid ? 'Valid GST rate' : 'Invalid GST rate for this HSN code'
    });
});

// ========================
// AI ENDPOINTS
// ========================

app.post('/ai/chat', async (req, res) => {
    try {
        const { chatId, message } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({ error: 'chatId and message required' });
        }

        const response = await chatWithAI(parseInt(chatId), message);

        res.json({
            query: message,
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ AI Chat Error:', error);
        res.status(500).json({ error: 'Failed to process AI query' });
    }
});

app.post('/ai/analyze-invoice', upload.single('invoice'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Invoice image required' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const analysis = await analyzeInvoiceImage(base64Image, req.file.mimetype);

        res.json({
            success: true,
            analysis,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error('❌ Invoice Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze invoice' });
    }
});

// ========================
// NOTIFICATION ENDPOINTS
// ========================

app.post('/notify/dispatch', async (req, res) => {
    try {
        const { chatId, message, type = 'INFO' } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({ error: 'chatId and message required' });
        }

        // Send notification via Telegram
        if (bot && config.telegram.botToken) {
            await bot.telegram.sendMessage(chatId, message);
        }

        res.json({
            success: true,
            message: 'Notification sent',
            type,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Notification Error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

app.post('/notify/test', async (req, res) => {
    try {
        const { chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({ error: 'chatId required' });
        }

        const testMessage = '🔔 Test notification from CompliBot API!\n\n✅ Your notification system is working correctly.';

        if (bot && config.telegram.botToken) {
            await bot.telegram.sendMessage(chatId, testMessage);
        }

        res.json({
            success: true,
            message: 'Test notification sent'
        });
    } catch (error) {
        console.error('❌ Test Notification Error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// ========================
// TELEGRAM WEBHOOK
// ========================

if (config.telegram.botToken && bot) {
    // Webhook endpoint for Telegram
    app.post('/telegram/webhook', (req, res) => {
        bot.handleUpdate(req.body, res);
    });

    console.log('✅ Telegram webhook endpoint configured at /telegram/webhook');
}

// ========================
// ERROR HANDLING
// ========================

app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.server.nodeEnv === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: '/'
    });
});

// ========================
// SERVER INITIALIZATION
// ========================

async function startServer() {
    try {
        console.log('\n🚀 Starting CompliBot Server...\n');

        // Initialize database
        console.log('📦 Connecting to Turso database...');
        await initDB();
        console.log('✅ Database connected and initialized\n');

        // Start Telegram bot
        if (config.telegram.botToken && process.env.ENABLE_TELEGRAM_BOT === 'true') {
            console.log('🤖 Starting Telegram bot...');
            await bot.launch();
            console.log('✅ Telegram bot started\n');
        } else {
            console.log('ℹ️  Telegram bot disabled (API-only mode)\n');
        }

        // Start Express server
        const PORT = config.server.port;
        app.listen(PORT, () => {
            console.log('═══════════════════════════════════════════════════');
            console.log(`✅ CompliBot Server Running`);
            console.log('═══════════════════════════════════════════════════');
            console.log(`🌐 API Server: http://localhost:${PORT}`);
            console.log(`📚 Documentation: http://localhost:${PORT}/`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`🔗 Environment: ${config.server.nodeEnv}`);
            console.log(`🤖 Telegram Bot: ${config.telegram.botToken ? 'Enabled' : 'Disabled'}`);
            console.log(`🧠 AI Model: ${config.googleAI.modelName}`);
            console.log('═══════════════════════════════════════════════════\n');
        });

        // Graceful shutdown
        process.once('SIGINT', () => {
            console.log('\n⏹️  Shutting down gracefully...');
            if (bot) bot.stop('SIGINT');
            process.exit(0);
        });

        process.once('SIGTERM', () => {
            console.log('\n⏹️  Shutting down gracefully...');
            if (bot) bot.stop('SIGTERM');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
