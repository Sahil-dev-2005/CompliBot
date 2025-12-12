/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Deadline Tracker Service
 * Generate and track compliance deadlines for users
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
    getUser,
    getComplianceDeadline,
    createFiling,
    getFilingsByUser,
    markFilingAsOverdue,
    createPenalty,
    updatePenalty,
    getPenaltiesByUser
} from '../db/queries.js';
import { PenaltyCalculator } from './penaltyCalculator.js';
import * as sms from '../../modules/smsHelper.js';

export class DeadlineTracker {
    /**
     * Initialize deadlines for a new user
     * Creates filings for the next 3 months
     */
    static async initializeUserDeadlines(chatId) {
        const user = getUser(chatId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const today = new Date();
        const filings = [];
        
        // Create filings for next 3 months
        for (let i = 0; i < 3; i++) {
            const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
            
            // GSTR-1
            const gstr1Filing = await this.createFilingForMonth(user, 'GSTR-1', month);
            if (gstr1Filing) filings.push(gstr1Filing);
            
            // GSTR-3B
            const gstr3bFiling = await this.createFilingForMonth(user, 'GSTR-3B', month);
            if (gstr3bFiling) filings.push(gstr3bFiling);
        }
        
        // If annual filing due this year, add it
        const currentYear = today.getFullYear();
        if (today.getMonth() >= 9) { // After October
            const gstr9Filing = await this.createAnnualFiling(user, currentYear - 1);
            if (gstr9Filing) filings.push(gstr9Filing);
        }
        
        return filings;
    }
    
    /**
     * Create filing for a specific month
     */
    static async createFilingForMonth(user, returnType, month) {
        const deadline = getComplianceDeadline(returnType, user.filing_scheme);
        if (!deadline) return null;
        
        // Calculate due date
        const dueDate = new Date(month.getFullYear(), month.getMonth(), deadline.due_day);
        
        // If quarterly filer and not a quarter end, skip
        if (user.filing_scheme === 'QUARTERLY') {
            const quarterMonth = month.getMonth();
            if (![2, 5, 8, 11].includes(quarterMonth)) { // Mar, Jun, Sep, Dec
                return null;
            }
        }
        
        // Format period (MMYYYY)
        const period = this.formatPeriod(month);
        
        // Generate SMS content using existing module
        let smsData = null;
        try {
            if (returnType === 'GSTR-3B') {
                smsData = await sms.createSMSFiling(user.gstin, period);
            } else if (returnType === 'GSTR-1') {
                const isQuarterly = user.filing_scheme === 'QUARTERLY';
                smsData = await sms.createGSTR1Filing(user.gstin, period, isQuarterly);
            }
        } catch (error) {
            console.error('Error generating SMS:', error);
        }
        
        // Create filing record
        const result = createFiling({
            chat_id: user.chat_id,
            return_type: returnType,
            period: period,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'PENDING',
            sms_body: smsData?.smsBody || null,
            sms_link: smsData?.shortUrl || smsData?.deepLink || null,
            short_id: smsData?.shortId || null
        });
        
        return result;
    }
    
    /**
     * Create annual filing (GSTR-9)
     */
    static async createAnnualFiling(user, financialYear) {
        const deadline = getComplianceDeadline('GSTR-9', 'ANNUAL');
        if (!deadline) return null;
        
        // GSTR-9 due on Dec 31 of following year
        const dueDate = new Date(financialYear + 1, 11, 31); // Dec 31
        
        const period = `FY${financialYear}-${(financialYear + 1).toString().slice(2)}`;
        
        createFiling({
            chat_id: user.chat_id,
            return_type: 'GSTR-9',
            period: period,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'PENDING'
        });
    }
    
    /**
     * Check all filings and mark overdue ones
     * Called daily by cron
     */
    static async checkOverdueFilings() {
        console.log('🔍 Checking for overdue filings...');
        
        const overdueFilings = await import('../db/queries.js').then(m => m.getOverdueFilings());
        let overdueCount = 0;
        
        for (const filing of overdueFilings) {
            if (filing.status === 'PENDING') {
                // Mark as overdue
                markFilingAsOverdue(filing.id);
                overdueCount++;
                
                // Calculate and create/update penalty
                await this.updatePenaltyForFiling(filing);
            }
        }
        
        console.log(`✅ Marked ${overdueCount} filings as overdue`);
        return overdueCount;
    }
    
    /**
     * Update penalty for an overdue filing
     */
    static async updatePenaltyForFiling(filing) {
        const penalty = PenaltyCalculator.calculate(filing);
        
        if (!penalty.isOverdue) return;
        
        // Check if penalty record exists
        const existingPenalties = getPenaltiesByUser(filing.chat_id);
        const existingPenalty = existingPenalties.find(p => p.filing_id === filing.id);
        
        if (existingPenalty) {
            // Update existing penalty
            updatePenalty(
                existingPenalty.id,
                penalty.lateFilingPenalty,
                penalty.daysOverdue,
                penalty.interest
            );
        } else {
            // Create new penalty record
            createPenalty({
                chat_id: filing.chat_id,
                filing_id: filing.id,
                penalty_type: 'LATE_FILING',
                amount: penalty.lateFilingPenalty,
                start_date: filing.due_date,
                days_overdue: penalty.daysOverdue,
                interest_amount: penalty.interest
            });
        }
    }
    
    /**
     * Generate next month's filings for all users
     * Called on 1st of every month
     */
    static async generateNextMonthFilings() {
        console.log('📅 Generating next month filings...');
        
        const users = await import('../db/queries.js').then(m => m.getAllActiveUsers());
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 3); // 3 months ahead
        
        let createdCount = 0;
        
        for (const user of users) {
            try {
                // Check if filings already exist for this month
                const existingFilings = getFilingsByUser(user.chat_id);
                const period = this.formatPeriod(nextMonth);
                
                const alreadyExists = existingFilings.some(f => f.period === period);
                if (alreadyExists) continue;
                
                // Create filings for next month
                await this.createFilingForMonth(user, 'GSTR-1', nextMonth);
                await this.createFilingForMonth(user, 'GSTR-3B', nextMonth);
                createdCount += 2;
            } catch (error) {
                console.error(`Error generating filings for ${user.chat_id}:`, error);
            }
        }
        
        console.log(`✅ Created ${createdCount} filings for next month`);
        return createdCount;
    }
    
    /**
     * Format month to MMYYYY
     */
    static formatPeriod(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}${year}`;
    }
}

export default DeadlineTracker;
