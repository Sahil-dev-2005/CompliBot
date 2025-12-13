/**
 * SMS Helper Module
 * Generates SMS content for various GST-related notifications
 */

/**
 * Generate SMS content for OTP, filing reminders, etc.
 * @param {Object} data - The data object containing user info and context
 * @param {string} data.gstin - User's GSTIN
 * @param {string} data.trade_name - Business name
 * @param {string} data.type - SMS type ('otp', 'filing_reminder', 'penalty_alert')
 * @param {string} data.otp - OTP code (for OTP type)
 * @param {string} data.month - Filing month (for reminders)
 * @param {string} data.language - User's preferred language
 * @returns {string} Generated SMS content
 */
export const generateSMS = (data) => {
    const { gstin, trade_name, type, otp, month, language = 'en' } = data;

    const templates = {
        en: {
            otp: `CompliBot OTP: ${otp}\nFor GSTIN: ${gstin}\nValid for 5 minutes. Do not share this code.`,
            filing_reminder: `Reminder: GST filing due for ${trade_name} (${gstin}) for period ${month}. File now to avoid penalties.`,
            penalty_alert: `Alert: Late filing penalty applicable for ${gstin}. File immediately to minimize charges.`
        },
        hi: {
            otp: `CompliBot OTP: ${otp}\nGSTIN के लिए: ${gstin}\n5 मिनट के लिए वैध। इस कोड को साझा न करें।`,
            filing_reminder: `अनुस्मारक: ${trade_name} (${gstin}) के लिए अवधि ${month} हेतु GST फाइलिंग देय। जुर्माने से बचने के लिए अभी फाइल करें।`,
            penalty_alert: `चेतावनी: ${gstin} के लिए देर से फाइलिंग जुर्माना लागू। शुल्क कम करने के लिए तुरंत फाइल करें।`
        },
        kn: {
            otp: `CompliBot OTP: ${otp}\nGSTIN ಗಾಗಿ: ${gstin}\n5 ನಿಮಿಷಗಳವರೆಗೆ ಮಾನ್ಯ. ಈ ಕೋಡ್ ಅನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.`,
            filing_reminder: `ಜ್ಞಾಪನೆ: ${trade_name} (${gstin}) ಗಾಗಿ ಅವಧಿ ${month} ಗೆ GST ಫೈಲಿಂಗ್ ಬಾಕಿ. ದಂಡವನ್ನು ತಪ್ಪಿಸಲು ಈಗ ಫೈಲ್ ಮಾಡಿ.`,
            penalty_alert: `ಎಚ್ಚರಿಕೆ: ${gstin} ಗೆ ತಡವಾದ ಫೈಲಿಂಗ್ ದಂಡ ಅನ್ವಯಿಸುತ್ತದೆ. ಶುಲ್ಕವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ತಕ್ಷಣ ಫೈಲ್ ಮಾಡಿ.`
        }
    };

    const langTemplates = templates[language] || templates.en;
    return langTemplates[type] || `CompliBot notification for ${gstin}`;
};

export default { generateSMS };