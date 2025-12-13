const express = require("express");
const cors = require("cors");
const { getUser } = require("./db/index");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Fallback OTP implementation (since the ES module might not work in CommonJS)
const otpStore = new Map();

const otpHelper = {
    validateGSTIN: (gstin) => {
        if (!gstin || typeof gstin !== 'string') return false;
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin);
    },
    generateOTP: (gstin) => {
        if (!otpHelper.validateGSTIN(gstin)) {
            throw new Error('Invalid GSTIN format');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
        otpStore.set(gstin, { code: otp, expires });
        console.log(`🔐 OTP generated for ${gstin}: ${otp} (expires in 5 minutes)`);
        return otp;
    },
    verifyOTP: (gstin, inputOtp) => {
        const record = otpStore.get(gstin);
        if (!record) {
            console.log(`❌ No OTP record found for ${gstin}`);
            return false;
        }
        if (Date.now() > record.expires) {
            console.log(`❌ OTP expired for ${gstin}`);
            otpStore.delete(gstin);
            return false;
        }
        if (record.code === inputOtp.toString()) {
            console.log(`✅ OTP verified successfully for ${gstin}`);
            otpStore.delete(gstin);
            return true;
        }
        console.log(`❌ OTP mismatch for ${gstin}`);
        return false;
    }
};

// Helper function to get state name from code
function getStateName(stateCode) {
    const stateNames = {
        '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
        '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
        '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
        '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
        '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
        '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
        '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra',
        '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
        '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
        '36': 'Telangana', '37': 'Andhra Pradesh (New)', '38': 'Ladakh'
    };
    return stateNames[stateCode] || 'Unknown';
}

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        message: "CompliBot Dashboard API",
        version: "1.0.0",
        endpoints: [
            "POST /api/auth/otp - Send OTP for GSTIN",
            "POST /api/auth/verify - Verify OTP and get user data"
        ]
    });
});

// Send OTP endpoint
app.post("/api/auth/otp", async (req, res) => {
    try {
        const { gstin } = req.body;

        if (!gstin) {
            return res.status(400).json({
                success: false,
                message: "GSTIN is required"
            });
        }

        // Validate GSTIN format
        if (!otpHelper.validateGSTIN(gstin)) {
            return res.status(400).json({
                success: false,
                message: "Invalid GSTIN format"
            });
        }

        // Generate OTP
        const otp = otpHelper.generateOTP(gstin);

        // In a real implementation, you would send SMS here
        console.log(`📱 OTP for ${gstin}: ${otp} (This would be sent via SMS)`);

        res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("OTP generation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
});

// Verify OTP endpoint
app.post("/api/auth/verify", async (req, res) => {
    try {
        const { gstin, otp } = req.body;

        if (!gstin || !otp) {
            return res.status(400).json({
                success: false,
                message: "GSTIN and OTP are required"
            });
        }

        // Verify OTP
        const isValid = otpHelper.verifyOTP(gstin, otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Create user data based on GSTIN
        let userData = {
            gstin: gstin,
            trade_name: "Sample Business",
            legal_name: "Business Owner",
            business_type: "Retail",
            registration_date: "2020-01-15",
            state: "Delhi",
            status: "Active"
        };

        // Try to get actual user data from database if available
        try {
            // Look up user by GSTIN in the database
            const result = await require("./db/index").db.execute({
                sql: 'SELECT * FROM users WHERE gstin = ?',
                args: [gstin]
            });

            if (result.rows && result.rows.length > 0) {
                const dbUser = result.rows[0];
                userData = {
                    gstin: dbUser.gstin,
                    trade_name: dbUser.trade_name,
                    legal_name: dbUser.legal_name || dbUser.trade_name,
                    business_type: "Retail",
                    registration_date: dbUser.registration_date || "2020-01-15",
                    state: dbUser.state_code ? getStateName(dbUser.state_code) : "Delhi",
                    status: "Active"
                };
            } else {
                // Create sample data based on GSTIN state code
                const stateCode = gstin.substring(0, 2);
                const stateName = getStateName(stateCode);
                userData.state = stateName;
                userData.trade_name = `Business in ${stateName}`;
            }
        } catch (dbError) {
            console.log("Database lookup failed, using mock data:", dbError.message);
            // Use state from GSTIN
            const stateCode = gstin.substring(0, 2);
            const stateName = getStateName(stateCode);
            userData.state = stateName;
            userData.trade_name = `Business in ${stateName}`;
        }

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({
            success: false,
            message: "Verification failed"
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error("Unhandled Error:", error);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CompliBot Dashboard API running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   POST /api/auth/otp - Send OTP for GSTIN`);
    console.log(`   POST /api/auth/verify - Verify OTP and get user data`);
    console.log(`\n💡 Ready to authenticate dashboard users!`);
});

module.exports = app;