import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateOTP, verifyOTP, validateGSTIN } from './modules/otpHelper.js';
import { getUser, addUser, updateUser } from './db/index.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================
// MIDDLEWARE
// ===========================

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Local production
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL   // Production URL if set
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================
// API ROUTES - AUTHENTICATION
// ===========================

/**
 * POST /api/auth/otp
 * Sends OTP to user's phone via SMS
 * Body: { gstin: string }
 */
app.post('/api/auth/otp', async (req, res) => {
  try {
    const { gstin } = req.body;

    // Validate input
    if (!gstin) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }

    // Validate GSTIN format
    if (!validateGSTIN(gstin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format. Please enter a valid 15-digit GSTIN.'
      });
    }

    // Check if user exists (optional - can create user on first OTP)
    let user = getUser(gstin);

    if (!user) {
      // Create user if doesn't exist
      try {
        user = await addUser({
          gstin: gstin,
          trade_name: 'Pending', // Will be updated during registration
          state_code: gstin.substring(0, 2),
          language: 'en'
        });
      } catch (err) {
        console.error('Error creating user:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to register user'
        });
      }
    }

    // Generate OTP
    try {
      const otp = generateOTP(gstin);
      
      // TODO: Integrate with actual SMS provider
      // For now, we'll log the OTP (development only)
      console.log(`📱 OTP for ${gstin}: ${otp}`);
      
      // In production, send via SMS:
      // await smsProvider.send({
      //   to: user.phone,
      //   message: `Your CompliBot OTP is: ${otp}. Valid for 5 minutes.`
      // });

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        // For development only - remove in production
        debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
      });
    } catch (err) {
      console.error('OTP generation error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to generate OTP'
      });
    }
  } catch (error) {
    console.error('OTP Route Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verifies OTP entered by user
 * Body: { gstin: string, otp: string }
 */
app.post('/api/auth/verify', (req, res) => {
  try {
    const { gstin, otp } = req.body;

    // Validate input
    if (!gstin || !otp) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN and OTP are required'
      });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number'
      });
    }

    // Verify OTP
    const isValid = verifyOTP(gstin, otp);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Get user details
    const user = getUser(gstin);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // OTP verified successfully
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        gstin: user.gstin,
        trade_name: user.trade_name,
        state_code: user.state_code,
        language: user.language || 'en'
      }
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

// ===========================
// API ROUTES - USER DATA
// ===========================

/**
 * GET /api/user/:gstin
 * Fetch user details
 */
app.get('/api/user/:gstin', (req, res) => {
  try {
    const { gstin } = req.params;

    const user = getUser(gstin);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        gstin: user.gstin,
        trade_name: user.trade_name,
        state_code: user.state_code,
        language: user.language || 'en'
      }
    });
  } catch (error) {
    console.error('Get User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

/**
 * PUT /api/user/:gstin
 * Update user details
 */
app.put('/api/user/:gstin', (req, res) => {
  try {
    const { gstin } = req.params;
    const { trade_name, language } = req.body;

    const updates = {};
    if (trade_name) updates.trade_name = trade_name;
    if (language) updates.language = language;

    const user = updateUser(gstin, updates);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

// ===========================
// STATIC FILE SERVING
// ===========================

// Serve static files from the dashboard build directory
const dashboardPath = path.join(__dirname, '../new_complibot_dashbaord-main/new_complibot_dashbaord-main/dist');
app.use(express.static(dashboardPath));

// SPA Fallback - Serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'), (err) => {
    if (err) {
      // If dist doesn't exist, provide helpful message
      return res.status(404).json({
        success: false,
        message: 'Dashboard not built. Run: npm run build in the dashboard folder'
      });
    }
  });
});

// ===========================
// ERROR HANDLING
// ===========================

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===========================
// SERVER START
// ===========================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     CompliBot Server Started! 🚀      ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                            
║  Mode: ${process.env.NODE_ENV || 'development'}
║  API: http://localhost:${PORT}/api       
║  Dashboard: http://localhost:${PORT}     
║  Frontend (Dev): http://localhost:5173  
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⛔ Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;