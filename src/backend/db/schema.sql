-- ═══════════════════════════════════════════════════════════════════════════
-- CompliBot Backend - Database Schema
-- SQLite Database for GST Compliance Tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Table: users - Store user/business information
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    chat_id TEXT PRIMARY KEY,
    gstin TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT, -- 'retail', 'manufacturing', 'services', 'other'
    state TEXT NOT NULL,
    annual_turnover INTEGER, -- in rupees
    filing_scheme TEXT DEFAULT 'MONTHLY', -- 'MONTHLY', 'QUARTERLY'
    has_multiple_branches INTEGER DEFAULT 0,
    is_exporter INTEGER DEFAULT 0,
    requires_einvoice INTEGER DEFAULT 0, -- turnover > 1cr
    requires_eway_bill INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en', -- 'en', 'hi', 'mr', 'te', 'kn'
    phone_number TEXT,
    ca_contact TEXT, -- CA phone/email
    onboarding_completed INTEGER DEFAULT 0,
    onboarding_step INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_gstin ON users(gstin);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: filings - Track GST return filings
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS filings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    return_type TEXT NOT NULL, -- 'GSTR-1', 'GSTR-3B', 'GSTR-9', etc.
    period TEXT NOT NULL, -- 'MMYYYY' format (e.g., '032024' for March 2024)
    due_date DATE NOT NULL,
    filed_date DATETIME,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'FILED', 'OVERDUE', 'CANCELLED'
    tax_amount INTEGER DEFAULT 0, -- estimated/actual tax in rupees
    penalty_amount INTEGER DEFAULT 0,
    filing_acknowledgment TEXT, -- ARN or acknowledgment number
    sms_body TEXT, -- Pre-generated SMS content
    sms_link TEXT, -- SMS deep link
    short_id TEXT, -- API short ID for analytics
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES users(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_filings_chat_id ON filings(chat_id);
CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);
CREATE INDEX IF NOT EXISTS idx_filings_due_date ON filings(due_date);
CREATE INDEX IF NOT EXISTS idx_filings_period ON filings(period);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: notifications - Track sent notifications
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    filing_id INTEGER,
    notification_type TEXT NOT NULL, -- 'GREEN', 'YELLOW', 'RED', 'OVERDUE'
    message TEXT NOT NULL,
    scheduled_date DATETIME NOT NULL,
    sent_date DATETIME,
    is_sent INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0, -- 0=low, 1=medium, 2=high, 3=critical
    channel TEXT DEFAULT 'telegram', -- 'telegram', 'sms', 'email'
    error_message TEXT, -- If sending failed
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES users(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (filing_id) REFERENCES filings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_chat_id ON notifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(is_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_date);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: penalties - Track penalty calculations
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS penalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    filing_id INTEGER NOT NULL,
    penalty_type TEXT NOT NULL, -- 'LATE_FILING', 'LATE_PAYMENT', 'WRONG_ITC'
    amount INTEGER NOT NULL, -- in rupees
    start_date DATE NOT NULL,
    end_date DATE, -- When penalty was stopped (filed)
    days_overdue INTEGER DEFAULT 0,
    interest_amount INTEGER DEFAULT 0, -- 18% p.a. on unpaid tax
    is_paid INTEGER DEFAULT 0,
    paid_date DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES users(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (filing_id) REFERENCES filings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_penalties_chat_id ON penalties(chat_id);
CREATE INDEX IF NOT EXISTS idx_penalties_filing_id ON penalties(filing_id);
CREATE INDEX IF NOT EXISTS idx_penalties_is_paid ON penalties(is_paid);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: itc_reconciliation - Track ITC claims and validation
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itc_reconciliation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    period TEXT NOT NULL, -- 'MMYYYY'
    total_itc_claimed INTEGER DEFAULT 0,
    matched_itc INTEGER DEFAULT 0,
    mismatched_count INTEGER DEFAULT 0,
    blocked_itc_amount INTEGER DEFAULT 0, -- Amount in blocked categories
    blocked_categories TEXT, -- JSON: [{"category": "food", "amount": 2500}]
    reconciliation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED', 'CORRECTED', 'APPROVED'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES users(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_itc_chat_id ON itc_reconciliation(chat_id);
CREATE INDEX IF NOT EXISTS idx_itc_period ON itc_reconciliation(period);
CREATE INDEX IF NOT EXISTS idx_itc_status ON itc_reconciliation(status);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: compliance_deadlines - Master data for GST deadlines
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_type TEXT NOT NULL,
    filing_scheme TEXT NOT NULL, -- 'MONTHLY', 'QUARTERLY', 'ANNUAL'
    state TEXT, -- NULL = applicable to all states
    due_day INTEGER NOT NULL, -- day of month (e.g., 20 for GSTR-3B)
    description TEXT,
    penalty_per_day INTEGER DEFAULT 100,
    max_penalty INTEGER DEFAULT 5000,
    interest_rate REAL DEFAULT 0.18, -- 18% per annum
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deadlines_return_type ON compliance_deadlines(return_type);
CREATE INDEX IF NOT EXISTS idx_deadlines_scheme ON compliance_deadlines(filing_scheme);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: blocked_itc_categories - Master data for blocked ITC
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_itc_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    description TEXT,
    is_fully_blocked INTEGER DEFAULT 1,
    restriction_percentage INTEGER DEFAULT 100, -- 100 = fully blocked
    examples TEXT, -- JSON array: ["Office lunch", "Tea/coffee"]
    keywords TEXT, -- JSON array: ["lunch", "food", "restaurant"]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────────
-- Table: audit_log - Track all user actions
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT,
    action TEXT NOT NULL, -- 'user_created', 'filing_marked', 'penalty_calculated'
    entity_type TEXT, -- 'user', 'filing', 'notification'
    entity_id TEXT,
    old_value TEXT, -- JSON of old state
    new_value TEXT, -- JSON of new state
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_chat_id ON audit_log(chat_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: Insert default compliance deadlines
-- ═══════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO compliance_deadlines (return_type, filing_scheme, due_day, description, penalty_per_day, max_penalty) VALUES
('GSTR-1', 'MONTHLY', 11, 'Monthly sales invoice report', 100, 5000),
('GSTR-3B', 'MONTHLY', 20, 'Monthly tax payment and return filing', 100, 5000),
('GSTR-1', 'QUARTERLY', 13, 'Quarterly sales invoice report (QRMP)', 100, 5000),
('GSTR-3B', 'QUARTERLY', 22, 'Quarterly tax payment (QRMP)', 100, 5000),
('GSTR-9', 'ANNUAL', 31, 'Annual reconciliation statement', 100, 25000),
('GSTR-9C', 'ANNUAL', 31, 'Audit reconciliation (turnover > 5cr)', 100, 25000);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: Insert blocked ITC categories
-- ═══════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO blocked_itc_categories (category, description, is_fully_blocked, restriction_percentage, examples, keywords) VALUES
('Food & Beverages', 'Food, drinks, outdoor catering services', 1, 100, 
 '["Office lunch", "Tea/coffee", "Restaurant bills", "Party catering", "Snacks"]',
 '["lunch", "dinner", "breakfast", "tea", "coffee", "restaurant", "food", "snacks", "catering", "beverage"]'),

('Fuel & Lubricants', 'Motor vehicle fuel and lubricants (partial restriction)', 0, 50,
 '["Petrol", "Diesel", "CNG", "Engine oil", "Lubricants"]',
 '["petrol", "diesel", "fuel", "cng", "lpg", "lubricant", "engine oil", "mobil"]'),

('Vehicle Repairs', 'Personal vehicle maintenance and repairs', 1, 100,
 '["Car service", "Bike repairs", "Spare parts", "Tyre replacement", "Battery"]',
 '["car service", "vehicle", "repair", "spare parts", "tyres", "tires", "battery", "mechanic", "garage"]'),

('Entertainment', 'Entertainment and recreation services', 1, 100,
 '["Club membership", "Event tickets", "Recreation", "Amusement park", "Cinema"]',
 '["club", "membership", "party", "event", "tickets", "recreation", "entertainment", "amusement", "cinema", "movie"]'),

('Accommodation', 'Hotel stays and lodging (partial restriction)', 0, 50,
 '["Hotel bills", "Guest house", "Resort stay"]',
 '["hotel", "accommodation", "lodging", "guest house", "resort", "stay"]'),

('Personal Expenses', 'Personal use items and services', 1, 100,
 '["Personal grooming", "Gym membership", "Medical bills", "Personal shopping"]',
 '["personal", "grooming", "gym", "fitness", "medical", "doctor", "salon", "spa"]');

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS: Useful database views
-- ═══════════════════════════════════════════════════════════════════════════

CREATE VIEW IF NOT EXISTS v_overdue_filings AS
SELECT 
    f.id,
    f.chat_id,
    f.return_type,
    f.period,
    f.due_date,
    f.status,
    f.tax_amount,
    u.business_name,
    u.gstin,
    u.phone_number,
    julianday('now') - julianday(f.due_date) as days_overdue,
    CAST((julianday('now') - julianday(f.due_date)) * 100 AS INTEGER) as calculated_penalty
FROM filings f
JOIN users u ON f.chat_id = u.chat_id
WHERE f.status IN ('PENDING', 'OVERDUE')
  AND f.due_date < date('now')
ORDER BY days_overdue DESC;

CREATE VIEW IF NOT EXISTS v_upcoming_deadlines AS
SELECT 
    f.id,
    f.chat_id,
    f.return_type,
    f.period,
    f.due_date,
    f.status,
    u.business_name,
    u.gstin,
    julianday(f.due_date) - julianday('now') as days_until_due
FROM filings f
JOIN users u ON f.chat_id = u.chat_id
WHERE f.status = 'PENDING'
  AND f.due_date >= date('now')
  AND f.due_date <= date('now', '+30 days')
ORDER BY f.due_date ASC;

CREATE VIEW IF NOT EXISTS v_user_compliance_status AS
SELECT 
    u.chat_id,
    u.business_name,
    u.gstin,
    COUNT(DISTINCT CASE WHEN f.status = 'FILED' THEN f.id END) as filings_completed,
    COUNT(DISTINCT CASE WHEN f.status = 'PENDING' THEN f.id END) as filings_pending,
    COUNT(DISTINCT CASE WHEN f.status = 'OVERDUE' THEN f.id END) as filings_overdue,
    COALESCE(SUM(p.amount), 0) as total_penalties,
    MAX(f.filed_date) as last_filing_date
FROM users u
LEFT JOIN filings f ON u.chat_id = f.chat_id
LEFT JOIN penalties p ON u.chat_id = p.chat_id AND p.is_paid = 0
WHERE u.is_active = 1
GROUP BY u.chat_id, u.business_name, u.gstin;
