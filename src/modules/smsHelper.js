/**
 * SMS Helper Module for CompliBot
 * Member 2 (SMS Engine)
 * Purpose: Generate GST NIL return SMS strings and deep links for 14409
 */

/**
 * Validates GSTIN format
 * Format: 2 digits (state) + 10 alphanumeric (PAN) + 1 digit (entity) + 1 alphabet (Z) + 1 checksum
 * Example: 29ABCDE1234F1Z5
 */
export function validateGSTIN(gstin) {
    if (!gstin) return false;
    
    // Remove spaces and convert to uppercase
    gstin = gstin.replace(/\s+/g, '').trim().toUpperCase();
    
    // GSTIN must be 15 characters
    if (gstin.length !== 15) return false;
    
    // Pattern: 2 digits + 10 alphanumeric + 1 digit + 1 letter + 1 alphanumeric
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    
    return gstinPattern.test(gstin);
}

/**
 * Format month to MMYYYY format required by GST
 * @param {string|Date} month - Can be "2024-03", Date object, or "March 2024"
 * @returns {string} - Returns "032024" format
 */
export function formatMonth(month) {
    let date;
    
    if (month instanceof Date) {
        date = month;
    } else if (typeof month === 'string') {
        // Handle "2024-03" format
        if (month.match(/^\d{4}-\d{2}$/)) {
            const [year, monthNum] = month.split('-');
            return `${monthNum}${year}`;
        }
        // Handle "March 2024" format
        date = new Date(month);
    }
    
    if (!date || isNaN(date.getTime())) {
        throw new Error('Invalid month format. Use YYYY-MM, Date object, or "Month YYYY"');
    }
    
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    
    return `${mm}${yyyy}`;
}

/**
 * Generate SMS string for GST NIL Return (Form 3B)
 * Official Format: NIL 3B <GSTIN> <MMYYYY>
 * Example: NIL 3B 29ABCDE1234F1Z5 032024
 * 
 * @param {string} gstin - 15 digit GSTIN
 * @param {string} month - Month in YYYY-MM or MMYYYY format
 * @returns {string} - Formatted SMS string
 */
export function generateSMSString(gstin, month) {
    // Validate GSTIN
    if (!validateGSTIN(gstin)) {
        throw new Error('Invalid GSTIN format');
    }
    
    // Format month
    let formattedMonth;
    try {
        // If already in MMYYYY format
        if (month.match(/^\d{6}$/)) {
            formattedMonth = month;
        } else {
            formattedMonth = formatMonth(month);
        }
    } catch (error) {
        throw new Error(`Invalid month format: ${error.message}`);
    }
    
    // Clean GSTIN (remove spaces)
    const cleanGSTIN = gstin.trim().toUpperCase();
    
    // Format: NIL 3B <GSTIN> <MMYYYY>
    return `NIL 3B ${cleanGSTIN} ${formattedMonth}`;
}

/**
 * Generate SMS deep link for mobile devices
 * This creates a link that opens the SMS app with pre-filled content
 * 
 * @param {string} gstin - 15 digit GSTIN
 * @param {string} month - Month in YYYY-MM format
 * @param {string} phoneNumber - Recipient number (default: 14409 for GST India)
 * @returns {object} - Object with different link formats for testing
 */
export function generateSMSDeepLink(gstin, month, phoneNumber = '14409') {
    const smsBody = generateSMSString(gstin, month);
    
    // URL encode the message body
    const encodedBody = encodeURIComponent(smsBody);
    
    // Different formats for different platforms
    return {
        // Standard format (works on most Android devices)
        standard: `sms:${phoneNumber}?body=${encodedBody}`,
        
        // iOS format (some iOS versions prefer this)
        ios: `sms:${phoneNumber}&body=${encodedBody}`,
        
        // Alternative format (Telegram-friendly)
        telegram: `sms:${phoneNumber}?body=${encodedBody}`,
        
        // Raw text for copying
        rawText: smsBody,
        
        // Display text for user
        displayText: `📱 Tap to send SMS to ${phoneNumber}`,
        
        // Phone number
        recipient: phoneNumber
    };
}

/**
 * Generate user-friendly description of what the SMS will do
 * @param {string} gstin - GSTIN
 * @param {string} month - Month
 * @returns {string} - Human readable description
 */
export function getSMSDescription(gstin, month) {
    const formattedMonth = formatMonth(month);
    const monthName = new Date(`${formattedMonth.substr(2)}-${formattedMonth.substr(0, 2)}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    
    return `This will file a NIL return for GSTR-3B for ${monthName} using GSTIN: ${gstin}`;
}

/**
 * Create a complete SMS filing object for the bot
 * This is what you'll pass to Member 1's bot integration
 * 
 * @param {string} gstin - User's GSTIN
 * @param {string} month - Month to file for
 * @returns {object} - Complete SMS filing data
 */
export function createSMSFiling(gstin, month) {
    const deepLink = generateSMSDeepLink(gstin, month);
    const description = getSMSDescription(gstin, month);
    
    return {
        type: 'NIL',
        returnType: 'GSTR-3B',
        gstin: gstin.toUpperCase(),
        month: formatMonth(month),
        smsBody: deepLink.rawText,
        deepLinks: {
            primary: deepLink.standard,
            fallback: deepLink.ios
        },
        description: description,
        instructions: [
            '1. Tap the "Send SMS" button below',
            '2. Your SMS app will open with pre-filled message',
            '3. Review the message and tap Send',
            '4. You will receive a confirmation from GST'
        ]
    };
}

// For testing purposes (can be removed in production)
export const TEST_DATA = {
    validGSTIN: '29ABCDE1234F1Z5',
    validMonth: '2024-03',
    expectedSMS: 'NIL 3B 29ABCDE1234F1Z5 032024'
};
