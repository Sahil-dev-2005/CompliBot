/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Notification Engine Service
 * Schedule and process compliance notifications
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
    getAllActiveUsers,
    getUpcomingFilings,
    getOverdueFilings,
    createNotification,
    getPendingNotifications,
    markNotificationSent
} from '../db/queries.js';
import { PenaltyCalculator } from './penaltyCalculator.js';

export class NotificationEngine {
    /**
     * Process all users and schedule notifications
     * Called daily by cron job
     */
    static async processDailyNotifications() {
        console.log('🔔 Processing daily notifications...');
        
        const users = getAllActiveUsers();
        let notificationsScheduled = 0;
        
        for (const user of users) {
            try {
                const count = await this.processUserNotifications(user);
                notificationsScheduled += count;
            } catch (error) {
                console.error(`Error processing notifications for ${user.chat_id}:`, error);
            }
        }
        
        console.log(`✅ Scheduled ${notificationsScheduled} notifications`);
        return notificationsScheduled;
    }
    
    /**
     * Process notifications for a single user
     */
    static async processUserNotifications(user) {
        const upcomingFilings = getUpcomingFilings(user.chat_id, 20);
        const overdueFilings = getOverdueFilings(user.chat_id);
        
        let count = 0;
        
        // Schedule notifications for upcoming filings
        for (const filing of upcomingFilings) {
            const daysUntilDue = this.getDaysUntilDue(filing.due_date);
            
            // 20 days before: Green alert
            if (daysUntilDue === 20) {
                await this.scheduleNotification(user, filing, 'GREEN', 0);
                count++;
            }
            
            // 10 days before: Yellow alert
            if (daysUntilDue === 10) {
                await this.scheduleNotification(user, filing, 'YELLOW', 1);
                count++;
            }
            
            // 5 days before: Urgent yellow alert
            if (daysUntilDue === 5) {
                await this.scheduleNotification(user, filing, 'YELLOW_URGENT', 2);
                count++;
            }
            
            // 2 days before: Red alert
            if (daysUntilDue === 2) {
                await this.scheduleNotification(user, filing, 'RED', 2);
                count++;
            }
            
            // 1 day before: Final red alert
            if (daysUntilDue === 1) {
                await this.scheduleNotification(user, filing, 'RED_FINAL', 3);
                count++;
            }
        }
        
        // Schedule notifications for overdue filings
        for (const filing of overdueFilings) {
            await this.scheduleNotification(user, filing, 'OVERDUE', 3);
            count++;
        }
        
        return count;
    }
    
    /**
     * Schedule a notification
     */
    static async scheduleNotification(user, filing, type, priority) {
        const message = this.formatMessage(user.language, type, filing, user);
        
        createNotification({
            chat_id: user.chat_id,
            filing_id: filing.id,
            notification_type: type,
            message: message,
            scheduled_date: new Date().toISOString(),
            priority: priority,
            channel: 'telegram'
        });
        
        // If urgent and phone number available, schedule SMS too
        if ((type === 'RED_FINAL' || type === 'OVERDUE') && user.phone_number) {
            createNotification({
                chat_id: user.chat_id,
                filing_id: filing.id,
                notification_type: type,
                message: this.formatSMSMessage(type, filing),
                scheduled_date: new Date().toISOString(),
                priority: priority,
                channel: 'sms'
            });
        }
    }
    
