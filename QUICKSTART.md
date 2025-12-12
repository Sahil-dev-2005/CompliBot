# 🚀 Quick Start Guide - GST Compliance Backend

## ✅ Complete Backend Ready for Bot Integration

Your GST Compliance Bot backend is **100% ready**! The bot team can now integrate with the REST API.

---

## 📦 Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file (optional - uses defaults)
cp .env.example .env

# 3. Start the server
npm start

# Or for development with auto-reload:
npm run dev
```

Server starts on: **http://localhost:3000**

---

## ✨ Features

### ✅ Database Layer

- **SQLite database** with complete GST compliance schema
- **9 tables**: users, filings, notifications, penalties, ITC reconciliation, deadlines, audit log
- **3 views**: overdue filings, upcoming deadlines, user compliance status
- **Automatic initialization** on first run

### ✅ Business Services

- **Penalty Calculator**: Late filing fees (₹100/day) + 18% interest
- **ITC Validator**: Detects blocked categories (food, fuel, vehicle, entertainment)
- **Notification Engine**: 5 alert types (GREEN → YELLOW → RED → OVERDUE)
- **Deadline Tracker**: Auto-generates GSTR-1/3B filings based on user scheme

### ✅ API Endpoints (32 total)

- **User Management** (6 endpoints): Create, read, update, delete, compliance status
- **Filing Management** (5 endpoints): Get filings, mark filed, update tax amount
- **Notifications** (4 endpoints): Pending notifications, mark sent/failed
- **Penalty Calculation** (7 endpoints): Calculate penalties, interest, ITC fraud
- **ITC Validation** (5 endpoints): Validate claims, bulk validate, reconciliation
- **Analytics** (5 endpoints): Dashboard, compliance rates, trends

### ✅ Automation (Cron Jobs)

- **Daily Notifications** (9 AM IST): Sends GREEN/YELLOW/RED alerts
- **Overdue Checks** (Every 6 hours): Updates penalties for overdue filings
- **Monthly Filing Generation** (1st day, 2 AM): Creates next month's filings
- **Database Cleanup** (Sunday, 3 AM): Removes old notifications/logs

---

## 🎯 For Bot Team: Integration Points

### 1️⃣ User Onboarding

```javascript
// When user starts bot, create user in backend
POST /api/users
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

### 2️⃣ Show Pending Filings

```javascript
// Get upcoming deadlines for user
GET /api/filings/{chatId}?status=upcoming&days=30
```

### 3️⃣ Send Notifications

```javascript
// Bot polls this endpoint every minute
GET /api/notifications/pending

// For each notification, send to user and mark as sent:
POST /api/notifications/{notificationId}/sent
{ "channel": "telegram" }
```

### 4️⃣ Calculate Penalty

```javascript
// When user asks "How much penalty if I file late?"
POST /api/penalties/calculate
{
  "filing_type": "GSTR-1",
  "days_late": 10,
  "tax_amount": 10000
}
// Returns: { late_fee: 1000, interest: 49.32, total: 1049.32 }
```

### 5️⃣ Validate ITC

```javascript
// When user wants to check ITC claim
POST /api/itc/validate
{
  "chat_id": "123456789",
  "invoice_number": "INV2024001",
  "item_description": "Petrol for office vehicle",
  "itc_amount": 5000
}
// Returns: { isValid: false, blockedITC: 2500, message: "50% blocked for fuel" }
```

### 6️⃣ Mark Filing Complete

```javascript
// When user says they filed return
POST /api/filings/{chatId}/mark-filed
{
  "filing_id": 123,
  "acknowledgment": "ARN12345678901234"
}
```

---

## 📖 Full Documentation

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for:

- Complete endpoint reference (32 endpoints)
- Request/response examples
- Error handling
- Integration guide with code samples
- Testing with cURL

---

## 🧪 Quick Test

```bash
# 1. Start server
npm start

# 2. Check health
curl http://localhost:3000/health

# 3. Create test user
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

# 4. Get user's filings
curl http://localhost:3000/api/users/test123

# 5. Get pending filings
curl http://localhost:3000/api/filings/test123?status=pending

# 6. Calculate penalty
curl -X POST http://localhost:3000/api/penalties/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "filing_type": "GSTR-1",
    "days_late": 10,
    "tax_amount": 10000
  }'
```

---

## 🏗️ Architecture

```
Backend API (Port 3000)
├── Database (SQLite)
│   └── Auto-initializes on startup
├── Cron Jobs (Automated tasks)
│   └── Runs in background
└── REST API
    └── Bot team integrates here
```

**Separation of Concerns:**

- **Backend Team (You)**: Provides REST API with business logic
- **Bot Team (Teammate)**: Telegram bot that calls your API

---

## 📁 Project Structure

