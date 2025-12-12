/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Penalty Routes - API endpoints for penalty calculation and management
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
    getPenaltiesByUser,
    getTotalPenalties,
    updatePenalty,
    markPenaltyPaid,
    logAudit
} from '../db/queries.js';
import { query } from '../db/index.js';
import PenaltyCalculator from '../services/penaltyCalculator.js';

const router = express.Router();

/**
 * POST /api/penalties/calculate
 * Calculate penalty for a late/unfiled return
 */
router.post('/calculate', (req, res) => {
    try {
        const {
            filing_type,
            due_date,
            filed_date,
            days_late,
            tax_amount
        } = req.body;
        
        // Validate required fields
        if (!filing_type || (!due_date && !days_late)) {
            return res.status(400).json({
                success: false,
                error: 'filing_type and (due_date or days_late) are required'
            });
        }
        
        // Calculate days late if not provided
        let actualDaysLate = days_late;
        if (!actualDaysLate && due_date) {
            const dueDate = new Date(due_date);
            const currentDate = filed_date ? new Date(filed_date) : new Date();
            actualDaysLate = Math.max(0, Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24)));
        }
        
        // Calculate penalties
        const result = PenaltyCalculator.calculate(
            filing_type,
            actualDaysLate,
            tax_amount || 0
        );
        
        res.json({
            success: true,
            data: {
                days_late: actualDaysLate,
                ...result
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
 * POST /api/penalties/calculate-interest
 * Calculate interest on unpaid tax
 */
router.post('/calculate-interest', (req, res) => {
    try {
        const { tax_amount, days_late } = req.body;
        
        if (!tax_amount || !days_late) {
            return res.status(400).json({
                success: false,
                error: 'tax_amount and days_late are required'
            });
        }
        
        const interest = PenaltyCalculator.calculateInterest(tax_amount, days_late);
        
        res.json({
            success: true,
            data: {
                tax_amount,
                days_late,
                interest,
                annual_rate: 0.18,
                daily_rate: 0.18 / 365
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
 * POST /api/penalties/project
 * Project penalty cost for future dates
 */
router.post('/project', (req, res) => {
    try {
        const {
            filing_type,
            due_date,
            target_date,
            tax_amount
        } = req.body;
        
        if (!filing_type || !due_date || !target_date) {
            return res.status(400).json({
                success: false,
                error: 'filing_type, due_date, and target_date are required'
            });
        }
        
        const dueDate = new Date(due_date);
        const targetDate = new Date(target_date);
        const daysLate = Math.max(0, Math.floor((targetDate - dueDate) / (1000 * 60 * 60 * 24)));
        
        const projection = PenaltyCalculator.projectPenalty(
            filing_type,
            daysLate,
            tax_amount || 0
        );
        
        res.json({
            success: true,
            data: projection
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/penalties/calculate-itc
 * Calculate ITC fraud penalty
 */
router.post('/calculate-itc', (req, res) => {
    try {
        const { fraudulent_itc_amount, months_elapsed } = req.body;
        
        if (!fraudulent_itc_amount) {
            return res.status(400).json({
                success: false,
                error: 'fraudulent_itc_amount is required'
            });
        }
        
        const penalty = PenaltyCalculator.calculateITCPenalty(
            fraudulent_itc_amount,
            months_elapsed || 0
        );
        
        res.json({
            success: true,
            data: penalty
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/penalties/:chatId
 * Get all penalties for a user
 */
router.get('/:chatId', (req, res) => {
    try {
        const penalties = getPenaltiesByUser(req.params.chatId);
        const total = getTotalPenalties(req.params.chatId);
        
        res.json({
            success: true,
            count: penalties.length,
            total_amount: total,
            data: penalties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/penalties/filing/:filingId
 * Get penalties for a specific filing
 */
router.get('/filing/:filingId', (req, res) => {
    try {
        const penalties = query(
            `SELECT * FROM penalties WHERE filing_id = ?`,
            [req.params.filingId]
        );
        
        const total = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        res.json({
            success: true,
            count: penalties.length,
            total_amount: total,
            data: penalties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/penalties/:penaltyId/mark-paid
 * Mark penalty as paid
 */
router.post('/:penaltyId/mark-paid', (req, res) => {
    try {
        const { payment_reference } = req.body;
        
        markPenaltyPaid(req.params.penaltyId);
        
        res.json({
            success: true,
            message: 'Penalty marked as paid'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