    /**
     * Format notification message
     */
    static formatMessage(language, type, filing, user) {
        const daysUntilDue = this.getDaysUntilDue(filing.due_date);
        const daysOverdue = Math.abs(daysUntilDue);
        
        // For now, English only (can be extended with localization)
        switch (type) {
            case 'GREEN':
                return `📅 **Upcoming Filing Reminder**\n\n` +
                    `${filing.return_type} for ${this.formatPeriod(filing.period)}\n` +
                    `Due Date: ${this.formatDate(filing.due_date)}\n` +
                    `Days Remaining: ${daysUntilDue}\n\n` +
                    `Start preparing your invoices and documents now.`;
            
            case 'YELLOW':
                return `⚠️ **Action Required This Week**\n\n` +
                    `${filing.return_type} due in ${daysUntilDue} days\n` +
                    `Due Date: ${this.formatDate(filing.due_date)}\n\n` +
                    `Penalty if missed: ₹100/day\n\n` +
                    `Prepare and file soon!`;
            
            case 'YELLOW_URGENT':
                return `⚠️ **URGENT: Only ${daysUntilDue} Days Left**\n\n` +
                    `${filing.return_type} for ${this.formatPeriod(filing.period)}\n` +
                    `Due: ${this.formatDate(filing.due_date)}\n\n` +
                    `If not filed by deadline:\n` +
                    `• Penalty: ₹100/day\n` +
                    `• Interest: 18% per annum on unpaid tax\n\n` +
                    `⏰ File now to avoid penalties!`;
            
            case 'RED':
                return `🚨 **URGENT: DEADLINE APPROACHING**\n\n` +
                    `${filing.return_type} due in ${daysUntilDue} day(s)!\n` +
                    `Due Date: ${this.formatDate(filing.due_date)}\n\n` +
                    `Penalty from tomorrow: ₹100/day\n\n` +
                    `⏰ FILE TODAY TO AVOID PENALTIES`;
            
            case 'RED_FINAL':
                return `🚨 **FINAL REMINDER: LAST DAY TO FILE**\n\n` +
                    `${filing.return_type} is due TODAY!\n` +
                    `Due Date: ${this.formatDate(filing.due_date)}\n\n` +
                    `From tomorrow:\n` +
                    `• ₹100 penalty per day\n` +
                    `• 18% interest on unpaid tax\n\n` +
                    `🔴 FILE IMMEDIATELY TO AVOID PENALTIES`;
            
            case 'OVERDUE':
                const penalty = PenaltyCalculator.calculate(filing);
                return `🚨 **ALERT: FILING OVERDUE**\n\n` +
                    `${filing.return_type} was due ${daysOverdue} days ago\n` +
                    `Due Date: ${this.formatDate(filing.due_date)}\n\n` +
                    `💰 Penalty Accrued: ₹${penalty.totalPenalty.toLocaleString('en-IN')}\n` +
                    `⏱️ Daily Penalty: ₹${penalty.dailyAccrual} (still accruing!)\n\n` +
                    `🔴 FILE IMMEDIATELY to stop penalties`;
            
            default:
                return 'GST Filing Reminder';
        }
    }
    
    /**
     * Format SMS message (shorter version)
     */
    static formatSMSMessage(type, filing) {
        const daysUntilDue = this.getDaysUntilDue(filing.due_date);
        const daysOverdue = Math.abs(daysUntilDue);
        
        if (type === 'RED_FINAL') {
            return `URGENT: ${filing.return_type} due TODAY! File now to avoid ₹100/day penalty. - CompliBot`;
        }
        
        if (type === 'OVERDUE') {
            return `ALERT: ${filing.return_type} overdue by ${daysOverdue} days. Penalty: ₹${daysOverdue * 100}/day. File immediately! - CompliBot`;
        }
        
        return `GST Filing Reminder: ${filing.return_type} due soon. Check Telegram for details. - CompliBot`;
    }
    
    /**
     * Get days until due date
     */
    static getDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    /**
     * Format period (MMYYYY -> Month YYYY)
     */
    static formatPeriod(period) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = parseInt(period.substring(0, 2)) - 1;
        const year = period.substring(2);
        return `${months[month]} ${year}`;
    }
    
    /**
     * Format date for display
     */
    static formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    }
    
    /**
     * Get pending notifications and return them (for bot to send)
     * This is called by the API endpoint
     */
    static getPendingNotificationsForSending(limit = 100) {
        return getPendingNotifications();
    }
    
    /**
     * Mark notification as sent
     */
    static markAsSent(notificationId, success = true, errorMessage = null) {
        return markNotificationSent(notificationId, success, errorMessage);
    }
}

export default NotificationEngine;
