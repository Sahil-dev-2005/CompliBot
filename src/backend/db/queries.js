/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Database Query Functions
 * All database operations for the CompliBot backend
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { query, queryOne, execute, transaction } from './index.js';

// ═══════════════════════════════════════════════════════════════════════════
// USER OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function createUser(userData) {
    const sql = `
        INSERT INTO users (
            chat_id, gstin, business_name, business_type, state, 
            annual_turnover, filing_scheme, has_multiple_branches, 
            is_exporter, requires_einvoice, requires_eway_bill,
            language, phone_number, ca_contact, onboarding_completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return execute(sql, [
        userData.chat_id,
        userData.gstin,
        userData.business_name,
        userData.business_type || null,
        userData.state,
        userData.annual_turnover || null,
        userData.filing_scheme || 'MONTHLY',
        userData.has_multiple_branches ? 1 : 0,
        userData.is_exporter ? 1 : 0,
        userData.requires_einvoice ? 1 : 0,
        userData.requires_eway_bill ? 1 : 0,
        userData.language || 'en',
        userData.phone_number || null,
        userData.ca_contact || null,
        userData.onboarding_completed ? 1 : 0
    ]);
}

export function getUser(chatId) {
    return queryOne('SELECT * FROM users WHERE chat_id = ?', [chatId]);
}

export function getUserByGSTIN(gstin) {
    return queryOne('SELECT * FROM users WHERE gstin = ?', [gstin]);
}

export function updateUser(chatId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), chatId];
    
    return execute(
        `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?`,
        values
    );
}

export function getAllActiveUsers() {
    return query('SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC');
}

export function deactivateUser(chatId) {
    return execute('UPDATE users SET is_active = 0 WHERE chat_id = ?', [chatId]);
}

// ═══════════════════════════════════════════════════════════════════════════
// FILING OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function createFiling(filingData) {
    const sql = `
        INSERT INTO filings (
            chat_id, return_type, period, due_date, status,
            tax_amount, sms_body, sms_link, short_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return execute(sql, [
        filingData.chat_id,
        filingData.return_type,
        filingData.period,
        filingData.due_date,
        filingData.status || 'PENDING',
        filingData.tax_amount || 0,
        filingData.sms_body || null,
        filingData.sms_link || null,
        filingData.short_id || null
    ]);
}

export function getFiling(filingId) {
    return queryOne('SELECT * FROM filings WHERE id = ?', [filingId]);
}

export function getFilingsByUser(chatId, limit = 10) {
    return query(
        'SELECT * FROM filings WHERE chat_id = ? ORDER BY due_date DESC LIMIT ?',
        [chatId, limit]
    );
}

export function getPendingFilings(chatId) {
    return query(
        `SELECT * FROM filings 
         WHERE chat_id = ? AND status = 'PENDING' 
         ORDER BY due_date ASC`,
        [chatId]
    );
}

export function getOverdueFilings(chatId = null) {
    if (chatId) {
        return query(
            `SELECT * FROM filings 
             WHERE chat_id = ? AND status IN ('PENDING', 'OVERDUE') AND due_date < date('now')
             ORDER BY due_date ASC`,
            [chatId]
        );
    }
    
    return query(
        `SELECT f.*, u.business_name, u.phone_number 
         FROM filings f
         JOIN users u ON f.chat_id = u.chat_id
         WHERE f.status IN ('PENDING', 'OVERDUE') AND f.due_date < date('now')
         ORDER BY f.due_date ASC`
    );
}

export function getUpcomingFilings(chatId, daysAhead = 30) {
    return query(
        `SELECT * FROM filings 
         WHERE chat_id = ? 
         AND status = 'PENDING'
         AND due_date >= date('now')
         AND due_date <= date('now', '+' || ? || ' days')
         ORDER BY due_date ASC`,
        [chatId, daysAhead]
    );
}

export function updateFilingStatus(filingId, status, filedDate = null) {
    if (filedDate) {
        return execute(
            `UPDATE filings 
             SET status = ?, filed_date = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [status, filedDate, filingId]
        );
    }
    
    return execute(
        `UPDATE filings 
         SET status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, filingId]
    );
}

