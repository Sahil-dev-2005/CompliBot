const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testDashboardAPI() {
    console.log('🧪 Testing CompliBot Dashboard API...\n');

    try {
        // Test 1: Health check
        console.log('1. Testing health check endpoint...');
        const healthResponse = await axios.get(`${API_BASE_URL}/`);
        console.log('✅ Health check passed:', healthResponse.data.message);
        console.log('   Available endpoints:', healthResponse.data.endpoints);
        console.log('');

        // Test 2: Send OTP with valid GSTIN
        console.log('2. Testing OTP generation with valid GSTIN...');
        const testGSTIN = '07ABCDE1234F1Z5';

        const otpResponse = await axios.post(`${API_BASE_URL}/api/auth/otp`, {
            gstin: testGSTIN
        });

        if (otpResponse.data.success) {
            console.log('✅ OTP generation successful');
            console.log('   Message:', otpResponse.data.message);
        } else {
            console.log('❌ OTP generation failed:', otpResponse.data.message);
        }
        console.log('');

        // Test 3: Send OTP with invalid GSTIN
        console.log('3. Testing OTP generation with invalid GSTIN...');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/otp`, {
                gstin: 'INVALID'
            });
            console.log('❌ Should have failed with invalid GSTIN');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected invalid GSTIN');
                console.log('   Error:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log('');

        // Test 4: Verify OTP (this will fail since we don't know the actual OTP)
        console.log('4. Testing OTP verification with dummy OTP...');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/verify`, {
                gstin: testGSTIN,
                otp: '123456'
            });
            console.log('❌ Should have failed with dummy OTP');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected invalid OTP');
                console.log('   Error:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log('');

        // Test 5: Missing parameters
        console.log('5. Testing missing parameters...');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/otp`, {});
            console.log('❌ Should have failed with missing GSTIN');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected missing GSTIN');
                console.log('   Error:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n🎉 All API tests completed!');
        console.log('\n💡 To test the full flow:');
        console.log('1. Start the dashboard server: npm run dashboard');
        console.log('2. Start the frontend: cd new_complibot_dashbaord && npm run dev');
        console.log('3. Open http://localhost:5173');
        console.log('4. Use GSTIN: 07ABCDE1234F1Z5');
        console.log('5. Check console for the generated OTP');

    } catch (error) {
        console.error('❌ API test failed:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the dashboard server is running:');
            console.log('   cd CompliBot && npm run dashboard');
        }
    }
}

// Run the test
testDashboardAPI();