/**
 * CompliBot Test Suite
 * Tests all major functionality
 */

const { validateGSTIN, getStateCodeFromGSTIN } = require('./src/modules/gstHelper');
const { calculatePenaltyWithAI, generateGSTResponse } = require('./src/modules/aiHelper');

console.log('\n🧪 CompliBot Test Suite\n');
console.log('═'.repeat(60));

// Test counters
let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ ${testName}`);
        passed++;
    } else {
        console.log(`❌ ${testName}`);
        failed++;
    }
}

// ========================
// TEST 1: GST Helper
// ========================
console.log('\n📋 Testing GST Helper Module...\n');

// Valid GSTIN
assert(
    validateGSTIN('29AAACH7409R1Z2'),
    'Valid GSTIN validation'
);

// Invalid GSTIN - wrong length
assert(
    !validateGSTIN('29AAACH'),
    'Invalid GSTIN (short) rejected'
);

// Invalid GSTIN - wrong format
assert(
    !validateGSTIN('INVALIDGSTIN123'),
    'Invalid GSTIN (format) rejected'
);

// State code extraction
assert(
    getStateCodeFromGSTIN('29AAACH7409R1Z2') === '29',
    'State code extraction from GSTIN'
);

assert(
    getStateCodeFromGSTIN('07AAACH7409R1Z2') === '07',
    'State code extraction (Delhi)'
);

// ========================
// TEST 2: Penalty Calculation
// ========================
console.log('\n💰 Testing Penalty Calculation...\n');

async function testPenalty() {
    try {
        // Test GSTR-3B penalty
        const penalty = await calculatePenaltyWithAI(10, 50000, 'GSTR-3B');
        
        assert(
            penalty.lateFee === 1000,
            'GSTR-3B late fee calculation (₹100/day × 10 days)'
        );

        assert(
            penalty.interest > 0,
            'Interest calculation (18% p.a.)'
        );

        assert(
            penalty.totalPenalty > penalty.lateFee,
            'Total penalty includes interest'
        );

        assert(
            penalty.explanation && penalty.explanation.length > 0,
            'AI explanation generated'
        );

        console.log(`   Late Fee: ₹${penalty.lateFee}`);
        console.log(`   Interest: ₹${penalty.interest}`);
        console.log(`   Total: ₹${penalty.totalPenalty}`);

    } catch (error) {
        console.log(`❌ Penalty calculation failed: ${error.message}`);
        failed++;
    }
}

// ========================
// TEST 3: AI Chat
// ========================
console.log('\n🤖 Testing AI Chat Module...\n');

async function testAIChat() {
    try {
        const response = await generateGSTResponse(
            'What is GST?',
            {},
            'en'
        );

        assert(
            response && response.length > 0,
            'AI generates response to GST query'
        );

        assert(
            response.toLowerCase().includes('tax') || response.toLowerCase().includes('gst'),
            'AI response contains relevant keywords'
        );

        console.log(`   Sample response: "${response.substring(0, 100)}..."`);

    } catch (error) {
        console.log(`❌ AI chat failed: ${error.message}`);
        console.log(`   Note: Check GOOGLE_AI_API_KEY in .env`);
        failed++;
    }
}

// ========================
// TEST 4: Environment Configuration
// ========================
console.log('\n🔧 Testing Environment Configuration...\n');

const config = require('./src/config/env');

assert(
    config.googleAI.apiKey && config.googleAI.apiKey.length > 0,
    'Google AI API key configured'
);

assert(
    config.database.url && config.database.url.includes('turso'),
    'Turso database URL configured'
);

assert(
    config.database.authToken && config.database.authToken.length > 0,
    'Turso auth token configured'
);

assert(
    config.telegram.botToken && config.telegram.botToken.length > 0,
    'Telegram bot token configured'
);

assert(
    config.server.port === 8080,
    'Server port configured (8080)'
);

// ========================
// TEST 5: Database Connection
// ========================
console.log('\n💾 Testing Database Connection...\n');

async function testDatabase() {
    try {
        const { initDB, getUser } = require('./src/db/index');
        
        // Initialize database
        await initDB();
        assert(true, 'Database initialization successful');

        // Try to query (will return null if no user exists)
        const user = await getUser(999999999);
        assert(
            user === null || (user && user.user_id),
            'Database query executed'
        );

    } catch (error) {
        console.log(`❌ Database test failed: ${error.message}`);
        failed++;
    }
}

// ========================
// RUN ALL TESTS
// ========================

async function runAllTests() {
    // Synchronous tests run first
    await testPenalty();
    await testAIChat();
    await testDatabase();

    // Print results
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Test Results:\n');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total: ${passed + failed}`);
    console.log(`   🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('\n' + '═'.repeat(60) + '\n');

    if (failed === 0) {
        console.log('🎉 All tests passed! System is ready.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please check configuration.\n');
        process.exit(1);
    }
}

runAllTests();
