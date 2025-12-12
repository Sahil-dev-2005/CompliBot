/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Penalty Calculator Service
 * Calculate late filing penalties and interest on unpaid tax
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getComplianceDeadline } from '../db/queries.js';

export class PenaltyCalculator {
    /**
     * Calculate penalties for a filing
     * @param {Object} filing - Filing object with due_date, tax_amount, return_type
     * @param {Date} currentDate - Current date (default: now)
     * @returns {Object} Penalty breakdown
     */
    static calculate(filing, currentDate = new Date()) {
        const dueDate = new Date(filing.due_date);
        const daysOverdue = this.getDaysOverdue(dueDate, currentDate);
        
        if (daysOverdue <= 0) {
            return {
                isOverdue: false,
                daysOverdue: 0,
                lateFilingPenalty: 0,
                interest: 0,
                totalPenalty: 0,
                dailyAccrual: 0
            };
        }
        
        // Get penalty rates from compliance_deadlines table
        const penaltyRate = 100; // ₹100/day (default)
        const maxPenalty = filing.return_type === 'GSTR-9' || filing.return_type === 'GSTR-9C' ? 25000 : 5000;
        
        // Late filing penalty: ₹100/day (max varies by return type)
        const lateFilingPenalty = Math.min(daysOverdue * penaltyRate, maxPenalty);
        
        // Interest on unpaid tax: 18% per annum (Section 50 of CGST Act)
        const interest = filing.tax_amount 
            ? this.calculateInterest(filing.tax_amount, daysOverdue)
            : 0;
        
        const totalPenalty = lateFilingPenalty + interest;
        
        return {
            isOverdue: true,
            daysOverdue: daysOverdue,
            lateFilingPenalty: lateFilingPenalty,
            interest: Math.round(interest),
            totalPenalty: Math.round(totalPenalty),
            dailyAccrual: daysOverdue < (maxPenalty / penaltyRate) ? penaltyRate : 0,
            maxPenaltyReached: lateFilingPenalty >= maxPenalty
        };
    }
    
    /**
     * Calculate interest on unpaid tax @ 18% per annum
     * Interest = Principal × Rate × (Days / 365)
     */
    static calculateInterest(taxAmount, daysOverdue) {
        const annualRate = 0.18; // 18% as per CGST Act Section 50
        const dailyRate = annualRate / 365;
        return taxAmount * dailyRate * daysOverdue;
    }
    
    /**
     * Project future penalties if filing delayed further
     * @param {Object} filing - Filing object
     * @param {number} futureDays - Days to project into future
     * @returns {Object} Current vs future penalty comparison
     */
    static projectPenalty(filing, futureDays = 10) {
        const currentDate = new Date();
        const futureDate = new Date(currentDate.getTime() + futureDays * 24 * 60 * 60 * 1000);
        
        const currentPenalty = this.calculate(filing, currentDate);
        const futurePenalty = this.calculate(filing, futureDate);
        
        return {
            current: currentPenalty,
            future: futurePenalty,
            additionalCost: futurePenalty.totalPenalty - currentPenalty.totalPenalty,
            projectionDays: futureDays
        };
    }
    
    /**
     * Calculate days overdue
     */
    static getDaysOverdue(dueDate, currentDate) {
        const diffTime = currentDate - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
    
    /**
     * Calculate penalty for wrong ITC claim
     * Penalty = 100% of wrongly claimed ITC + 24% interest (Section 73/74 of CGST Act)
     */
    static calculateITCPenalty(wrongITCAmount, isIntentional = false) {
        // Section 73: Unintentional - 100% penalty + 18% interest
        // Section 74: Intentional - 100% penalty + up to 24% interest + prosecution
        
        const penalty = wrongITCAmount; // 100% of wrongly claimed amount
        const interestRate = isIntentional ? 0.24 : 0.18;
        const interest = wrongITCAmount * interestRate;
        
        return {
            wrongITCAmount: wrongITCAmount,
            penalty: penalty,
            interest: Math.round(interest),
            total: Math.round(penalty + interest),
            section: isIntentional ? '74' : '73',
            isProsecutionRisk: isIntentional
        };
    }
    
    /**
     * Get penalty tier based on amount
     */
    static getPenaltyTier(totalPenalty) {
        if (totalPenalty === 0) return 'NONE';
        if (totalPenalty < 1000) return 'LOW';
        if (totalPenalty < 5000) return 'MEDIUM';
        if (totalPenalty < 10000) return 'HIGH';
        return 'CRITICAL';
    }
    
    /**
     * Format penalty for display
     */
    static formatPenalty(penalty) {
        return {
            ...penalty,
            formattedLateFiling: `₹${penalty.lateFilingPenalty.toLocaleString('en-IN')}`,
            formattedInterest: `₹${penalty.interest.toLocaleString('en-IN')}`,
            formattedTotal: `₹${penalty.totalPenalty.toLocaleString('en-IN')}`,
            tier: this.getPenaltyTier(penalty.totalPenalty)
        };
    }
}

export default PenaltyCalculator;
