/**
 * AI Helper Module
 * Provides Google Gemini AI integration for intelligent GST query handling
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const { getUser } = require('../db/index');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(config.googleAI.apiKey);
const model = genAI.getGenerativeModel({ model: config.googleAI.modelName });

/**
 * System context for GST compliance queries
 */
const GST_SYSTEM_CONTEXT = `You are CompliBot, an expert GST (Goods and Services Tax) compliance assistant for India.

Your capabilities:
- Explain GST concepts in simple terms
- Calculate penalties and interest for late filing
- Help with GSTR-1 and GSTR-3B compliance
- Provide filing deadlines information
- Explain ITC (Input Tax Credit) rules
- Answer questions about HSN codes, tax rates
- Guide users on composition scheme
- Explain reverse charge mechanism

Important GST Filing Deadlines:
- GSTR-1 (Outward Supply): 11th of next month
- GSTR-3B (Summary Return): 20th of next month
- Late Filing Penalty: ₹100/day (GSTR-3B), ₹50/day (GSTR-1), max ₹5000
- Interest on late tax payment: 18% per annum

Response Guidelines:
1. Be concise and friendly
2. Use emojis appropriately
3. Provide specific numbers/dates when applicable
4. Always mention relevant sections/rules
5. Suggest next steps
6. For complex queries, offer to break down the answer
7. Support English, Hindi, and Telugu languages

Remember: You're helping small business owners who may not be tax experts.`;

/**
 * Generate AI response for GST query
 * @param {string} userQuery - User's question
 * @param {Object} userContext - Optional user context (GSTIN, state, etc.)
 * @param {string} language - Language preference (en, hi, te)
 * @returns {Promise<string>} - AI generated response
 */
async function generateGSTResponse(userQuery, userContext = {}, language = 'en') {
    try {
        // Build contextual prompt
        let contextPrompt = GST_SYSTEM_CONTEXT;

        if (userContext.gstin) {
            contextPrompt += `\n\nUser Context:
- GSTIN: ${userContext.gstin}
- Trade Name: ${userContext.tradeName || 'N/A'}
- State: ${userContext.stateName || userContext.stateCode || 'N/A'}`;
        }

        // Add language instruction
        const languageMap = {
            en: 'Respond in English',
            hi: 'Respond in Hindi (Devanagari script)',
            te: 'Respond in Telugu'
        };
        contextPrompt += `\n\n${languageMap[language] || 'Respond in English'}`;

        // Generate response
        const prompt = `${contextPrompt}\n\nUser Question: ${userQuery}\n\nProvide a helpful, accurate response:`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error('❌ AI Generation Error:', error);
        throw new Error('Failed to generate AI response');
    }
}

/**
 * Analyze invoice image and extract GST details
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<Object>} - Extracted invoice details
 */
