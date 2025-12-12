# Database Integration Guide

## Current Situation

You have **two database implementations**:

1. **Teammate's Turso Database** (LibSQL Cloud)

   - Cloud-hosted SQLite via Turso
   - Tables: `gst_state_codes`, `users`, `filing_periods`, and more
   - Async operations with `@libsql/client`
   - Using `telegram_chat_id` as user identifier

2. **My Backend Database** (Local SQLite)
   - Local SQLite with `better-sqlite3`
   - Tables: `users`, `filings`, `notifications`, `penalties`, `itc_reconciliation`, etc.
   - Sync operations
   - Using `chat_id` as user identifier

## Recommended: Merge Into Turso Database

### Step 1: Install LibSQL Client

```bash
npm uninstall better-sqlite3
npm install @libsql/client
```

### Step 2: Update Environment Variables

Add to your `.env` file:

```env
# Turso Database (from your teammate)
TURSO_DATABASE_URL=your_turso_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# Backend Config
PORT=3000
NODE_ENV=development
TZ=Asia/Kolkata
```

### Step 3: Schema Mapping

**Your teammate's schema** → **My backend requirements**

| Teammate's Table | My Backend Needs         | Action                                                                              |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `users`          | ✅ Exists                | Extend with fields: `phone_number`, `annual_turnover`, `filing_scheme`, `is_active` |
| `filing_periods` | Similar to `filings`     | Extend with: `due_date`, `status`, `penalty_amount`, `sms_body`, `sms_link`         |
| -                | `notifications`          | **Add new table** for alert system                                                  |
| -                | `penalties`              | **Add new table** for penalty tracking                                              |
| -                | `itc_reconciliation`     | **Add new table** for ITC validation                                                |
| -                | `compliance_deadlines`   | **Add new table** for deadline templates                                            |
| -                | `blocked_itc_categories` | **Add new table** for ITC rules                                                     |
| -                | `audit_log`              | **Add new table** for tracking                                                      |

### Step 4: Extended Schema for Turso

Add these tables to your teammate's database:

```sql
-- Extend users table (ALTER or recreate)
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN annual_turnover INTEGER;
ALTER TABLE users ADD COLUMN filing_scheme TEXT DEFAULT 'MONTHLY';
ALTER TABLE users ADD COLUMN requires_einvoice BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Extend filing_periods to include deadline tracking
ALTER TABLE filing_periods ADD COLUMN return_type TEXT; -- 'GSTR-1', 'GSTR-3B'
ALTER TABLE filing_periods ADD COLUMN due_date DATE;
ALTER TABLE filing_periods ADD COLUMN filed_date DATETIME;
ALTER TABLE filing_periods ADD COLUMN tax_amount INTEGER DEFAULT 0;
ALTER TABLE filing_periods ADD COLUMN penalty_amount INTEGER DEFAULT 0;
ALTER TABLE filing_periods ADD COLUMN sms_body TEXT;
ALTER TABLE filing_periods ADD COLUMN sms_link TEXT;

-- New: Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filing_period_id INTEGER,
    notification_type TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_date DATETIME NOT NULL,
    sent_date DATETIME,
    is_sent BOOLEAN DEFAULT 0,
    channel TEXT DEFAULT 'telegram',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (filing_period_id) REFERENCES filing_periods(period_id)
);

-- New: Penalties table
CREATE TABLE IF NOT EXISTS penalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filing_period_id INTEGER NOT NULL,
    penalty_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    days_overdue INTEGER DEFAULT 0,
    interest_amount INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT 0,
    paid_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (filing_period_id) REFERENCES filing_periods(period_id)
);

-- New: ITC Reconciliation table
CREATE TABLE IF NOT EXISTS itc_reconciliation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE,
    item_description TEXT,
    itc_claimed INTEGER DEFAULT 0,
    itc_allowed INTEGER DEFAULT 0,
    itc_blocked INTEGER DEFAULT 0,
    blocked_category TEXT,
    status TEXT DEFAULT 'PENDING',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- New: Compliance Deadlines (Master Data)
CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_type TEXT NOT NULL,
    filing_scheme TEXT NOT NULL,
    due_day INTEGER NOT NULL,
    description TEXT,
    penalty_per_day INTEGER DEFAULT 100,
    max_penalty INTEGER DEFAULT 5000,
    is_active BOOLEAN DEFAULT 1
);

-- Seed Deadlines
INSERT OR IGNORE INTO compliance_deadlines (return_type, filing_scheme, due_day, description) VALUES
('GSTR-1', 'MONTHLY', 11, 'Monthly sales invoice report'),
('GSTR-3B', 'MONTHLY', 20, 'Monthly tax payment and return filing'),
('GSTR-1', 'QUARTERLY', 13, 'Quarterly sales invoice report'),
('GSTR-3B', 'QUARTERLY', 22, 'Quarterly tax payment');

-- New: Blocked ITC Categories
CREATE TABLE IF NOT EXISTS blocked_itc_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    description TEXT,
    is_fully_blocked BOOLEAN DEFAULT 1,
    restriction_percentage INTEGER DEFAULT 100,
    keywords TEXT
);

-- Seed Blocked ITC
INSERT OR IGNORE INTO blocked_itc_categories (category, description, restriction_percentage, keywords) VALUES
('Food & Beverages', 'Food, drinks, outdoor catering', 100, '["lunch","dinner","food","restaurant","catering"]'),
('Fuel & Lubricants', 'Motor vehicle fuel (partial)', 50, '["petrol","diesel","fuel","cng"]'),
('Vehicle Repairs', 'Personal vehicle maintenance', 100, '["car service","vehicle","repair","mechanic"]'),
('Entertainment', 'Entertainment and recreation', 100, '["club","party","entertainment","cinema"]');

-- New: Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 5: Update Database Connection Layer

Create `src/backend/db/turso.js`:

```javascript
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env");
}

