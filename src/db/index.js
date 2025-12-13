import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let db;
let isLibSQL = false;

// Initialize database connection
const initializeDatabase = async () => {
    // Try to use Turso (LibSQL) first, fallback to local SQLite
    try {
        if (url && authToken) {
            // Try to import and use LibSQL for cloud database
            const { createClient } = await import('@libsql/client');
            const testDb = createClient({
                url,
                authToken,
            });
            
            // Test the connection
            await testDb.execute({ sql: 'SELECT 1' });
            
            db = testDb;
            isLibSQL = true;
            console.log('🌐 Using Turso Cloud Database');
        } else {
            throw new Error('No cloud credentials, using local SQLite');
        }
    } catch (error) {
        console.log('⚠️ Turso connection failed, falling back to local SQLite:', error.message);
        
        // Fallback to local SQLite
        const sqliteDb = new sqlite3.Database('./complibot.db');
        
        // Promisify SQLite methods for async/await
        const run = promisify(sqliteDb.run.bind(sqliteDb));
        const get = promisify(sqliteDb.get.bind(sqliteDb));
        const all = promisify(sqliteDb.all.bind(sqliteDb));
        
        // Create LibSQL-compatible interface
        db = {
            execute: async ({ sql, args = [] }) => {
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const rows = await all(sql, args);
                    return { rows };
                } else {
                    await run(sql, args);
                    return { rows: [] };
                }
            },
            executeMultiple: async (sql) => {
                const statements = sql.split(';').filter(s => s.trim());
                for (const statement of statements) {
                    if (statement.trim()) {
                        await run(statement);
                    }
                }
            }
        };
        
        isLibSQL = false;
        console.log('💾 Using Local SQLite Database');
    }
};

// 2. Schema Initialization (Async)
const initDB = async () => {
    const schema = `
    CREATE TABLE IF NOT EXISTS gst_state_codes (
        code TEXT PRIMARY KEY,
        state_name TEXT NOT NULL,
        type TEXT CHECK(type IN ('STATE', 'UT', 'OTHER'))
    );

    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_chat_id BIGINT UNIQUE NOT NULL,
        gstin TEXT UNIQUE NOT NULL CHECK(length(gstin) = 15),
        trade_name TEXT NOT NULL,
        legal_name TEXT,
        state_code TEXT NOT NULL,
        registration_date DATE DEFAULT CURRENT_DATE,
        default_tax_rate REAL DEFAULT 12.0,
        composition_scheme BOOLEAN DEFAULT 0,
        FOREIGN KEY(state_code) REFERENCES gst_state_codes(code),
        language TEXT DEFAULT 'en'
    );

    CREATE TABLE IF NOT EXISTS filing_periods (
        period_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        fp TEXT NOT NULL, 
        status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'GENERATED', 'FILED')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
    );
    `;

    try {
        // Create tables one by one for better error handling
        const tables = [
            `CREATE TABLE IF NOT EXISTS gst_state_codes (
                code TEXT PRIMARY KEY,
                state_name TEXT NOT NULL,
                type TEXT CHECK(type IN ('STATE', 'UT', 'OTHER'))
            )`,
            `CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_chat_id BIGINT UNIQUE NOT NULL,
                gstin TEXT UNIQUE NOT NULL CHECK(length(gstin) = 15),
                trade_name TEXT NOT NULL,
                legal_name TEXT,
                state_code TEXT NOT NULL,
                registration_date DATE DEFAULT CURRENT_DATE,
                default_tax_rate REAL DEFAULT 12.0,
                composition_scheme BOOLEAN DEFAULT 0,
                language TEXT DEFAULT 'en',
                FOREIGN KEY(state_code) REFERENCES gst_state_codes(code)
            )`,
            `CREATE TABLE IF NOT EXISTS filing_periods (
                period_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                fp TEXT NOT NULL, 
                status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'GENERATED', 'FILED')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            )`
        ];

        for (const table of tables) {
            await db.execute({ sql: table });
        }

        // Seed Data - Indian state codes (insert individually for better compatibility)
        const states = [
            ['01', 'Jammu and Kashmir', 'UT'],
            ['02', 'Himachal Pradesh', 'STATE'],
            ['03', 'Punjab', 'STATE'],
            ['04', 'Chandigarh', 'UT'],
            ['05', 'Uttarakhand', 'STATE'],
            ['06', 'Haryana', 'STATE'],
            ['07', 'Delhi', 'UT'],
            ['08', 'Rajasthan', 'STATE'],
            ['09', 'Uttar Pradesh', 'STATE'],
            ['10', 'Bihar', 'STATE'],
            ['11', 'Sikkim', 'STATE'],
            ['12', 'Arunachal Pradesh', 'STATE'],
            ['13', 'Nagaland', 'STATE'],
            ['14', 'Manipur', 'STATE'],
            ['15', 'Mizoram', 'STATE'],
            ['16', 'Tripura', 'STATE'],
            ['17', 'Meghalaya', 'STATE'],
            ['18', 'Assam', 'STATE'],
            ['19', 'West Bengal', 'STATE'],
            ['20', 'Jharkhand', 'STATE'],
            ['21', 'Odisha', 'STATE'],
            ['22', 'Chhattisgarh', 'STATE'],
            ['23', 'Madhya Pradesh', 'STATE'],
            ['24', 'Gujarat', 'STATE'],
            ['25', 'Daman and Diu', 'UT'],
            ['26', 'Dadra and Nagar Haveli', 'UT'],
            ['27', 'Maharashtra', 'STATE'],
            ['28', 'Andhra Pradesh', 'STATE'],
            ['29', 'Karnataka', 'STATE'],
            ['30', 'Goa', 'STATE'],
            ['31', 'Lakshadweep', 'UT'],
            ['32', 'Kerala', 'STATE'],
            ['33', 'Tamil Nadu', 'STATE'],
            ['34', 'Puducherry', 'UT'],
            ['35', 'Andaman and Nicobar Islands', 'UT'],
            ['36', 'Telangana', 'STATE'],
            ['37', 'Andhra Pradesh (New)', 'STATE'],
            ['38', 'Ladakh', 'UT'],
            ['97', 'Other Territory', 'OTHER'],
            ['99', 'Centre Jurisdiction', 'OTHER']
        ];

        for (const [code, name, type] of states) {
            try {
                await db.execute({
                    sql: 'INSERT OR IGNORE INTO gst_state_codes (code, state_name, type) VALUES (?, ?, ?)',
                    args: [code, name, type]
                });
            } catch (seedError) {
                // Ignore seed errors, they might already exist
                console.log(`⚠️ Seed data warning for ${code}: ${seedError.message}`);
            }
        }

        console.log(`✅ Database connected & verified (${isLibSQL ? 'Turso Cloud' : 'Local SQLite'})`);
    } catch (err) {
        console.error("❌ Database Init Error:", err);
        
        // If Turso fails, fallback to SQLite
        if (isLibSQL) {
            console.log('🔄 Turso failed, switching to local SQLite...');
            
            // Reinitialize with SQLite
            const sqliteDb = new sqlite3.Database('./complibot.db');
            
            // Promisify SQLite methods for async/await
            const run = promisify(sqliteDb.run.bind(sqliteDb));
            const get = promisify(sqliteDb.get.bind(sqliteDb));
            const all = promisify(sqliteDb.all.bind(sqliteDb));
            
            // Create LibSQL-compatible interface
            db = {
                execute: async ({ sql, args = [] }) => {
                    if (sql.trim().toUpperCase().startsWith('SELECT')) {
                        const rows = await all(sql, args);
                        return { rows };
                    } else {
                        await run(sql, args);
                        return { rows: [] };
                    }
                },
                executeMultiple: async (sql) => {
                    const statements = sql.split(';').filter(s => s.trim());
                    for (const statement of statements) {
                        if (statement.trim()) {
                            await run(statement);
                        }
                    }
                }
            };
            
            isLibSQL = false;
            console.log('💾 Switched to Local SQLite Database');
            
            // Retry initialization with SQLite
            await initDB();
        } else {
            throw err;
        }
    }
};

