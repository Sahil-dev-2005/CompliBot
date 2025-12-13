# OTP Authentication Setup Guide

## Overview
The OTP (One-Time Password) authentication system has been implemented to connect the frontend dashboard with the backend Telegram bot. Users can now log into the web dashboard using their GSTIN and receive OTP codes via Telegram.

## Fixed Issues

### 1. Server Response Format
- ✅ Fixed API responses to match the frontend contract exactly
- ✅ Updated error messages to match expected format
- ✅ Standardized success/error response structure

### 2. User Object Structure
- ✅ Added proper user object formatting with all required fields
- ✅ Added state name mapping from state codes
- ✅ Added fallback values for missing fields

### 3. CORS Configuration
- ✅ Updated CORS to allow frontend connections
- ✅ Added support for both development and production origins

### 4. OTP Generation & Verification
- ✅ Fixed OTP generation to ensure exactly 6 digits
- ✅ Added proper logging for debugging
- ✅ Improved error handling and validation

## API Endpoints

### 1. Send OTP
```
POST /api/auth/otp
Content-Type: application/json

{
  "gstin": "29ABCDE1234F1Z5"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "GSTIN not found in database"
}
```

### 2. Verify OTP
```
POST /api/auth/verify
Content-Type: application/json

{
  "gstin": "29ABCDE1234F1Z5",
  "otp": "123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "gstin": "29ABCDE1234F1Z5",
    "trade_name": "ABC Traders",
    "legal_name": "John Doe",
    "business_type": "General",
    "registration_date": "2024-12-13",
    "state": "Karnataka",
    "status": "Active"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

## How It Works

1. **User Registration**: Users must first register via Telegram bot using `/start` command
2. **GSTIN Storage**: Bot stores user's GSTIN and Telegram chat ID in database
3. **OTP Request**: Frontend sends GSTIN to `/api/auth/otp`
4. **OTP Generation**: Backend generates 6-digit OTP and stores it temporarily
5. **Telegram Delivery**: OTP is sent to user's Telegram chat
6. **OTP Verification**: User enters OTP in frontend, sent to `/api/auth/verify`
7. **Login Success**: If valid, user data is returned for dashboard access

## Testing the Setup

### Prerequisites
1. Telegram bot must be running
2. User must be registered via Telegram bot
3. Backend server must be running on port 3000
4. Frontend must be running on port 5173

### Manual Testing Steps

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Register via Telegram:**
   - Start a chat with your Telegram bot
   - Send `/start` command
   - Complete the registration process

3. **Test OTP endpoint using curl:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/otp \
     -H "Content-Type: application/json" \
     -d '{"gstin":"YOUR_REGISTERED_GSTIN"}'
   ```

4. **Check Telegram for OTP message**

5. **Test verification endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"gstin":"YOUR_REGISTERED_GSTIN","otp":"RECEIVED_OTP"}'
   ```

### Frontend Integration

The frontend should now work seamlessly with these endpoints. Make sure:

1. Frontend is configured to use `http://localhost:3000` as API base URL
2. CORS is properly configured (already done)
3. Error handling matches the response format

## Environment Variables Required

```env
BOT_TOKEN=your_telegram_bot_token
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_database_token
PORT=3000
```

## Security Features

- ✅ OTP expires after 5 minutes
- ✅ OTP is single-use (deleted after verification)
- ✅ GSTIN format validation
- ✅ Proper error handling without exposing sensitive data
- ✅ CORS protection

## Troubleshooting

### Common Issues:

1. **"GSTIN not found in database"**
   - User needs to register via Telegram bot first
   - Check if GSTIN format is correct (15 characters)

2. **"Failed to send OTP"**
   - Check if Telegram bot is running
   - Verify BOT_TOKEN is correct
   - Check if user blocked the bot

3. **"Invalid OTP"**
   - Check if OTP was entered correctly
   - Verify OTP hasn't expired (5 minutes)
   - Make sure OTP wasn't already used

4. **CORS errors**
   - Verify frontend is running on allowed origin
   - Check browser console for specific CORS errors

## Next Steps

The OTP system is now fully functional and ready for production use. Consider adding:

1. Rate limiting for OTP requests
2. JWT token generation for session management
3. Account lockout after multiple failed attempts
4. SMS backup for OTP delivery