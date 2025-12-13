// Simple test script to verify OTP functionality
import { generateOTP, verifyOTP, validateGSTIN } from './src/modules/otpHelper.js';

console.log('🧪 Testing OTP Helper Functions...\n');

// Test 1: GSTIN Validation
console.log('1. Testing GSTIN Validation:');
const validGSTIN = '29ABCDE1234F1Z5';
const invalidGSTIN = '123INVALID';

console.log(`   Valid GSTIN (${validGSTIN}):`, validateGSTIN(validGSTIN) ? '✅ PASS' : '❌ FAIL');
console.log(`   Invalid GSTIN (${invalidGSTIN}):`, !validateGSTIN(invalidGSTIN) ? '✅ PASS' : '❌ FAIL');

// Test 2: OTP Generation
console.log('\n2. Testing OTP Generation:');
try {
    const otp = generateOTP(validGSTIN);
    console.log(`   Generated OTP: ${otp}`);
    console.log(`   OTP Length: ${otp.length} (should be 6):`, otp.length === 6 ? '✅ PASS' : '❌ FAIL');
    console.log(`   OTP is numeric:`, /^\d{6}$/.test(otp) ? '✅ PASS' : '❌ FAIL');
    
    // Test 3: OTP Verification
    console.log('\n3. Testing OTP Verification:');
    console.log(`   Correct OTP verification:`, verifyOTP(validGSTIN, otp) ? '✅ PASS' : '❌ FAIL');
    
    // Generate new OTP for wrong verification test
    const otp2 = generateOTP(validGSTIN);
    console.log(`   Wrong OTP verification:`, !verifyOTP(validGSTIN, '000000') ? '✅ PASS' : '❌ FAIL');
    
} catch (error) {
    console.error('❌ Error during testing:', error.message);
}

console.log('\n🏁 OTP Testing Complete!');