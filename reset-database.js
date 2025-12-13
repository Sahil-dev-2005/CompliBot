// Database reset script to fix foreign key constraint issues
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('❌ Missing Database Credentials in .env');
    process.exit(1);
}

const db = createClient({ url, authToken });

async function resetDatabase() {
    try {
        console.log('🔄 Resetting database...');

        // Drop existing tables (in reverse order due to foreign keys)
        console.log('🗑️ Dropping existing tables...');
        await db.execute('DROP TABLE IF EXISTS filing_periods');
        await db.execute('DROP TABLE IF EXISTS users');
        await db.execute('DROP TABLE IF EXISTS gst_state_codes');

        // Recreate tables
        console.log('🏗️ Creating tables...');
        await db.executeMultiple(`
            CREATE TABLE gst_state_codes (
                code TEXT PRIMARY KEY,
                state_name TEXT NOT NULL,
                type TEXT CHECK(type IN ('STATE', 'UT', 'OTHER'))
            );

            CREATE TABLE users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_chat_id BIGINT UNIQUE NOT NULL,
                gstin TEXT UNIQUE NOT NULL CHECK(length(gstin) = 15),
                trade_name TEXT NOT NULL,
                legal_name TEXT,
                state_code TEXT NOT NULL,
                registration_date DATE DEFAULT CURRENT_DATE,
                default_tax_rate REAL DEFAULT 12.0,
                composition_scheme BOOLEAN DEFAULT 0,
                FOREIGN KEY(state_code) REFERENCES gst_state_codes(code)
            );

            CREATE TABLE filing_periods (
                period_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                fp TEXT NOT NULL, 
                status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'GENERATED', 'FILED')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );
        `);

        // Insert ALL state codes
        console.log('📍 Inserting state codes...');
        await db.executeMultiple(`
            INSERT INTO gst_state_codes (code, state_name, type) VALUES
            ('01', 'Jammu and Kashmir', 'UT'),
            ('02', 'Himachal Pradesh', 'STATE'),
            ('03', 'Punjab', 'STATE'),
            ('04', 'Chandigarh', 'UT'),
            ('05', 'Uttarakhand', 'STATE'),
            ('06', 'Haryana', 'STATE'),
            ('07', 'Delhi', 'UT'),
            ('08', 'Rajasthan', 'STATE'),
            ('09', 'Uttar Pradesh', 'STATE'),
            ('10', 'Bihar', 'STATE'),
            ('11', 'Sikkim', 'STATE'),
            ('12', 'Arunachal Pradesh', 'STATE'),
            ('13', 'Nagaland', 'STATE'),
            ('14', 'Manipur', 'STATE'),
            ('15', 'Mizoram', 'STATE'),
            ('16', 'Tripura', 'STATE'),
            ('17', 'Meghalaya', 'STATE'),
            ('18', 'Assam', 'STATE'),
            ('19', 'West Bengal', 'STATE'),
            ('20', 'Jharkhand', 'STATE'),
            ('21', 'Odisha', 'STATE'),
            ('22', 'Chhattisgarh', 'STATE'),
            ('23', 'Madhya Pradesh', 'STATE'),
            ('24', 'Gujarat', 'STATE'),
            ('25', 'Daman and Diu', 'UT'),
            ('26', 'Dadra and Nagar Haveli', 'UT'),
            ('27', 'Maharashtra', 'STATE'),
            ('28', 'Andhra Pradesh', 'STATE'),
            ('29', 'Karnataka', 'STATE'),
            ('30', 'Goa', 'STATE'),
            ('31', 'Lakshadweep', 'UT'),
            ('32', 'Kerala', 'STATE'),
            ('33', 'Tamil Nadu', 'STATE'),
            ('34', 'Puducherry', 'UT'),
            ('35', 'Andaman and Nicobar Islands', 'UT'),
            ('36', 'Telangana', 'STATE'),
            ('37', 'Andhra Pradesh (New)', 'STATE'),
            ('38', 'Ladakh', 'UT'),
            ('97', 'Other Territory', 'OTHER'),
            ('99', 'Centre Jurisdiction', 'OTHER');
        `);

        console.log('✅ Database reset complete!');
        console.log('📊 State codes inserted: 40');
        console.log('🎯 You can now register users via Telegram bot');

        // Verify the setup
        const stateCount = await db.execute('SELECT COUNT(*) as count FROM gst_state_codes');
        console.log(`🔍 Verification: ${stateCount.rows[0].count} state codes in database`);

    } catch (error) {
        console.error('❌ Database reset failed:', error);
        process.exit(1);
    }
}

resetDatabase();