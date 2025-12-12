/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ITC Routes - API endpoints for Input Tax Credit validation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
    createITCReconciliation,
    getITCReconciliation,
    updateITCStatus,
    logAudit
} from '../db/queries.js';
import ITCValidator from '../services/itcValidator.js';

const router = express.Router();

/**
 * POST /api/itc/validate
 * Validate an ITC claim
 */
router.post('/validate', (req, res) => {
    try {
        const {
            chat_id,
            invoice_number,
            invoice_date,
            item_description,
            itc_amount,
            total_invoice_amount
        } = req.body;
        
        // Validate required fields
        if (!chat_id || !invoice_number || !item_description || !itc_amount) {
            return res.status(400).json({
                success: false,
                error: 'chat_id, invoice_number, item_description, and itc_amount are required'
            });
        }
        
        // Validate ITC claim
        const validation = ITCValidator.validateITCClaim({
            invoice_number,
            invoice_date,
            item_description,
            itc_amount,
            total_invoice_amount
        });
        
        // Create reconciliation record
        const reconciliationId = createITCReconciliation({
            chat_id,
            invoice_number,
            invoice_date: invoice_date || new Date().toISOString().split('T')[0],
            item_description,
            itc_claimed: itc_amount,
            itc_allowed: validation.allowedITC,
            itc_blocked: validation.blockedITC,
            blocked_category: validation.blockedCategory,
            status: validation.isValid ? 'VALID' : 'BLOCKED',
            remarks: validation.message
        });
        
        // Log audit
        logAudit(
            chat_id,
            'itc_validation',
            'itc_reconciliation',
            reconciliationId,
            null,
            {
                invoice_number,
                itc_claimed: itc_amount,
                itc_allowed: validation.allowedITC,
                status: validation.isValid ? 'VALID' : 'BLOCKED'
            }
        );
        
        res.json({
            success: true,
            data: {
                reconciliation_id: reconciliationId,
                ...validation
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
 * GET /api/itc/:chatId
 * Get ITC reconciliation records for a user
 */
router.get('/:chatId', (req, res) => {
    try {
        const { status, limit } = req.query;
        const maxLimit = parseInt(limit) || 50;
        
        let reconciliations = getITCReconciliation(req.params.chatId, maxLimit);
        
        // Filter by status if specified
        if (status) {
            reconciliations = reconciliations.filter(r => r.status === status.toUpperCase());
        }
        
        res.json({
            success: true,
            count: reconciliations.length,
            data: reconciliations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/itc/:reconciliationId/status
 * Update ITC reconciliation status
 */
router.put('/:reconciliationId/status', (req, res) => {
    try {
        const { status, remarks } = req.body;
        
        if (!status || !['VALID', 'BLOCKED', 'UNDER_REVIEW', 'CORRECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be VALID, BLOCKED, UNDER_REVIEW, or CORRECTED'
            });
        }
        
        updateITCStatus(req.params.reconciliationId, status, remarks);
        
        res.json({
            success: true,
            message: 'ITC status updated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/itc/bulk-validate
 * Validate multiple ITC claims at once
 */
router.post('/bulk-validate', (req, res) => {
    try {
        const { chat_id, claims } = req.body;
        
        if (!chat_id || !Array.isArray(claims) || claims.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'chat_id and claims array are required'
            });
        }
        
        const results = claims.map(claim => {
            const validation = ITCValidator.validateITCClaim(claim);
            
            // Create reconciliation record
            const reconciliationId = createITCReconciliation({
                chat_id,
                invoice_number: claim.invoice_number,
                invoice_date: claim.invoice_date || new Date().toISOString().split('T')[0],
                item_description: claim.item_description,
                itc_claimed: claim.itc_amount,
                itc_allowed: validation.allowedITC,
                itc_blocked: validation.blockedITC,
                blocked_category: validation.blockedCategory,
                status: validation.isValid ? 'VALID' : 'BLOCKED',
                remarks: validation.message
            });
            
            return {
                invoice_number: claim.invoice_number,
                reconciliation_id: reconciliationId,
                ...validation
            };
        });
        
        // Calculate summary
        const summary = {
            total_claims: results.length,
            valid_claims: results.filter(r => r.isValid).length,
            blocked_claims: results.filter(r => !r.isValid).length,
            total_claimed: results.reduce((sum, r) => sum + r.claimedITC, 0),
            total_allowed: results.reduce((sum, r) => sum + r.allowedITC, 0),
            total_blocked: results.reduce((sum, r) => sum + r.blockedITC, 0)
        };
        
        res.json({
            success: true,
            summary,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/itc/:chatId/summary
 * Get ITC summary for a user
 */
router.get('/:chatId/summary', (req, res) => {
    try {
        const reconciliations = getITCReconciliation(req.params.chatId, 1000);
        
        const summary = {
            total_claims: reconciliations.length,
            valid_claims: reconciliations.filter(r => r.status === 'VALID').length,
            blocked_claims: reconciliations.filter(r => r.status === 'BLOCKED').length,
            under_review: reconciliations.filter(r => r.status === 'UNDER_REVIEW').length,
            total_claimed: reconciliations.reduce((sum, r) => sum + r.itc_claimed, 0),
            total_allowed: reconciliations.reduce((sum, r) => sum + r.itc_allowed, 0),
            total_blocked: reconciliations.reduce((sum, r) => sum + r.itc_blocked, 0)
        };
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
