/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CompliBot Backend API Server
 * Express.js REST API for GST Compliance Bot
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { initDatabase, healthCheck, getStats } from './db/index.js';
import { CronJobs } from './services/cronJobs.js';

// Import routes
import userRoutes from './routes/users.js';
import filingRoutes from './routes/filings.js';
import notificationRoutes from './routes/notifications.js';
import penaltyRoutes from './routes/penalties.js';
import itcRoutes from './routes/itc.js';
import analyticsRoutes from './routes/analytics.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
    const dbHealthy = healthCheck();
    const stats = getStats();
    
    res.json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
        stats: stats
    });
});

// API Documentation (root)
app.get('/', (req, res) => {
    res.json({
        name: 'CompliBot Backend API',
        version: '1.0.0',
        description: 'REST API for GST Compliance Tracking',
        endpoints: {
            health: 'GET /health',
            users: 'GET/POST /api/users',
            filings: 'GET/POST /api/filings',
            notifications: 'GET /api/notifications',
            penalties: 'GET /api/penalties',
            itc: 'GET/POST /api/itc',
            analytics: 'GET /api/analytics'
        },
        documentation: '/api/docs'
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/filings', filingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/itc', itcRoutes);
app.use('/api/analytics', analyticsRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

async function startServer() {
    try {
        // Initialize database
        console.log('🔄 Starting CompliBot Backend...');
        initDatabase();
        
        // Initialize cron jobs
        CronJobs.initialize();
        
        // Start Express server
        app.listen(PORT, () => {
            console.log('═══════════════════════════════════════════════════════');
            console.log('  CompliBot Backend API');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`  🚀 Server running on http://localhost:${PORT}`);
            console.log(`  📊 Health check: http://localhost:${PORT}/health`);
            console.log(`  📚 API Docs: http://localhost:${PORT}/`);
            console.log('═══════════════════════════════════════════════════════\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    CronJobs.stopAll();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    CronJobs.stopAll();
    process.exit(0);
});

// Start the server
startServer();

export default app;
