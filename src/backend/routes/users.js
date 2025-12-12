/**
 * ═══════════════════════════════════════════════════════════════════════════
 * User Routes - API endpoints for user management
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
    createUser,
    getUser,
    getUserByGSTIN,
    updateUser,
    getAllActiveUsers,
    deactivateUser,
    getUserComplianceStatus,
    logAudit
} from '../db/queries.js';
import { DeadlineTracker } from '../services/deadlineTracker.js';

const router = express.Router();

/**
 * GET /api/users/:chatId
 * Get user details
 */
router.get('/:chatId', (req, res) => {
    try {
        const user = getUser(req.params.chatId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Get compliance status
        const complianceStatus = getUserComplianceStatus(req.params.chatId);
        
        res.json({
            success: true,
            data: {
                ...user,
                complianceStatus
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
 * POST /api/users
 * Create new user (onboarding)
 */
router.post('/', async (req, res) => {
    try {
        const {
            chat_id,
            gstin,
            business_name,
            business_type,
            state,
            annual_turnover,
            filing_scheme,
            has_multiple_branches,
            is_exporter,
            language,
            phone_number,
            ca_contact
        } = req.body;
        
        // Validate required fields
        if (!chat_id || !gstin || !business_name || !state) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: chat_id, gstin, business_name, state'
            });
        }
        
        // Check if user already exists
        const existingUser = getUserByGSTIN(gstin);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this GSTIN already exists'
            });
        }
        
        // Determine if e-invoice required (turnover >= 1cr)
        const requires_einvoice = annual_turnover && annual_turnover >= 10000000;
        
        // Create user
        const result = createUser({
            chat_id,
            gstin,
            business_name,
            business_type,
            state,
            annual_turnover,
            filing_scheme: filing_scheme || 'MONTHLY',
            has_multiple_branches: !!has_multiple_branches,
            is_exporter: !!is_exporter,
            requires_einvoice: !!requires_einvoice,
            requires_eway_bill: false,
            language: language || 'en',
            phone_number,
            ca_contact,
            onboarding_completed: true
        });
        
        // Initialize deadlines for this user
        await DeadlineTracker.initializeUserDeadlines(chat_id);
        
        // Log audit
        logAudit(chat_id, 'user_created', 'user', chat_id, null, { gstin, business_name });
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                chat_id,
                gstin,
                business_name
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
 * PUT /api/users/:chatId
 * Update user details
 */
router.put('/:chatId', (req, res) => {
    try {
        const updates = req.body;
        const oldUser = getUser(req.params.chatId);
        
        if (!oldUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Remove immutable fields
        delete updates.chat_id;
        delete updates.gstin;
        delete updates.created_at;
        
        updateUser(req.params.chatId, updates);
        
        // Log audit
        logAudit(req.params.chatId, 'user_updated', 'user', req.params.chatId, oldUser, updates);
        
        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/users/:chatId
 * Deactivate user
 */
router.delete('/:chatId', (req, res) => {
    try {
        deactivateUser(req.params.chatId);
        
        // Log audit
        logAudit(req.params.chatId, 'user_deactivated', 'user', req.params.chatId, null, null);
        
        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/users
 * Get all active users (admin only)
 */
router.get('/', (req, res) => {
    try {
        const users = getAllActiveUsers();
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/users/:chatId/compliance
 * Get user compliance summary
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

export default router;
