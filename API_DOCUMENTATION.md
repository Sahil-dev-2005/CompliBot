# GST Compliance Bot - Backend API Documentation

## 🚀 Overview

This is the complete backend REST API for the GST Compliance Bot. The bot team can integrate with these endpoints to provide compliance tracking, penalty calculation, ITC validation, and automated notifications.

## 📋 Table of Contents

- [Setup](#setup)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
  - [User Management](#user-management)
  - [Filing Management](#filing-management)
  - [Notifications](#notifications)
  - [Penalty Calculation](#penalty-calculation)
  - [ITC Validation](#itc-validation)
  - [Analytics](#analytics)
- [Integration Guide](#integration-guide)

---

## 🛠️ Setup

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Initialize database
npm run init-db

# Start server
npm start

# Development mode (auto-reload)
npm run dev
```

The server will start on `http://localhost:3000`

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "ok",
  "database": "connected",
  "stats": {
    "users": 150,
    "filings": 450,
    "penalties": 25
  }
}
```

---

## 🏗️ Architecture

```
src/backend/
├── db/
│   ├── schema.sql          # Database schema
│   ├── index.js            # DB connection
│   └── queries.js          # CRUD operations
├── services/
│   ├── penaltyCalculator.js    # Penalty logic
│   ├── itcValidator.js         # ITC validation
│   ├── notificationEngine.js   # Alert system
│   ├── deadlineTracker.js      # Filing tracking
│   └── cronJobs.js             # Scheduled tasks
├── routes/
│   ├── users.js            # User endpoints
│   ├── filings.js          # Filing endpoints
│   ├── notifications.js    # Notification endpoints
│   ├── penalties.js        # Penalty endpoints
│   ├── itc.js              # ITC endpoints
│   └── analytics.js        # Analytics endpoints
└── server.js               # Main entry point
```

### Automated Jobs (Cron)

- **Daily Notifications** - 9:00 AM IST (Sends GREEN/YELLOW/RED alerts)
- **Overdue Check** - Every 6 hours (Updates overdue filings)
- **Next Month Filings** - 1st day of month, 2:00 AM (Generates new filings)
- **Database Cleanup** - Sunday, 3:00 AM (Cleans old records)

---

## 📡 API Endpoints

All endpoints return JSON in this format:

```json
{
  "success": true,
  "data": {
    /* result */
  },
  "message": "Optional message"
}
```

Error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 👤 User Management

### Create User

```http
POST /api/users
```

**Body:**

```json
{
  "chat_id": "123456789",
  "gstin": "27AABCU9603R1ZM",
  "business_name": "ABC Traders",
  "state": "MAHARASHTRA",
  "filing_scheme": "MONTHLY",
  "annual_turnover": 5000000,
  "phone_number": "+919876543210"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created and deadlines initialized"
}
```

**Notes:**

- Automatically determines e-invoice requirement (turnover >= 1 crore)
- Initializes 3 months of compliance deadlines
- Creates audit log entry

---

### Get User Details

```http
GET /api/users/:chatId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "chat_id": "123456789",
      "gstin": "27AABCU9603R1ZM",
      "business_name": "ABC Traders",
      "state": "MAHARASHTRA",
      "filing_scheme": "MONTHLY",
      "annual_turnover": 5000000,
      "requires_einvoice": 1,
      "is_active": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "compliance": {
      "filings_completed": 8,
      "filings_pending": 2,
      "overdue_filings": 1,
      "total_penalties": 500
    }
  }
}
```

---

### Update User

```http
PUT /api/users/:chatId
```

**Body:** (all fields optional)

```json
{
  "business_name": "New Business Name",
  "phone_number": "+919876543210",
  "annual_turnover": 6000000
}
```

---

### Deactivate User

```http
DELETE /api/users/:chatId
```

**Response:**

```json
{
  "success": true,
  "message": "User deactivated"
}
```

---

### Get All Users

```http
GET /api/users
```

**Response:**

```json
{
  "success": true,
  "count": 150,
  "data": [
    /* array of users */
  ]
}
```

---

### Get Compliance Status

```http
GET /api/users/:chatId/compliance
```

**Response:**

```json
{
  "success": true,
  "data": {
    "chat_id": "123456789",
    "filings_completed": 8,
    "filings_pending": 2,
    "overdue_filings": 1,
    "total_penalties": 500,
    "compliance_rate": "80.00%"
  }
}
```

---

## 📄 Filing Management

### Get User Filings

```http
GET /api/filings/:chatId?status=pending&limit=50
```

**Query Parameters:**

- `status` - Filter by status: `pending`, `overdue`, `upcoming`
- `days` - For upcoming filings, days ahead (default: 30)
- `limit` - Max results (default: 50)

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "chat_id": "123456789",
      "filing_type": "GSTR-1",
      "period": "2024-01",
      "due_date": "2024-02-11",
      "status": "PENDING",
      "tax_amount": null,
      "filed_date": null
    }
  ]
}
```

---

### Get Specific Filing

```http
GET /api/filings/:chatId/:filingId
```

---

### Mark Filing as Filed

```http
POST /api/filings/:chatId/mark-filed
```

**Body:**

```json
{
  "filing_id": 123,
  "acknowledgment": "ARN12345678901234"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Filing marked as completed"
}
```

---

### Update Tax Amount

```http
PUT /api/filings/:chatId/:filingId/tax-amount
```

**Body:**

```json
{
  "tax_amount": 25000
}
```

---

### Get All Overdue Filings (Admin)

```http
GET /api/filings/admin/overdue
```

---

## 🔔 Notifications

### Get Pending Notifications

```http
GET /api/notifications/pending?limit=100
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "chat_id": "123456789",
      "filing_id": 123,
      "alert_type": "YELLOW_URGENT",
      "message": "⚠️ URGENT: 5 days left to file GSTR-1 for Jan 2024!",
      "scheduled_at": "2024-02-06T09:00:00.000Z",
      "telegram_sent": 0,
      "sms_sent": 0
    }
  ]
}
```

**Notes:**

- Bot should poll this endpoint or implement webhook
- After sending notification, mark as sent using endpoints below

---

### Get User Notification History

```http
GET /api/notifications/:chatId?type=RED&limit=50
```

**Query Parameters:**

- `type` - Filter by alert type: `GREEN`, `YELLOW`, `YELLOW_URGENT`, `RED`, `RED_FINAL`, `OVERDUE`
- `limit` - Max results (default: 50)

---

### Mark Notification as Sent

```http
POST /api/notifications/:notificationId/sent
```

**Body:**

```json
{
  "channel": "telegram"
}
```

**Notes:**

- `channel` must be either `telegram` or `sms`

---

### Mark Notification as Failed

```http
POST /api/notifications/:notificationId/failed
```

**Body:**

```json
{
  "channel": "telegram",
  "error": "User blocked bot"
}
```

---

## 💰 Penalty Calculation

### Calculate Penalty

```http
POST /api/penalties/calculate
```

**Body:**

```json
{
  "filing_type": "GSTR-1",
  "due_date": "2024-02-11",
  "filed_date": "2024-02-20",
  "tax_amount": 10000
}
```

**OR:**

```json
{
  "filing_type": "GSTR-3B",
  "days_late": 15,
  "tax_amount": 25000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "days_late": 9,
    "late_fee": 900,
    "interest": 61.64,
    "total_penalty": 961.64,
    "breakdown": {
      "late_filing_penalty": "₹100 × 9 days = ₹900",
      "interest_calculation": "₹10,000 × 18% p.a. × 9 days = ₹61.64"
    }
  }
}
```

**Penalty Rules:**

- Late filing: ₹100/day (max ₹5,000 for returns, ₹25,000 for GSTR-9)
- Interest: 18% per annum on unpaid tax
- Calculated from day after due date

---

### Calculate Interest Only

```http
POST /api/penalties/calculate-interest
```

**Body:**

```json
{
  "tax_amount": 50000,
  "days_late": 30
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tax_amount": 50000,
    "days_late": 30,
    "interest": 739.73,
    "annual_rate": 0.18,
    "daily_rate": 0.00049315
  }
}
```

---

### Project Future Penalty

```http
POST /api/penalties/project
```

**Body:**

```json
{
  "filing_type": "GSTR-3B",
  "due_date": "2024-02-20",
  "target_date": "2024-03-10",
  "tax_amount": 15000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "days_late": 19,
    "projected_penalty": 2040.41,
    "cost_breakdown": [
      { "days": 5, "penalty": 561.64 },
      { "days": 10, "penalty": 1123.29 },
      { "days": 15, "penalty": 1684.93 },
      { "days": 19, "penalty": 2040.41 }
    ]
  }
}
```

---

### Calculate ITC Fraud Penalty

```http
POST /api/penalties/calculate-itc
```

**Body:**

```json
{
  "fraudulent_itc_amount": 100000,
  "months_elapsed": 6
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "fraudulent_itc": 100000,
    "base_penalty": 100000,
    "interest": 10800,
    "total_liability": 210800,
    "breakdown": {
      "penalty": "100% of ITC = ₹1,00,000",
      "interest": "24% p.a. × 6 months = ₹10,800"
    }
  }
}
```

---

### Get User Penalties

```http
GET /api/penalties/:chatId
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "total_amount": 1500,
  "data": [
    {
      "id": 1,
      "filing_id": 123,
      "penalty_type": "LATE_FILING",
      "penalty_amount": 900,
      "is_paid": 0,
      "created_at": "2024-02-20T10:00:00.000Z"
    }
  ]
}
```

---

### Get Filing Penalties

```http
GET /api/penalties/filing/:filingId
```

---

### Mark Penalty as Paid

```http
POST /api/penalties/:penaltyId/mark-paid
```

**Body:**

```json
{
  "payment_reference": "PMT123456789"
}
```

---

## 🧾 ITC Validation

### Validate ITC Claim

```http
POST /api/itc/validate
```

**Body:**

```json
{
  "chat_id": "123456789",
  "invoice_number": "INV2024001",
  "invoice_date": "2024-01-15",
  "item_description": "Laptop for office use",
  "itc_amount": 9000,
  "total_invoice_amount": 50000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reconciliation_id": 45,
    "isValid": true,
    "claimedITC": 9000,
    "allowedITC": 9000,
    "blockedITC": 0,
    "blockedCategory": null,
    "message": "✅ ITC claim is valid",
    "recommendations": []
  }
}
```

**Blocked Example:**

```json
{
  "isValid": false,
  "claimedITC": 5000,
  "allowedITC": 0,
  "blockedITC": 5000,
  "blockedCategory": "Food & Beverages",
  "blockage_percentage": 1,
  "message": "❌ ITC blocked: Food items (100% blocked)",
  "recommendations": [
    "Remove Food & Beverages ITC claim (₹5,000)",
    "Review invoice description for blocked items"
  ]
}
```

**Blocked Categories:**

- Food & Beverages: 100% blocked
- Fuel: 50% blocked
- Vehicle Repairs: 100% blocked
- Entertainment: 100% blocked
- Guest House/Accommodation: 50% blocked

---

### Bulk Validate ITC

```http
POST /api/itc/bulk-validate
```

**Body:**

```json
{
  "chat_id": "123456789",
  "claims": [
    {
      "invoice_number": "INV001",
      "item_description": "Office supplies",
      "itc_amount": 1000
    },
    {
      "invoice_number": "INV002",
      "item_description": "Petrol for company vehicle",
      "itc_amount": 5000
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "summary": {
    "total_claims": 2,
    "valid_claims": 1,
    "blocked_claims": 1,
    "total_claimed": 6000,
    "total_allowed": 3500,
    "total_blocked": 2500
  },
  "results": [
    /* individual validation results */
  ]
}
```

---

### Get ITC Reconciliation

```http
GET /api/itc/:chatId?status=BLOCKED&limit=50
```

**Query Parameters:**

- `status` - Filter: `VALID`, `BLOCKED`, `UNDER_REVIEW`, `CORRECTED`
- `limit` - Max results (default: 50)

---

### Update ITC Status

```http
PUT /api/itc/:reconciliationId/status
```

**Body:**

```json
{
  "status": "CORRECTED",
  "remarks": "Invoice corrected, ITC now valid"
}
```

---

### Get ITC Summary

```http
GET /api/itc/:chatId/summary
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_claims": 50,
    "valid_claims": 42,
    "blocked_claims": 8,
    "under_review": 0,
    "total_claimed": 500000,
    "total_allowed": 450000,
    "total_blocked": 50000
  }
}
```

---

## 📊 Analytics

### Dashboard Stats

```http
GET /api/analytics/dashboard
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "active_users": 145,
    "total_filings": 450,
    "pending_filings": 50,
    "overdue_filings": 10,
    "total_penalties": 25000
  }
}
```

---

### Compliance Rates

```http
GET /api/analytics/compliance-rates
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "compliant_users": 120,
    "at_risk_users": 20,
    "non_compliant_users": 10,
    "compliance_rate": "80.00%",
    "at_risk_rate": "13.33%",
    "non_compliance_rate": "6.67%"
  }
}
```

---

### Overdue Summary

```http
GET /api/analytics/overdue-summary
```

---

### Penalty Summary

```http
GET /api/analytics/penalty-summary
```

---

### Filing Trends

```http
GET /api/analytics/filing-trends
```

---

## 🤝 Integration Guide for Bot Team

### Step 1: User Onboarding

When user starts bot:

```javascript
// 1. Create user
POST /api/users
{
  "chat_id": ctx.from.id.toString(),
  "gstin": "...",
  "business_name": "...",
  // ... other fields
}
```

### Step 2: Show Pending Filings

```javascript
// Get upcoming deadlines
GET /api/filings/{chatId}?status=upcoming&days=30

// Show user with buttons: "Mark as Filed" or "Calculate Penalty"
```

### Step 3: Send Notifications

```javascript
// Bot polls every minute or implements webhook
GET /api/notifications/pending

// For each notification:
notifications.forEach(notif => {
  bot.telegram.sendMessage(notif.chat_id, notif.message)

  // Mark as sent
  POST /api/notifications/{notif.id}/sent
  { "channel": "telegram" }
})
```

### Step 4: Handle User Commands

**/filings** - Show all filings

```javascript
GET / api / filings / { chatId };
```

**/penalties** - Show penalty calculator

```javascript
POST / api / penalties / calculate;
// Show results with "Project Future Cost" button
```

**/itc_check** - Validate ITC claim

```javascript
// User provides invoice details
POST / api / itc / validate;
// Show validation result with blocked items
```

**/dashboard** - Show compliance status

```javascript
GET / api / users / { chatId } / compliance;
GET / api / penalties / { chatId };
```

### Step 5: Mark Filing Complete

```javascript
// When user marks filing done
POST /api/filings/{chatId}/mark-filed
{
  "filing_id": 123,
  "acknowledgment": "ARN..."
}
```

### Example Bot Flow

```javascript
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_BASE = "http://localhost:3000/api";

bot.command("start", async (ctx) => {
  // Create user in backend
  await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ctx.from.id.toString(),
      // ... collect GSTIN, business name via conversation
    }),
  });
});

bot.command("filings", async (ctx) => {
  const res = await fetch(`${API_BASE}/filings/${ctx.from.id}?status=pending`);
  const { data } = await res.json();

  data.forEach((filing) => {
    ctx.reply(
      `📄 ${filing.filing_type} - ${filing.period}\n` +
        `Due: ${filing.due_date}\n` +
        `Status: ${filing.status}`
    );
  });
});

// Notification polling (run separately)
setInterval(async () => {
  const res = await fetch(`${API_BASE}/notifications/pending`);
  const { data } = await res.json();

  for (const notif of data) {
    await bot.telegram.sendMessage(notif.chat_id, notif.message);

    await fetch(`${API_BASE}/notifications/${notif.id}/sent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "telegram" }),
    });
  }
}, 60000); // Check every minute
```

---

## 🔍 Testing

### Manual Testing with cURL

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "test123",
    "gstin": "27AABCU9603R1ZM",
    "business_name": "Test Business",
    "state": "MAHARASHTRA",
    "filing_scheme": "MONTHLY",
    "annual_turnover": 5000000
  }'

# Get filings
curl http://localhost:3000/api/filings/test123?status=pending

# Calculate penalty
curl -X POST http://localhost:3000/api/penalties/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "filing_type": "GSTR-1",
    "days_late": 10,
    "tax_amount": 10000
  }'

# Validate ITC
curl -X POST http://localhost:3000/api/itc/validate \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "test123",
    "invoice_number": "INV001",
    "item_description": "Office laptop",
    "itc_amount": 9000
  }'
```

