// Simple API test script to verify OTP endpoints
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';
const TEST_GSTIN = '29ABCDE1234F1Z5'; // Replace with actual registered GSTIN

console.log('🧪 Testing CompliBot API Endpoints...\n');

async function testHealthEndpoint() {
    try {
        console.log('1. Testing Health Endpoint...');
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        
        if (data.success) {
            console.log('   ✅ Health check passed');
            console.log(`   📊 Bot connected: ${data.bot_connected}`);
        } else {
            console.log('   ❌ Health check failed');
        }
    } catch (error) {
        console.log('   ❌ Health endpoint error:', error.message);
    }
}

async function testOTPEndpoint() {
    try {
        console.log('\n2. Testing OTP Request Endpoint...');
        const response = await fetch(`${API_BASE}/api/auth/otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gstin: TEST_GSTIN })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('   ✅ OTP request successful');
            console.log(`   📱 Message: ${data.message}`);
            return true;
        } else {
            console.log('   ❌ OTP request failed');
            console.log(`   📱 Error: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.log('   ❌ OTP endpoint error:', error.message);
        return false;
    }
}

async function testVerifyEndpoint() {
    try {
        console.log('\n3. Testing OTP Verification Endpoint...');
        console.log('   ⚠️  Note: This will fail without a valid OTP from Telegram');
        
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                gstin: TEST_GSTIN,
                otp: '123456' // This will fail, but tests the endpoint
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('   ✅ OTP verification successful');
            console.log(`   👤 User: ${data.user.trade_name}`);
        } else {
            console.log('   ❌ OTP verification failed (expected with dummy OTP)');
            console.log(`   📱 Error: ${data.message}`);
        }
    } catch (error) {
        console.log('   ❌ Verify endpoint error:', error.message);
    }
}

async function runTests() {
    console.log(`🎯 Testing API at: ${API_BASE}`);
    console.log(`📋 Using test GSTIN: ${TEST_GSTIN}\n`);
    
    await testHealthEndpoint();
    const otpSent = await testOTPEndpoint();
    await testVerifyEndpoint();
    
    console.log('\n🏁 API Testing Complete!');
    
    if (otpSent) {
        console.log('\n💡 Next Steps:');
        console.log('   1. Check your Telegram for the OTP message');
        console.log('   2. Test the frontend login with the received OTP');
        console.log('   3. Verify the dashboard loads correctly');
    } else {
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure the backend server is running (npm run dev)');
        console.log('   2. Ensure the user is registered via Telegram bot');
        console.log('   3. Check that the GSTIN exists in the database');
        console.log('   4. Verify the Telegram bot is online');
    }
}

// Run the tests
runTests().catch(console.error);