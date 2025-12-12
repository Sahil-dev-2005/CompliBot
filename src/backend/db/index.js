/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Database Initialization Module
 * ═══════════════════════════════════════════════════════════════════════════
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../../data/complibot.db');

let db = null;

/**
 * Initialize database connection and create tables
 */
export function initDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Create database connection
        db = new Database(DB_PATH, { verbose: console.log });
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        // Enable WAL mode for better concurrency
        db.pragma('journal_mode = WAL');
        
        // Read and execute schema
        const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
        db.exec(schema);
        
        console.log('✅ Database initialized successfully');
        console.log(`📁 Database location: ${DB_PATH}`);
        
        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Get database instance
 */
export function getDatabase() {
    if (!db) {
        return initDatabase();
    }
    return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('✅ Database connection closed');
    }
}

/**
 * Execute a query and return results
 */
export function query(sql, params = []) {
    const database = getDatabase();
    try {
        return database.prepare(sql).all(params);
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

/**
 * Execute a query and return single row
 */
export function queryOne(sql, params = []) {
    const database = getDatabase();
    try {
        return database.prepare(sql).get(params);
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

/**
 * Execute an insert/update/delete query
 */
export function execute(sql, params = []) {
    const database = getDatabase();
    try {
        return database.prepare(sql).run(params);
    } catch (error) {
        console.error('Execute error:', error);
        throw error;
    }
}

/**
 * Execute multiple queries in a transaction
 */
export function transaction(callback) {
    const database = getDatabase();
    const trx = database.transaction(callback);
    return trx();
}

/**
 * Health check - verify database is accessible
 */
export function healthCheck() {
    try {
        const result = queryOne('SELECT 1 as health');
        return result.health === 1;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

/**
 * Get database statistics
 */
export function getStats() {
    try {
        return {
            totalUsers: queryOne('SELECT COUNT(*) as count FROM users')?.count || 0,
            activeUsers: queryOne('SELECT COUNT(*) as count FROM users WHERE is_active = 1')?.count || 0,
            totalFilings: queryOne('SELECT COUNT(*) as count FROM filings')?.count || 0,
            pendingFilings: queryOne(`SELECT COUNT(*) as count FROM filings WHERE status = 'PENDING'`)?.count || 0,
            overdueFilings: queryOne(`SELECT COUNT(*) as count FROM filings WHERE status = 'OVERDUE'`)?.count || 0,
            totalPenalties: queryOne('SELECT COALESCE(SUM(amount), 0) as total FROM penalties WHERE is_paid = 0')?.total || 0,
            notificationsSent: queryOne('SELECT COUNT(*) as count FROM notifications WHERE is_sent = 1')?.count || 0
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return null;
    }
}

export default {
    initDatabase,
    getDatabase,
    closeDatabase,
    query,
    queryOne,
    execute,
    transaction,
    healthCheck,
    getStats
};
