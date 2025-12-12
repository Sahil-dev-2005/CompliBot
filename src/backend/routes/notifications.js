/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Notification Routes - API endpoints for notification management
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
    getPendingNotifications,
    getNotificationHistory,
    markNotificationSent
} from '../db/queries.js';

const router = express.Router();

/**
 * GET /api/notifications/pending
 * Get all pending notifications (for bot to send)
 */
router.get('/pending', (req, res) => {
    try {
        const { limit } = req.query;
        const maxLimit = parseInt(limit) || 100;
        
        const notifications = getPendingNotifications(maxLimit);
        
        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/:chatId
 * Get notification history for a user
 */
router.get('/:chatId', (req, res) => {
    try {
        const { limit, type } = req.query;
        const maxLimit = parseInt(limit) || 50;
        
        const notifications = getNotificationHistory(req.params.chatId, maxLimit);
        
        // Filter by type if specified
        let filtered = notifications;
        if (type) {
            filtered = notifications.filter(n => n.alert_type === type.toUpperCase());
        }
        
        res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notifications/:notificationId/sent
 * Mark notification as sent
 */
router.post('/:notificationId/sent', (req, res) => {
    try {
        const { channel } = req.body; // 'telegram' or 'sms'
        
        if (!channel || !['telegram', 'sms'].includes(channel)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid channel. Must be "telegram" or "sms"'
            });
        }
        
        markNotificationSent(
            req.params.notificationId,
            true,  // success = true
            null   // no error message
        );
        
        res.json({
            success: true,
            message: 'Notification marked as sent'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notifications/:notificationId/failed
 * Mark notification as failed
 */
router.post('/:notificationId/failed', (req, res) => {
    try {
        const { channel, error } = req.body;
        
        if (!channel || !['telegram', 'sms'].includes(channel)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid channel. Must be "telegram" or "sms"'
            });
        }
        
        markNotificationSent(
            req.params.notificationId,
            false,  // success = false
            error || 'Unknown error'
        );
        
        res.json({
            success: true,
            message: 'Notification marked as failed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
