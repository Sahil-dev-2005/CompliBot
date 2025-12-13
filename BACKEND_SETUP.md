# CompliBot Backend Setup

## Overview
This document describes the backend server startup and bot integration fixes implemented for the OTP authentication system.

## Fixed Issues

### 1. Server Startup
- ✅ Added proper startup scripts to `package.json`
- ✅ Improved error handling in `src/index.js`
- ✅ Added graceful shutdown handling
- ✅ Added startup logging and status messages

### 2. Bot Integration
- ✅ Fixed unused import in `src/bot.js` (removed unused `Scenes` import)
- ✅ Added proper error handling for bot commands
- ✅ Added logging for bot initialization and user interactions
- ✅ Added `/status` command for debugging user registration

### 3. API Improvements
- ✅ Enhanced error handling in all API endpoints
- ✅ Added comprehensive logging for debugging
- ✅ Added health check endpoint (`/api/health`)
- ✅ Improved response consistency

### 4. Database Integration
- ✅ Added error handling to all database functions
- ✅ Improved database initialization with proper error handling
- ✅ Added logging for database operations

## How to Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Valid `.env` file with required credentials

### Environment Variables Required
```
BOT_TOKEN=your_telegram_bot_token
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_database_auth_token
PORT=3000
```

### Starting the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify setup (optional):**
   ```bash
   node verify-setup.js
   ```

3. **Start in production mode:**
   ```bash
   npm start
   ```

4. **Start in development mode (with auto-restart):**
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/auth/otp` - Generate and send OTP
- `POST /api/auth/verify` - Verify OTP and authenticate
- `GET /api/dashboard/:gstin` - Get dashboard data

## Bot Commands

- `/start` - Start registration or welcome back existing users
- `/status` - Check registration status
- `/reset` - Debug command for testing

## Verification

The server should start with output similar to:
```
🤖 Telegram bot initialized with token: 8570292229...
🤖 Starting Telegram Bot...
✅ Telegram Bot connected successfully
🌐 Starting Express server on port 3000...
🚀 CompliBot is online... (Web Dashboard on Port 3000)
📊 Dashboard API available at http://localhost:3000
```

## Troubleshooting

1. **Bot Token Issues**: Verify `BOT_TOKEN` in `.env` file
2. **Database Connection**: Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
3. **Port Conflicts**: Change `PORT` in `.env` if 3000 is occupied
4. **Import Errors**: Ensure all dependencies are installed with `npm install`

## Requirements Addressed

This implementation addresses the following requirements:
- **1.3**: Telegram bot delivers OTP codes to registered users
- **1.5**: Backend API returns appropriate error messages for delivery failures