export const db = createClient({ url, authToken });

/**
 * Query helper (returns all rows)
 */
export async function query(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows;
}

/**
 * Query helper (returns first row)
 */
export async function queryOne(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows[0] || null;
}

/**
 * Execute helper (for INSERT/UPDATE/DELETE)
 */
export async function execute(sql, args = []) {
  return await db.execute({ sql, args });
}

/**
 * Initialize database with extended schema
 */
export async function initDatabase() {
  try {
    console.log("🔄 Initializing Turso database...");

    // Your teammate's base schema is already there
    // Add the extended schema here
    await db.executeMultiple(`
            -- Add extended columns if not exist
            -- (Use ALTER TABLE statements from Step 4)
        `);

    console.log("✅ Turso database initialized");
  } catch (error) {
    console.error("❌ Database init error:", error);
    throw error;
  }
}

export default db;
```

### Step 6: Update Queries to be Async

All route handlers need to become async. Example:

**Before (Sync):**

```javascript
router.get("/:chatId", (req, res) => {
  const user = getUser(req.params.chatId);
  res.json({ success: true, data: user });
});
```

**After (Async):**

```javascript
router.get("/:chatId", async (req, res) => {
  try {
    const user = await getUser(req.params.chatId);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Step 7: Update Field Names

Your teammate uses:

- `telegram_chat_id` (BIGINT)
- `user_id` (auto-increment)

My backend uses:

- `chat_id` (TEXT)

**Choose one standard:**

**Option A: Keep telegram_chat_id** (Recommended)

- Update all my route files to use `telegram_chat_id` instead of `chat_id`
- Convert to string when needed: `String(telegram_chat_id)`

**Option B: Add chat_id alias**

- Add computed field: `chat_id = String(telegram_chat_id)`

### Step 8: Test the Integration

```bash
# 1. Install LibSQL
npm install @libsql/client

# 2. Set environment variables in .env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here

# 3. Run extended schema (via Turso CLI or code)
turso db shell your-db < extended-schema.sql

# 4. Start server
npm start

# 5. Test endpoint
curl http://localhost:3000/health
```

## Quick Action Items

### For You:

1. ✅ Share your `.env` credentials with Turso URL and auth token
2. ✅ Confirm your teammate's complete schema (the missing tables mentioned)
3. ✅ Decide on field naming convention (telegram_chat_id vs chat_id)

### For Me:

1. Update `src/backend/db/index.js` to use LibSQL
2. Make all queries async
3. Update route handlers to async/await
4. Map between teammate's schema and my backend features
5. Test all endpoints with Turso database

## Next Steps

**Tell me:**

1. Do you want me to update the backend to use LibSQL + Turso?
2. What's the complete schema your teammate created (the missing tables)?
3. Should I use `telegram_chat_id` or keep `chat_id`?

I can make all the necessary changes to integrate everything into one unified system!
