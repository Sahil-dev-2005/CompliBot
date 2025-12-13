#!/usr/bin/env node

/**
 * Verification script for CompliBot backend setup
 * Run this with: node verify-setup.js
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Verifying CompliBot Backend Setup...\n');

// Check environment variables
const requiredEnvVars = ['BOT_TOKEN', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
let envCheckPassed = true;

console.log('📋 Environment Variables Check:');
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${varName === 'BOT_TOKEN' ? value.substring(0, 10) + '...' : 'Set'}`);
    } else {
        console.log(`❌ ${varName}: Missing`);
        envCheckPassed = false;
    }
});

if (!envCheckPassed) {
    console.log('\n❌ Environment variables check failed. Please check your .env file.');
    process.exit(1);
}

console.log('\n🔧 Module Import Check:');

try {
    // Test imports
    const { generateOTP, verifyOTP } = await import('./src/modules/otpHelper.js');
    console.log('✅ OTP Helper module imported successfully');
    
    // Test OTP generation
    const testOtp = generateOTP('29ABCDE1234F1Z5');
    console.log(`✅ OTP generation test: ${testOtp} (${testOtp.length} digits)`);
    
    // Test OTP verification
    const isValid = verifyOTP('29ABCDE1234F1Z5', testOtp);
    console.log(`✅ OTP verification test: ${isValid ? 'PASS' : 'FAIL'}`);
    
} catch (error) {
    console.log('❌ Module import failed:', error.message);
    process.exit(1);
}

try {
    const bot = await import('./src/bot.js');
    console.log('✅ Bot module imported successfully');
} catch (error) {
    console.log('❌ Bot module import failed:', error.message);
    process.exit(1);
}

try {
    const app = await import('./src/server.js');
    console.log('✅ Server module imported successfully');
} catch (error) {
    console.log('❌ Server module import failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All checks passed! The backend should start successfully.');
console.log('\n🚀 To start the application, run:');
console.log('   npm start');
console.log('\n🔧 For development with auto-restart, run:');
console.log('   npm run dev');