async function analyzeInvoiceImage(imageBase64, mimeType = 'image/jpeg') {
    try {
        const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Analyze this invoice image and extract the following GST details in JSON format:

{
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "supplierGSTIN": "string",
  "supplierName": "string",
  "recipientGSTIN": "string",
  "recipientName": "string",
  "items": [
    {
      "description": "string",
      "hsnCode": "string",
      "quantity": number,
      "unitPrice": number,
      "taxableValue": number,
      "gstRate": number,
      "cgst": number,
      "sgst": number,
      "igst": number
    }
  ],
  "totalTaxableValue": number,
  "totalCGST": number,
  "totalSGST": number,
  "totalIGST": number,
  "totalInvoiceValue": number,
  "placeOfSupply": "string"
}

If any field is not found, use null. Be accurate with numbers.`;

        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            }
        ]);

        const response = result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Failed to extract structured data from invoice');
    } catch (error) {
        console.error('❌ Invoice Analysis Error:', error);
        throw new Error('Failed to analyze invoice image');
    }
}

/**
 * Calculate GST penalty with AI explanation
 * @param {number} daysLate - Number of days late
 * @param {number} taxAmount - Tax amount (for interest calculation)
 * @param {string} returnType - GSTR-1 or GSTR-3B
 * @returns {Promise<Object>} - Penalty calculation with explanation
 */
async function calculatePenaltyWithAI(daysLate, taxAmount = 0, returnType = 'GSTR-3B') {
    const penaltyPerDay = returnType === 'GSTR-3B' ? 100 : 50;
    const maxPenalty = 5000;
    const lateFee = Math.min(daysLate * penaltyPerDay, maxPenalty);

    // Interest calculation (18% per annum on tax amount)
    const interest = (taxAmount * 0.18 * daysLate) / 365;

    const totalPenalty = lateFee + interest;

    try {
        const prompt = `Explain this GST penalty in simple terms:
- Return Type: ${returnType}
- Days Late: ${daysLate}
- Late Fee: ₹${lateFee}
- Tax Amount: ₹${taxAmount}
- Interest (18% p.a.): ₹${interest.toFixed(2)}
- Total Penalty: ₹${totalPenalty.toFixed(2)}

Provide a brief, friendly explanation in 2-3 sentences.`;

        const result = await model.generateContent(prompt);
        const explanation = result.response.text();

        return {
            lateFee,
            interest: parseFloat(interest.toFixed(2)),
            totalPenalty: parseFloat(totalPenalty.toFixed(2)),
            explanation,
            breakdown: {
                penaltyPerDay,
                maxPenalty,
                daysLate,
                taxAmount
            }
        };
    } catch (error) {
        console.error('❌ Penalty AI Explanation Error:', error);
        return {
            lateFee,
            interest: parseFloat(interest.toFixed(2)),
            totalPenalty: parseFloat(totalPenalty.toFixed(2)),
            explanation: `You're ${daysLate} days late. Total penalty: ₹${totalPenalty.toFixed(2)} (Late fee: ₹${lateFee} + Interest: ₹${interest.toFixed(2)})`,
            breakdown: {
                penaltyPerDay,
                maxPenalty,
                daysLate,
                taxAmount
            }
        };
    }
}

/**
 * Generate personalized GST reminder message
 * @param {Object} user - User object from database
 * @param {Object} filing - Filing details
 * @param {number} daysUntilDeadline - Days remaining until deadline
 * @returns {Promise<string>} - Personalized reminder message
 */
async function generateReminderMessage(user, filing, daysUntilDeadline) {
    try {
        const urgencyLevel = daysUntilDeadline <= 2 ? 'URGENT' : daysUntilDeadline <= 5 ? 'IMPORTANT' : 'REMINDER';
        
        const prompt = `Generate a ${urgencyLevel} GST filing reminder message for:
- Trade Name: ${user.trade_name}
- Return Type: ${filing.return_type}
- Filing Period: ${filing.fp}
- Days Until Deadline: ${daysUntilDeadline}
- Language: ${user.language || 'en'}

Make it friendly but convey urgency if needed. Include emojis. Keep it under 150 words.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('❌ Reminder Generation Error:', error);
        // Fallback message
        return `⏰ Reminder: Your ${filing.return_type} for ${filing.fp} is due in ${daysUntilDeadline} days! Please file on time to avoid penalties.`;
    }
}

/**
 * Chat with AI about GST queries
 * @param {number} chatId - Telegram chat ID
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response
 */
async function chatWithAI(chatId, message) {
    try {
        // Get user context
        const user = await getUser(chatId);
        const userContext = user ? {
            gstin: user.gstin,
            tradeName: user.trade_name,
            stateCode: user.state_code,
            language: user.language || 'en'
        } : {};

        // Generate response
        const response = await generateGSTResponse(
            message,
            userContext,
            user?.language || 'en'
        );

        return response;
    } catch (error) {
        console.error('❌ Chat AI Error:', error);
        throw error;
    }
}

module.exports = {
    generateGSTResponse,
    analyzeInvoiceImage,
    calculatePenaltyWithAI,
    generateReminderMessage,
    chatWithAI
};
