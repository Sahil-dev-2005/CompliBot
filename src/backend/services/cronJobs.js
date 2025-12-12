/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Cron Jobs - Scheduled Tasks
 * Automated background jobs for compliance tracking
 * ═══════════════════════════════════════════════════════════════════════════
 */

import cron from 'node-cron';
import { NotificationEngine } from './notificationEngine.js';
import { DeadlineTracker } from './deadlineTracker.js';

export class CronJobs {
    static jobs = [];
    
    /**
     * Initialize all cron jobs
     */
    static initialize() {
        console.log('⏰ Initializing cron jobs...');
        
        // Job 1: Process daily notifications (9 AM IST every day)
        this.jobs.push(
            cron.schedule('0 9 * * *', async () => {
                console.log('🔔 Running: Daily Notifications');
                try {
                    await NotificationEngine.processDailyNotifications();
                } catch (error) {
                    console.error('Error in daily notifications:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            })
        );
        
        // Job 2: Check overdue filings (Every 6 hours)
        this.jobs.push(
            cron.schedule('0 */6 * * *', async () => {
                console.log('🔍 Running: Check Overdue Filings');
                try {
                    await DeadlineTracker.checkOverdueFilings();
                } catch (error) {
                    console.error('Error checking overdue filings:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            })
        );
        
        // Job 3: Generate next month filings (1st day of every month at 2 AM)
        this.jobs.push(
            cron.schedule('0 2 1 * *', async () => {
                console.log('📅 Running: Generate Next Month Filings');
                try {
                    await DeadlineTracker.generateNextMonthFilings();
                } catch (error) {
                    console.error('Error generating next month filings:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            })
        );
        
        // Job 4: Database cleanup (Every Sunday at 3 AM)
        this.jobs.push(
            cron.schedule('0 3 * * 0', async () => {
                console.log('🧹 Running: Database Cleanup');
                try {
                    await this.databaseCleanup();
                } catch (error) {
                    console.error('Error in database cleanup:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            })
        );
        
        console.log(`✅ ${this.jobs.length} cron jobs initialized`);
    }
    
    /**
     * Database cleanup - Remove old sent notifications
     */
    static async databaseCleanup() {
        const { execute } = await import('../db/index.js');
        
        // Delete notifications older than 90 days
        execute(`
            DELETE FROM notifications 
            WHERE is_sent = 1 
            AND sent_date < datetime('now', '-90 days')
        `);
        
        // Delete old audit logs (older than 1 year)
        execute(`
            DELETE FROM audit_log 
            WHERE created_at < datetime('now', '-365 days')
        `);
        
        console.log('✅ Database cleanup completed');
    }
    
    /**
     * Stop all cron jobs
     */
    static stopAll() {
        console.log('🛑 Stopping all cron jobs...');
        this.jobs.forEach(job => job.stop());
        console.log('✅ All cron jobs stopped');
    }
    
    /**
     * Manual trigger for testing
     */
    static async runManually(jobName) {
        console.log(`🔧 Manually triggering: ${jobName}`);
        
        switch (jobName) {
            case 'notifications':
                return await NotificationEngine.processDailyNotifications();
            
            case 'overdue':
                return await DeadlineTracker.checkOverdueFilings();
            
            case 'nextMonth':
                return await DeadlineTracker.generateNextMonthFilings();
            
            case 'cleanup':
                return await this.databaseCleanup();
            
            default:
                throw new Error(`Unknown job: ${jobName}`);
        }
    }
}

export default CronJobs;
