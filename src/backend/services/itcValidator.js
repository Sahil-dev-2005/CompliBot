/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ITC Validator Service
 * Detect blocked ITC categories and validate claims
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getBlockedITCCategories, createITCReconciliation } from '../db/queries.js';
import { PenaltyCalculator } from './penaltyCalculator.js';

export class ITCValidator {
    static blockedCategoriesCache = null;
    
    /**
     * Load blocked categories from database
     */
    static async loadBlockedCategories() {
        if (!this.blockedCategoriesCache) {
            const categories = getBlockedITCCategories();
            this.blockedCategoriesCache = categories.map(cat => ({
                ...cat,
                keywords: JSON.parse(cat.keywords || '[]'),
                examples: JSON.parse(cat.examples || '[]')
            }));
        }
        return this.blockedCategoriesCache;
    }
    
    /**
     * Validate ITC claims and detect blocked categories
     * @param {string} chatId - User chat ID
     * @param {string} period - Period in MMYYYY format
     * @param {Array} invoices - Array of invoice objects
     * @returns {Object} Validation results
     */
    static async validateITCClaim(chatId, period, invoices) {
        await this.loadBlockedCategories();
        
        const blockedInvoices = [];
        const validInvoices = [];
        const warnings = [];
        let totalBlockedAmount = 0;
        let totalValidAmount = 0;
        
        for (const invoice of invoices) {
            const detection = this.detectBlockedCategory(invoice.description);
            
            if (detection.isBlocked) {
                blockedInvoices.push({
                    ...invoice,
                    blockedCategory: detection.category.category,
                    reason: detection.category.description,
                    fullyBlocked: detection.category.is_fully_blocked === 1,
                    restrictionPercentage: detection.category.restriction_percentage,
                    matchedKeyword: detection.matchedKeyword
                });
                
                if (detection.category.is_fully_blocked === 1) {
                    totalBlockedAmount += invoice.itc_amount;
                } else {
                    // Partial restriction (e.g., 50% for fuel)
                    const blockedPortion = invoice.itc_amount * (detection.category.restriction_percentage / 100);
                    totalBlockedAmount += blockedPortion;
                    
                    warnings.push({
                        invoiceId: invoice.id,
                        category: detection.category.category,
                        message: `Only ${100 - detection.category.restriction_percentage}% ITC allowed`,
                        allowedAmount: invoice.itc_amount - blockedPortion
                    });
                }
            } else {
                validInvoices.push(invoice);
                totalValidAmount += invoice.itc_amount;
            }
        }
        
        // Check for unusual patterns
        const totalITC = totalValidAmount + totalBlockedAmount;
        const unusualPatterns = this.detectUnusualPatterns(invoices, totalITC);
        
        // Save reconciliation to database
        if (blockedInvoices.length > 0 || unusualPatterns.length > 0) {
            const blockedCategories = blockedInvoices.map(inv => ({
                category: inv.blockedCategory,
                amount: inv.itc_amount,
                invoiceId: inv.id || inv.invoice_number
            }));
            
            createITCReconciliation({
                chat_id: chatId,
                period: period,
                total_itc_claimed: totalITC,
                matched_itc: totalValidAmount,
                mismatched_count: blockedInvoices.length,
                blocked_itc_amount: totalBlockedAmount,
                blocked_categories: JSON.stringify(blockedCategories),
                status: 'PENDING'
            });
        }
        
        return {
            valid: validInvoices,
            blocked: blockedInvoices,
            warnings: warnings,
            unusualPatterns: unusualPatterns,
            totalBlocked: Math.round(totalBlockedAmount),
            totalValid: Math.round(totalValidAmount),
            totalITC: Math.round(totalITC),
            hasIssues: blockedInvoices.length > 0 || unusualPatterns.length > 0,
            riskLevel: this.calculateRiskLevel(totalBlockedAmount, totalITC)
        };
    }
    
    /**
     * Detect if invoice description matches blocked category
     * @param {string} description - Invoice description
     * @returns {Object} Detection result
     */
    static detectBlockedCategory(description) {
        const lowerDesc = description.toLowerCase();
        
        for (const category of this.blockedCategoriesCache || []) {
            for (const keyword of category.keywords) {
                if (lowerDesc.includes(keyword.toLowerCase())) {
                    return {
                        isBlocked: true,
                        category: category,
                        matchedKeyword: keyword
                    };
                }
            }
        }
        
        return { isBlocked: false };
    }
    
