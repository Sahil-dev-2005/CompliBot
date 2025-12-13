# API Contract Documentation

This document describes the expected API endpoints and data formats for the Complibot Dashboard backend.

## Base URL

```
http://localhost:3000
```

## Endpoints

### 1. Send OTP

Sends a one-time password to the registered contact for the given GSTIN.

**Endpoint**: `POST /api/auth/otp`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "gstin": "07ABCDE1234F1Z5"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "GSTIN not found in database"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "message": "Failed to send OTP"
}
```

---

### 2. Verify OTP

Verifies the OTP and returns user information if valid.

**Endpoint**: `POST /api/auth/verify`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "gstin": "07ABCDE1234F1Z5",
  "otp": "123456"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "gstin": "07ABCDE1234F1Z5",
    "trade_name": "ABC Traders",
    "legal_name": "John Doe",
    "business_type": "Retail",
    "registration_date": "2020-01-15",
    "state": "Delhi",
    "status": "Active"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "OTP expired"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "message": "Verification failed"
}
```

---

## User Object Schema

The `user` object returned after successful OTP verification should contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gstin` | string | Yes | 15-character GSTIN |
| `trade_name` | string | Yes | Business/shop name |
| `legal_name` | string | Yes | Owner's legal name |
| `business_type` | string | No | Type of business |
| `registration_date` | string | No | GST registration date (ISO format) |
| `state` | string | No | State of registration |
| `status` | string | No | Registration status |

**Minimum Required Fields**:
```json
{
  "gstin": "07ABCDE1234F1Z5",
  "trade_name": "ABC Traders",
  "legal_name": "John Doe"
}
```

---

## GSTIN Format

Valid GSTIN format: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`

**Structure**:
- Positions 1-2: State Code (numeric)
- Positions 3-7: PAN (5 uppercase letters)
- Positions 8-11: Entity Number (4 digits)
- Position 12: Entity Type (1 uppercase letter)
- Position 13: Default 'Z'
- Position 14: Checksum (alphanumeric)
- Position 15: Additional digit (alphanumeric)

**Example**: `07ABCDE1234F1Z5`

---

## OTP Format

- Length: Exactly 6 digits
- Type: Numeric only
- Pattern: `^[0-9]{6}$`
- Validity: Typically 5-10 minutes

**Example**: `123456`

---

## Error Handling

### Network Errors

If the backend is unreachable, the frontend will display:
```
"Server unreachable. Check if backend is running."
```

### CORS Configuration

The backend must allow requests from the frontend origin:

```javascript
// Example CORS configuration (Express.js)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## Security Considerations

1. **OTP Expiry**: OTPs should expire after 5-10 minutes
2. **Rate Limiting**: Implement rate limiting on OTP endpoints
3. **Attempt Limits**: Lock account after 3-5 failed OTP attempts
4. **HTTPS**: Use HTTPS in production
5. **Input Validation**: Validate GSTIN format on backend
6. **SQL Injection**: Use parameterized queries
7. **Session Management**: Consider JWT tokens for production

---

## Testing Endpoints

### Using cURL

**Send OTP**:
```bash
curl -X POST http://localhost:3000/api/auth/otp \
  -H "Content-Type: application/json" \
  -d '{"gstin":"07ABCDE1234F1Z5"}'
```

**Verify OTP**:
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"gstin":"07ABCDE1234F1Z5","otp":"123456"}'
```

### Using Postman

1. Create a new POST request
2. Set URL to `http://localhost:3000/api/auth/otp`
3. Set Headers: `Content-Type: application/json`
4. Set Body (raw JSON):
```json
{
  "gstin": "07ABCDE1234F1Z5"
}
```
5. Send request

---

## Sample Backend Implementation (Express.js)

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage (use database in production)
const otpStore = new Map();
const users = {
  '07ABCDE1234F1Z5': {
    gstin: '07ABCDE1234F1Z5',
    trade_name: 'ABC Traders',
    legal_name: 'John Doe'
  }
};

// Send OTP
app.post('/api/auth/otp', (req, res) => {
  const { gstin } = req.body;
  
  if (!users[gstin]) {
    return res.status(400).json({
      success: false,
      message: 'GSTIN not found in database'
    });
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with expiry (5 minutes)
  otpStore.set(gstin, {
    otp,
    expiry: Date.now() + 5 * 60 * 1000
  });
  
  console.log(`OTP for ${gstin}: ${otp}`);
  
  res.json({
    success: true,
    message: 'OTP sent successfully'
  });
});

// Verify OTP
app.post('/api/auth/verify', (req, res) => {
  const { gstin, otp } = req.body;
  
  const stored = otpStore.get(gstin);
  
  if (!stored) {
    return res.status(400).json({
      success: false,
      message: 'No OTP found for this GSTIN'
    });
  }
  
  if (Date.now() > stored.expiry) {
    otpStore.delete(gstin);
    return res.status(400).json({
      success: false,
      message: 'OTP expired'
    });
  }
  
  if (stored.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP'
    });
  }
  
  // OTP is valid
  otpStore.delete(gstin);
  
  res.json({
    success: true,
    user: users[gstin]
  });
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
```

---

## Frontend Configuration

The frontend reads the API URL from:

1. Environment variable: `VITE_API_URL`
2. Default fallback: `http://localhost:3000`

To change the API URL, create a `.env` file:
```env
VITE_API_URL=http://your-backend-url:port
```

---

## Integration Checklist

- [ ] Backend implements `/api/auth/otp` endpoint
- [ ] Backend implements `/api/auth/verify` endpoint
- [ ] CORS is configured correctly
- [ ] User object contains required fields (gstin, trade_name, legal_name)
- [ ] OTP generation works
- [ ] OTP validation works
- [ ] Error responses follow the contract
- [ ] Success responses follow the contract
- [ ] Backend is running on port 3000 (or configured port)
- [ ] Frontend can connect to backend
- [ ] Test with valid GSTIN
- [ ] Test with invalid GSTIN
- [ ] Test with valid OTP
- [ ] Test with invalid OTP
- [ ] Test with expired OTP
