/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Analytics Routes - API endpoints for dashboard and reporting
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
    getDashboardStats,
    getUserComplianceStatus,
    getAllActiveUsers
} from '../db/queries.js';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get overall dashboard statistics
 */
router.get('/dashboard', (req, res) => {
    try {
        const stats = getDashboardStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/:chatId/compliance
 * Get detailed compliance status for a user
 */
router.get('/:chatId/compliance', (req, res) => {
    try {
        const compliance = getUserComplianceStatus(req.params.chatId);
        
        if (!compliance) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: compliance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/compliance-rates
 * Get compliance rates across all users
 */
router.get('/compliance-rates', (req, res) => {
    try {
        const users = getAllActiveUsers();
        
        const stats = {
            total_users: users.length,
            compliant_users: 0,
            at_risk_users: 0,
            non_compliant_users: 0
        };
        
        users.forEach(user => {
            const compliance = getUserComplianceStatus(user.chat_id);
            
            if (compliance.overdue_filings === 0) {
                stats.compliant_users++;
            } else if (compliance.overdue_filings <= 2) {
                stats.at_risk_users++;
            } else {
                stats.non_compliant_users++;
            }
        });
        
        // Calculate percentages
        const total = stats.total_users || 1; // Avoid division by zero
        stats.compliance_rate = ((stats.compliant_users / total) * 100).toFixed(2) + '%';
        stats.at_risk_rate = ((stats.at_risk_users / total) * 100).toFixed(2) + '%';
        stats.non_compliance_rate = ((stats.non_compliant_users / total) * 100).toFixed(2) + '%';
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/overdue-summary
 * Get summary of overdue filings
 */
router.get('/overdue-summary', (req, res) => {
    try {
        const stats = getDashboardStats();
        const users = getAllActiveUsers();
        
        // Get overdue breakdown by type
        const overdueByType = {};
        users.forEach(user => {
            const compliance = getUserComplianceStatus(user.chat_id);
            // You can enhance this by querying filings table grouped by type
        });
        
        res.json({
            success: true,
            data: {
                total_overdue: stats.overdue_filings,
                overdue_by_type: overdueByType,
                affected_users: users.filter(u => {
                    const c = getUserComplianceStatus(u.chat_id);
                    return c.overdue_filings > 0;
                }).length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/penalty-summary
 * Get summary of penalties
 */
router.get('/penalty-summary', (req, res) => {
    try {
        const stats = getDashboardStats();
        const users = getAllActiveUsers();
        
        // Calculate penalty statistics
        let totalPaid = 0;
        let totalUnpaid = 0;
        let usersWithPenalties = 0;
        
        users.forEach(user => {
            const compliance = getUserComplianceStatus(user.chat_id);
            if (compliance.total_penalties > 0) {
                usersWithPenalties++;
                // You can enhance this by querying penalties table for paid/unpaid
                totalUnpaid += compliance.total_penalties;
            }
        });
        
        res.json({
            success: true,
            data: {
                total_penalties: stats.total_penalties,
                total_paid: totalPaid,
                total_unpaid: totalUnpaid,
                users_with_penalties: usersWithPenalties,
                average_penalty: users.length > 0 ? 
                    (stats.total_penalties / users.length).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/filing-trends
 * Get filing completion trends
 */
router.get('/filing-trends', (req, res) => {
    try {
        const users = getAllActiveUsers();
        
        let onTime = 0;
        let late = 0;
        let overdue = 0;
        
        users.forEach(user => {
            const compliance = getUserComplianceStatus(user.chat_id);
            onTime += compliance.filings_completed || 0;
            overdue += compliance.overdue_filings || 0;
            // You can enhance this by tracking late-but-filed filings
        });
        
        const total = onTime + late + overdue;
        
        res.json({
            success: true,
            data: {
                on_time_filings: onTime,
                late_filings: late,
                overdue_filings: overdue,
                total_filings: total,
                on_time_rate: total > 0 ? ((onTime / total) * 100).toFixed(2) + '%' : '0%'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
