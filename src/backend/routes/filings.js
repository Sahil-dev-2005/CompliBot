/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Filing Routes - API endpoints for GST return filings
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
    createFiling,
    getFiling,
    getFilingsByUser,
    getPendingFilings,
    getOverdueFilings,
    getUpcomingFilings,
    updateFilingStatus,
    updateFilingTaxAmount,
    logAudit
} from '../db/queries.js';

const router = express.Router();

/**
 * GET /api/filings/:chatId
 * Get all filings for a user
 */
router.get('/:chatId', (req, res) => {
    try {
        const { status, limit } = req.query;
        
        let filings;
        if (status === 'pending') {
            filings = getPendingFilings(req.params.chatId);
        } else if (status === 'overdue') {
            filings = getOverdueFilings(req.params.chatId);
        } else if (status === 'upcoming') {
            const days = parseInt(req.query.days) || 30;
            filings = getUpcomingFilings(req.params.chatId, days);
        } else {
            const maxLimit = parseInt(limit) || 50;
            filings = getFilingsByUser(req.params.chatId, maxLimit);
        }
        
        res.json({
            success: true,
            count: filings.length,
            data: filings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/filings/:chatId/:filingId
 * Get specific filing details
 */
router.get('/:chatId/:filingId', (req, res) => {
    try {
        const filing = getFiling(req.params.filingId);
        
        if (!filing) {
            return res.status(404).json({
                success: false,
                error: 'Filing not found'
            });
        }
        
        // Verify filing belongs to user
        if (filing.chat_id !== req.params.chatId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        res.json({
            success: true,
            data: filing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/filings/:chatId/mark-filed
 * Mark filing as filed
 */
router.post('/:chatId/mark-filed', (req, res) => {
    try {
        const { filing_id, acknowledgment } = req.body;
        
        if (!filing_id) {
            return res.status(400).json({
                success: false,
                error: 'filing_id is required'
            });
        }
        
        const filing = getFiling(filing_id);
        if (!filing) {
            return res.status(404).json({
                success: false,
                error: 'Filing not found'
            });
        }
        
        // Verify filing belongs to user
        if (filing.chat_id !== req.params.chatId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // Mark as filed
        updateFilingStatus(filing_id, 'FILED', new Date().toISOString());
        
        // Log audit
        logAudit(
            req.params.chatId,
            'filing_marked_complete',
            'filing',
            filing_id,
            { status: filing.status },
            { status: 'FILED', acknowledgment }
        );
        
        res.json({
            success: true,
            message: 'Filing marked as completed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/filings/:chatId/:filingId/tax-amount
 * Update tax amount for a filing
 */
router.put('/:chatId/:filingId/tax-amount', (req, res) => {
    try {
        const { tax_amount } = req.body;
        
        if (tax_amount === undefined) {
            return res.status(400).json({
                success: false,
                error: 'tax_amount is required'
            });
        }
        
        const filing = getFiling(req.params.filingId);
        if (!filing) {
            return res.status(404).json({
                success: false,
                error: 'Filing not found'
            });
        }
        
        // Verify filing belongs to user
        if (filing.chat_id !== req.params.chatId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        updateFilingTaxAmount(req.params.filingId, tax_amount);
        
        // Log audit
        logAudit(
            req.params.chatId,
            'tax_amount_updated',
            'filing',
            req.params.filingId,
            { tax_amount: filing.tax_amount },
            { tax_amount }
        );
        
        res.json({
            success: true,
            message: 'Tax amount updated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/filings/overdue
 * Get all overdue filings (admin)
 */
router.get('/admin/overdue', (req, res) => {
    try {
        const overdueFilings = getOverdueFilings();
        
        res.json({
            success: true,
            count: overdueFilings.length,
            data: overdueFilings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