    /**
     * Detect unusual patterns in ITC claims
     */
    static detectUnusualPatterns(invoices, totalITC) {
        const patterns = [];
        
        // Pattern 1: ITC claim too high relative to typical business
        // For retail: ITC typically 5-10% of sales
        // For manufacturing: ITC typically 15-25% of sales
        
        // Pattern 2: Sudden spike in ITC claims
        // Compare with previous months
        
        // Pattern 3: Too many small invoices (splitting to avoid detection)
        const smallInvoices = invoices.filter(inv => inv.amount < 5000);
        if (smallInvoices.length > 20) {
            patterns.push({
                type: 'INVOICE_SPLITTING',
                severity: 'MEDIUM',
                description: `${smallInvoices.length} invoices below ₹5,000 - Possible invoice splitting`,
                count: smallInvoices.length
            });
        }
        
        // Pattern 4: Round number amounts (suspicious)
        const roundNumbers = invoices.filter(inv => 
            inv.amount % 10000 === 0 || inv.amount % 5000 === 0
        );
        if (roundNumbers.length > 5) {
            patterns.push({
                type: 'ROUND_AMOUNTS',
                severity: 'LOW',
                description: `${roundNumbers.length} invoices with round amounts - Review for authenticity`,
                count: roundNumbers.length
            });
        }
        
        return patterns;
    }
    
    /**
     * Calculate risk level based on blocked ITC amount
     */
    static calculateRiskLevel(blockedAmount, totalITC) {
        if (blockedAmount === 0) return 'NONE';
        
        const percentage = (blockedAmount / totalITC) * 100;
        
        if (percentage < 5) return 'LOW';
        if (percentage < 15) return 'MEDIUM';
        if (percentage < 30) return 'HIGH';
        return 'CRITICAL';
    }
    
    /**
     * Generate recommendations based on validation results
     */
    static generateRecommendations(validationResults) {
        const recommendations = [];
        
        if (validationResults.blocked.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'REMOVE_BLOCKED_ITC',
                message: `Remove ₹${validationResults.totalBlocked.toLocaleString('en-IN')} from ITC claim`,
                details: `${validationResults.blocked.length} blocked items detected`,
                consequence: 'Claiming blocked ITC attracts 100% penalty + 24% interest'
            });
        }
        
        if (validationResults.warnings.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'ADJUST_PARTIAL_ITC',
                message: 'Review partially restricted ITC claims',
                details: `${validationResults.warnings.length} items with partial restrictions`,
                consequence: 'Claiming excess ITC will be disallowed in audit'
            });
        }
        
        if (validationResults.unusualPatterns.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'REVIEW_PATTERNS',
                message: 'Unusual patterns detected in your ITC claims',
                details: validationResults.unusualPatterns.map(p => p.description).join('; '),
                consequence: 'May trigger audit or scrutiny notice'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Calculate penalty if wrong ITC is claimed
     */
    static calculatePenaltyForWrongITC(blockedAmount) {
        return PenaltyCalculator.calculateITCPenalty(blockedAmount, false);
    }
    
    /**
     * Format validation results for display
     */
    static formatValidationResults(results) {
        const penalty = this.calculatePenaltyForWrongITC(results.totalBlocked);
        const recommendations = this.generateRecommendations(results);
        
        return {
            summary: {
                totalITC: `₹${results.totalITC.toLocaleString('en-IN')}`,
                validITC: `₹${results.totalValid.toLocaleString('en-IN')}`,
                blockedITC: `₹${results.totalBlocked.toLocaleString('en-IN')}`,
                blockedCount: results.blocked.length,
                riskLevel: results.riskLevel
            },
            penalty: {
                amount: `₹${penalty.total.toLocaleString('en-IN')}`,
                breakdown: {
                    base: `₹${penalty.penalty.toLocaleString('en-IN')} (100% of wrong ITC)`,
                    interest: `₹${penalty.interest.toLocaleString('en-IN')} (${penalty.section === '73' ? '18' : '24'}% interest)`
                }
            },
            blockedItems: results.blocked.map(item => ({
                description: item.description,
                amount: `₹${item.itc_amount.toLocaleString('en-IN')}`,
                category: item.blockedCategory,
                reason: item.reason
            })),
            recommendations: recommendations
        };
    }
}

export default ITCValidator;