---

## 📝 Notes

### Database

- SQLite database stored in `data/compliance.db`
- Automatically created on first run
- Includes views for common queries
- Foreign keys enforced

### Cron Jobs

- Run in IST timezone (Asia/Kolkata)
- Can be manually triggered for testing:
  ```javascript
  import CronJobs from "./services/cronJobs.js";
  CronJobs.runManually("notifications"); // or 'overdue', 'nextMonth', 'cleanup'
  ```

### Error Handling

- All endpoints return consistent error format
- 400 for validation errors
- 403 for access denied
- 404 for not found
- 500 for server errors

### Audit Logging

- All user actions logged in `audit_log` table
- Includes: user operations, filing updates, penalty payments

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in .env
- [ ] Configure proper database backup
- [ ] Set up monitoring (health check endpoint)
- [ ] Configure CORS for bot domain
- [ ] Set up process manager (PM2)
- [ ] Configure logging
- [ ] Set up SSL/HTTPS
- [ ] Database in persistent storage

### PM2 Deployment

```bash
npm install -g pm2
pm2 start src/backend/server.js --name gst-backend
pm2 startup
pm2 save
```

---

## 📞 Support

For questions or issues, contact the backend team.

**API Base URL:** `http://localhost:3000/api`

**Health Check:** `http://localhost:3000/health`