export function updateFilingTaxAmount(filingId, taxAmount) {
    return execute(
        'UPDATE filings SET tax_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [taxAmount, filingId]
    );
}

export function markFilingAsOverdue(filingId) {
    return execute(
        `UPDATE filings 
         SET status = 'OVERDUE', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND status = 'PENDING' AND due_date < date('now')`,
        [filingId]
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function createNotification(notificationData) {
    const sql = `
        INSERT INTO notifications (
            chat_id, filing_id, notification_type, message,
            scheduled_date, priority, channel
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return execute(sql, [
        notificationData.chat_id,
        notificationData.filing_id || null,
        notificationData.notification_type,
        notificationData.message,
        notificationData.scheduled_date,
        notificationData.priority || 0,
        notificationData.channel || 'telegram'
    ]);
}

export function getPendingNotifications() {
    return query(
        `SELECT n.*, u.language, u.phone_number
         FROM notifications n
         JOIN users u ON n.chat_id = u.chat_id
         WHERE n.is_sent = 0 
         AND n.scheduled_date <= datetime('now')
         AND u.is_active = 1
         ORDER BY n.priority DESC, n.scheduled_date ASC
         LIMIT 100`
    );
}

export function markNotificationSent(notificationId, success = true, errorMessage = null) {
    return execute(
        `UPDATE notifications 
         SET is_sent = ?, sent_date = datetime('now'), error_message = ?
         WHERE id = ?`,
        [success ? 1 : 0, errorMessage, notificationId]
    );
}

export function getNotificationHistory(chatId, limit = 50) {
    return query(
        `SELECT * FROM notifications 
         WHERE chat_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [chatId, limit]
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PENALTY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function createPenalty(penaltyData) {
    const sql = `
        INSERT INTO penalties (
            chat_id, filing_id, penalty_type, amount,
            start_date, days_overdue, interest_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return execute(sql, [
        penaltyData.chat_id,
        penaltyData.filing_id,
        penaltyData.penalty_type,
        penaltyData.amount,
        penaltyData.start_date,
        penaltyData.days_overdue || 0,
        penaltyData.interest_amount || 0
    ]);
}

export function updatePenalty(penaltyId, amount, daysOverdue, interestAmount) {
    return execute(
        `UPDATE penalties 
         SET amount = ?, days_overdue = ?, interest_amount = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [amount, daysOverdue, interestAmount, penaltyId]
    );
}

export function getPenaltiesByUser(chatId) {
    return query(
        `SELECT p.*, f.return_type, f.period, f.due_date
         FROM penalties p
         JOIN filings f ON p.filing_id = f.id
         WHERE p.chat_id = ? AND p.is_paid = 0
         ORDER BY p.created_at DESC`,
        [chatId]
    );
}

export function getTotalPenalties(chatId) {
    const result = queryOne(
        `SELECT 
            COALESCE(SUM(amount), 0) as total_late_filing,
            COALESCE(SUM(interest_amount), 0) as total_interest
         FROM penalties 
         WHERE chat_id = ? AND is_paid = 0`,
        [chatId]
    );
    
    return {
        totalLateFiling: result?.total_late_filing || 0,
        totalInterest: result?.total_interest || 0,
        grandTotal: (result?.total_late_filing || 0) + (result?.total_interest || 0)
    };
}

export function markPenaltyPaid(penaltyId) {
    return execute(
        `UPDATE penalties 
         SET is_paid = 1, paid_date = datetime('now'), updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [penaltyId]
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ITC RECONCILIATION OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function createITCReconciliation(itcData) {
    const sql = `
        INSERT INTO itc_reconciliation (
            chat_id, period, total_itc_claimed, matched_itc,
            mismatched_count, blocked_itc_amount, blocked_categories, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return execute(sql, [
        itcData.chat_id,
        itcData.period,
        itcData.total_itc_claimed || 0,
        itcData.matched_itc || 0,
        itcData.mismatched_count || 0,
        itcData.blocked_itc_amount || 0,
        itcData.blocked_categories || null,
        itcData.status || 'PENDING'
    ]);
}

export function getITCReconciliation(chatId, period) {
    return queryOne(
        'SELECT * FROM itc_reconciliation WHERE chat_id = ? AND period = ?',
        [chatId, period]
    );
}

export function getLatestITCReconciliation(chatId) {
    return queryOne(
        `SELECT * FROM itc_reconciliation 
         WHERE chat_id = ? 
         ORDER BY reconciliation_date DESC 
         LIMIT 1`,
        [chatId]
    );
}

export function updateITCStatus(reconciliationId, status, notes = null) {
    return execute(
        `UPDATE itc_reconciliation 
         SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, notes, reconciliationId]
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLIANCE DEADLINE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getComplianceDeadline(returnType, filingScheme) {
    return queryOne(
        `SELECT * FROM compliance_deadlines 
         WHERE return_type = ? AND filing_scheme = ? AND is_active = 1`,
        [returnType, filingScheme]
    );
}

export function getAllComplianceDeadlines() {
    return query('SELECT * FROM compliance_deadlines WHERE is_active = 1 ORDER BY return_type, filing_scheme');
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKED ITC CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

export function getBlockedITCCategories() {
    return query('SELECT * FROM blocked_itc_categories ORDER BY category');
}

export function getBlockedITCCategory(category) {
    return queryOne('SELECT * FROM blocked_itc_categories WHERE category = ?', [category]);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════

export function logAudit(chatId, action, entityType, entityId, oldValue, newValue) {
    const sql = `
        INSERT INTO audit_log (
            chat_id, action, entity_type, entity_id, old_value, new_value
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    return execute(sql, [
        chatId || null,
        action,
        entityType || null,
        entityId || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null
    ]);
}

export function getAuditLog(chatId = null, limit = 100) {
    if (chatId) {
        return query(
            `SELECT * FROM audit_log WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?`,
            [chatId, limit]
        );
    }
    
    return query(
        `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`,
        [limit]
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export function getDashboardStats() {
    const totalUsers = queryOne('SELECT COUNT(*) as count FROM users')?.count || 0;
    const activeUsers = queryOne('SELECT COUNT(*) as count FROM users WHERE is_active = 1')?.count || 0;
    const totalFilings = queryOne('SELECT COUNT(*) as count FROM filings')?.count || 0;
    const pendingFilings = queryOne('SELECT COUNT(*) as count FROM filings WHERE status = "PENDING"')?.count || 0;
    const overdueFilings = queryOne('SELECT COUNT(*) as count FROM v_overdue_filings')?.count || 0;
    const totalPenalties = queryOne('SELECT COALESCE(SUM(amount + interest_amount), 0) as total FROM penalties WHERE is_paid = 0')?.total || 0;
    
    return {
        totalUsers,
        activeUsers,
        totalFilings,
        pendingFilings,
        overdueFilings,
        totalPenalties,
        complianceRate: totalFilings > 0 ? ((totalFilings - overdueFilings) / totalFilings * 100).toFixed(2) : 100
    };
}

export function getUserComplianceStatus(chatId) {
    return queryOne('SELECT * FROM v_user_compliance_status WHERE chat_id = ?', [chatId]);
}

export default {
    // Users
    createUser,
    getUser,
    getUserByGSTIN,
    updateUser,
    getAllActiveUsers,
    deactivateUser,
    
    // Filings
    createFiling,
    getFiling,
    getFilingsByUser,
    getPendingFilings,
    getOverdueFilings,
    getUpcomingFilings,
    updateFilingStatus,
    updateFilingTaxAmount,
    markFilingAsOverdue,
    
    // Notifications
    createNotification,
    getPendingNotifications,
    markNotificationSent,
    getNotificationHistory,
    
    // Penalties
    createPenalty,
    updatePenalty,
    getPenaltiesByUser,
    getTotalPenalties,
    markPenaltyPaid,
    
    // ITC
    createITCReconciliation,
    getITCReconciliation,
    getLatestITCReconciliation,
    updateITCStatus,
    
    // Master Data
    getComplianceDeadline,
    getAllComplianceDeadlines,
    getBlockedITCCategories,
    getBlockedITCCategory,
    
    // Audit
    logAudit,
    getAuditLog,
    
    // Analytics
    getDashboardStats,
    getUserComplianceStatus
};