// Run initialization
const startDatabase = async () => {
    try {
        await initializeDatabase();
        await initDB();
    } catch (err) {
        console.error('❌ Critical: Database initialization failed:', err);
        process.exit(1);
    }
};

startDatabase();

// ===========================================
// MEMBER 1: DATABASE HELPER FUNCTIONS (ASYNC)
// ===========================================

/**
 * Get a user by their Telegram Chat ID
 */
export const getUser = async (telegram_chat_id) => {
    try {
        // Use '?' for parameters in LibSQL
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE telegram_chat_id = ?',
            args: [telegram_chat_id]
        });
        // result.rows is an array. Return the first object.
        return result.rows[0]; 
    } catch (error) {
        console.error('❌ Database error in getUser:', error);
        throw error;
    }
};

/**
 * Get Telegram Chat ID by GSTIN
 */
export const getChatIdByGstin = async (gstin) => {
    try {
        const result = await db.execute({
            sql: 'SELECT telegram_chat_id FROM users WHERE gstin = ?',
            args: [gstin]
        });
        return result.rows.length > 0 ? result.rows[0].telegram_chat_id : null;
    } catch (error) {
        console.error('❌ Database error in getChatIdByGstin:', error);
        throw error;
    }
};

/**
 * Check if state code exists in database
 */
export const validateStateCode = async (stateCode) => {
    try {
        const result = await db.execute({
            sql: 'SELECT code FROM gst_state_codes WHERE code = ?',
            args: [stateCode]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error('❌ Database error in validateStateCode:', error);
        return false;
    }
};

/**
 * Add a new user to the database
 */
export const addUser = async (user) => {
    try {
        // First validate that the state code exists
        const stateExists = await validateStateCode(user.state_code);
        if (!stateExists) {
            // If state code doesn't exist, add it as 'OTHER'
            console.log(`⚠️ Unknown state code ${user.state_code}, adding as OTHER`);
            await db.execute({
                sql: 'INSERT OR IGNORE INTO gst_state_codes (code, state_name, type) VALUES (?, ?, ?)',
                args: [user.state_code, `State ${user.state_code}`, 'OTHER']
            });
        }

        // Now add the user with language support
        const sql = `
            INSERT INTO users (telegram_chat_id, gstin, trade_name, state_code, language)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await db.execute({
            sql,
            args: [
                user.telegram_chat_id,
                user.gstin,
                user.trade_name,
                user.state_code,
                user.language || 'en'
            ]
        });
        console.log(`✅ User added successfully: ${user.gstin} - ${user.trade_name} (State: ${user.state_code}, Language: ${user.language || 'en'})`);
        return true;
    } catch (error) {
        console.error('❌ Database error in addUser:', error);
        throw error;
    }
};

export default db;