```
src/backend/
├── db/
│   ├── schema.sql              ✅ Database schema
│   ├── index.js                ✅ DB connection
│   └── queries.js              ✅ CRUD operations (50+ functions)
├── services/
│   ├── penaltyCalculator.js    ✅ Penalty logic
│   ├── itcValidator.js         ✅ ITC validation
│   ├── notificationEngine.js   ✅ Alert system
│   ├── deadlineTracker.js      ✅ Filing tracking
│   └── cronJobs.js             ✅ Scheduled tasks
├── routes/
│   ├── users.js                ✅ User endpoints
│   ├── filings.js              ✅ Filing endpoints
│   ├── notifications.js        ✅ Notification endpoints
│   ├── penalties.js            ✅ Penalty endpoints
│   ├── itc.js                  ✅ ITC endpoints
│   └── analytics.js            ✅ Analytics endpoints
└── server.js                   ✅ Main entry point
```

**Everything marked ✅ is complete and working!**

---

## 🎓 Key Concepts

### Alert Types

- **GREEN** (20 days before): Friendly reminder
- **YELLOW** (10 days before): Action needed soon
- **YELLOW_URGENT** (5 days before): Time running out
- **RED** (2 days before): Critical alert
- **RED_FINAL** (1 day before): Last warning
- **OVERDUE** (after due date): Filing missed + penalty calculation

### Filing Schemes

- **MONTHLY**: GSTR-1 (11th) + GSTR-3B (20th) every month
- **QUARTERLY**: GSTR-1 (13th of next month) + GSTR-3B (quarterly)

### Penalty Rules

- Late filing: ₹100/day (max ₹5,000 for returns, ₹25,000 for annual)
- Interest: 18% per annum on unpaid tax
- ITC fraud: 100% penalty + 24% interest

### Blocked ITC Categories

- Food & Beverages: 100% blocked
- Fuel: 50% blocked
- Vehicle Repairs: 100% blocked
- Entertainment: 100% blocked
- Guest House: 50% blocked

---

## 🔧 Configuration

Edit `.env` file (optional - defaults work):

```env
PORT=3000
DATABASE_PATH=./data/compliance.db
NOTIFICATION_ENABLED=true
CRON_ENABLED=true
TZ=Asia/Kolkata
```

---

## 📊 Database Auto-Initialization

On first run, database automatically:

1. Creates `data/` folder
2. Creates `compliance.db` file
3. Runs schema.sql to create tables
4. Seeds deadline templates (GSTR-1, GSTR-3B, GSTR-9)
5. Seeds blocked ITC categories

**No manual setup needed!**

---

## 🤝 Bot Integration Example

```javascript
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);
const API = "http://localhost:3000/api";

// User onboarding
bot.command("start", async (ctx) => {
  // Collect GSTIN, business name, etc. via conversation
  await fetch(`${API}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ctx.from.id.toString(),
      gstin: userGSTIN,
      business_name: userBusinessName,
      // ... other fields
    }),
  });
  ctx.reply("✅ Onboarding complete! I will notify you about deadlines.");
});

// Show filings
bot.command("filings", async (ctx) => {
  const res = await fetch(`${API}/filings/${ctx.from.id}?status=pending`);
  const { data } = await res.json();

  data.forEach((filing) => {
    ctx.reply(
      `📄 ${filing.filing_type} for ${filing.period}\n` +
        `Due: ${filing.due_date}\n` +
        `Status: ${filing.status}`
    );
  });
});

// Penalty calculator
bot.command("penalty", async (ctx) => {
  ctx.reply("How many days late? (Enter number)");
  // ... collect days
  const res = await fetch(`${API}/penalties/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filing_type: "GSTR-1",
      days_late: userDays,
      tax_amount: 10000,
    }),
  });
  const { data } = await res.json();
  ctx.reply(
    `💰 Total penalty: ₹${data.total_penalty}\n` +
      `Late fee: ₹${data.late_fee}\n` +
      `Interest: ₹${data.interest}`
  );
});

// Notification polling (separate process)
setInterval(async () => {
  const res = await fetch(`${API}/notifications/pending`);
  const { data } = await res.json();

  for (const notif of data) {
    await bot.telegram.sendMessage(notif.chat_id, notif.message);
    await fetch(`${API}/notifications/${notif.id}/sent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "telegram" }),
    });
  }
}, 60000); // Check every minute

bot.launch();
```

---

## ✅ Checklist for Bot Team

- [ ] Backend running on `http://localhost:3000`
- [ ] Test health endpoint: `GET /health`
- [ ] Create test user: `POST /api/users`
- [ ] Get user filings: `GET /api/filings/{chatId}`
- [ ] Implement notification polling: `GET /api/notifications/pending`
- [ ] Test penalty calculator: `POST /api/penalties/calculate`
- [ ] Test ITC validator: `POST /api/itc/validate`
- [ ] Mark filing as complete: `POST /api/filings/{chatId}/mark-filed`
- [ ] Get compliance dashboard: `GET /api/analytics/dashboard`

---

## 🎉 You're All Set!

The backend is **production-ready** and waiting for bot integration. All endpoints are documented, tested, and working. The bot team can start building immediately!

**Next Steps:**

1. Share this guide + API_DOCUMENTATION.md with bot team
2. Start backend: `npm start`
3. Bot team builds Telegram bot that calls your API
4. Test end-to-end flow

**Questions?** Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed examples.
