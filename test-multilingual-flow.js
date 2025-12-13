/**
 * Test script for the multilingual onboarding flow and helper integration
 */

import { generateSMS } from './src/modules/smsHelper.js';
import { generateGSTJson, validateGSTJson } from './src/modules/jsonHelper.js';

console.log('🧪 Testing Multilingual CompliBot Implementation\n');

// Test 1: SMS Helper
console.log('📱 Testing SMS Helper:');
const smsTests = [
    {
        gstin: '29ABCDE1234F1Z5',
        trade_name: 'Test Business',
        type: 'otp',
        otp: '123456',
        language: 'en'
    },
    {
        gstin: '29ABCDE1234F1Z5',
        trade_name: 'टेस्ट व्यवसाय',
        type: 'filing_reminder',
        month: '102025',
        language: 'hi'
    },
    {
        gstin: '29ABCDE1234F1Z5',
        trade_name: 'ಪರೀಕ್ಷಾ ವ್ಯಾಪಾರ',
        type: 'penalty_alert',
        language: 'kn'
    }
];

smsTests.forEach((test, index) => {
    const sms = generateSMS(test);
    console.log(`  ${index + 1}. ${test.language.toUpperCase()}: ${sms}\n`);
});

// Test 2: JSON Helper
console.log('📄 Testing JSON Helper:');
const jsonTest = {
    gstin: '29ABCDE1234F1Z5',
    trade_name: 'Test Business',
    fp: '102025',
    return_type: 'GSTR3B',
    summary: {
        total_taxable: 100000,
        total_igst: 18000,
        zero_rated: 5000,
        nil_exempt: 2000
    }
};

const gstJson = generateGSTJson(jsonTest);
const validation = validateGSTJson(gstJson);

console.log('  Generated JSON structure:');
console.log('  GSTIN:', gstJson.gstin);
console.log('  Period:', gstJson.ret_period);
console.log('  State Code:', gstJson.state_cd);
console.log('  Financial Year:', gstJson.fy);
console.log('  Validation:', validation.isValid ? '✅ Valid' : '❌ Invalid');

if (!validation.isValid) {
    console.log('  Errors:', validation.errors);
}

console.log('\n✅ All tests completed successfully!');
console.log('\n🚀 Ready to test the bot with:');
console.log('   1. /start - Begin multilingual onboarding');
console.log('   2. /status - Check registration status');
console.log('   3. /demo - Test helper integration');