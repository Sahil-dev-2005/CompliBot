<div align="center">

# 🤖 CompliBot

### AI-Powered GST Compliance & Invoice Processing Assistant

[![CI Pipeline](https://github.com/yourusername/complibot/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/complibot/actions/workflows/ci.yml)
[![ESLint](https://github.com/yourusername/complibot/actions/workflows/lint.yml/badge.svg)](https://github.com/yourusername/complibot/actions/workflows/lint.yml)
[![Prettier](https://github.com/yourusername/complibot/actions/workflows/format.yml/badge.svg)](https://github.com/yourusername/complibot/actions/workflows/format.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22.14.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2.1-blue.svg)](https://expressjs.com/)
[![Google AI](https://img.shields.io/badge/Google_AI-Gemini_2.5-orange.svg)](https://ai.google.dev/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot_API-blue.svg)](https://telegram.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

**CompliBot** is an intelligent GST compliance automation platform that combines **Google Gemini AI**, **Telegram Bot**, and **REST API** to streamline GST filing, invoice processing, penalty calculations, and compliance reminders for Indian businesses.

[Features](#-features) •
[Quick Start](#-quick-start) •
[API Documentation](#-api-documentation) •
[Architecture](#-architecture) •
[Deployment](#-deployment)

</div>

---

## 🌟 Features

### 🧠 AI-Powered Intelligence

- **Natural Language Processing**: Ask GST-related questions in plain English, Hindi, or Telugu
- **Invoice OCR**: Extract invoice data from images using Google Gemini Vision
- **Smart Penalty Calculator**: Calculate late filing penalties with AI-powered explanations
- **Personalized Reminders**: AI-generated filing reminders based on user's compliance history

### 💬 Telegram Bot Interface

- **Multi-Language Support**: English, Hindi (हिंदी), and Telugu (తెలుగు)
- **Interactive Onboarding**: Guided GSTIN registration with validation
- **Scene-Based Conversations**: Intuitive conversation flows for complex tasks
- **Real-Time Notifications**: Filing deadlines, penalty alerts, and compliance updates

### 🔌 RESTful API

- **GST JSON Generation**: Convert invoice images to GST return JSON format
- **GSTIN Validation**: Validate and extract state codes from GSTIN
- **Invoice Processing**: Extract and structure invoice data
- **Penalty Calculation**: Calculate penalties with detailed breakdowns
- **Database Queries**: User management, filing history, and compliance tracking

### 🗄️ Cloud Database Integration

- **Turso Cloud Database**: Serverless SQLite with global edge replication
- **6-Table Schema**: Users, GST codes, filing periods, invoices, items, queries
- **Transaction Management**: ACID-compliant data operations
- **Automatic Migrations**: Schema initialization and updates

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (tested on v22.14.0)
- **npm** v8+
- **Google AI API Key** ([Get free key](https://ai.google.dev/))
- **Turso Database** ([Free account](https://turso.tech/))
- **Telegram Bot Token** ([Create bot via @BotFather](https://t.me/botfather))

### Installation

1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/complibot.git
cd complibot
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment**

Create a `.env` file in the root directory:

```env
# Google AI Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Turso Database Configuration
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Server Configuration
PORT=8080
NODE_ENV=development

# AI Model Configuration
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# GST Configuration
GST_VERSION=GST3.2.3
DEFAULT_LANGUAGE=en
```

4. **Start the Application**

```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev

# Test the system
npm test
```

5. **Verify Installation**

```bash
# Check API health
curl http://localhost:8080

# Expected response: API documentation with available endpoints
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:8080
```

### Endpoints

#### 1. **Generate GST Return JSON**

Convert invoice image to GST-compliant JSON format.

```http
POST /generate-gst-json
Content-Type: multipart/form-data

Parameters:
  - invoiceImage: File (required) - Invoice image (JPG, PNG)
  - gstin: String (optional) - Supplier GSTIN for validation
  - period: String (optional) - Filing period (e.g., "2024-03")

Response: 200 OK
{
  "success": true,
  "gstData": {
    "gstin": "29ABCDE1234F1Z5",
    "fp": "032024",
    "b2b": [ ... ],
    "b2cl": [ ... ],
    "b2cs": [ ... ]
  },
  "extractedData": { ... }
}
```

#### 2. **Extract Invoice Data**

Extract structured data from invoice image.

```http
POST /extract-invoice
Content-Type: multipart/form-data

Parameters:
  - invoiceImage: File (required)

Response: 200 OK
{
  "success": true,
  "invoice": {
    "invoiceNumber": "INV-2024-001",
    "date": "2024-03-15",
    "supplierGSTIN": "29ABCDE1234F1Z5",
    "buyerGSTIN": "27XYZAB5678L1Z3",
    "items": [ ... ],
    "totals": { ... }
  }
}
```

#### 3. **Calculate GST Penalty**

Calculate late filing penalty with AI explanation.

```http
POST /calculate-penalty

Request Body:
{
  "gstin": "29ABCDE1234F1Z5",
  "filingType": "GSTR3B",
  "dueDate": "2024-03-20",
  "filingDate": "2024-04-15",
  "annualTurnover": 50000000
}

Response: 200 OK
{
  "penalty": 2000,
  "breakdown": {
    "lateFee": 1000,
    "interest": 1000,
    "daysLate": 26
  },
  "explanation": "AI-generated explanation..."
}
```

#### 4. **Validate GSTIN**

Validate GSTIN format and extract state code.

```http
GET /validate-gstin/:gstin

Response: 200 OK
{
  "valid": true,
  "gstin": "29ABCDE1234F1Z5",
  "stateCode": "29",
  "stateName": "Karnataka"
}
```

#### 5. **Get Filing Deadlines**

Get upcoming GST filing deadlines.

```http
GET /deadlines?month=2024-03

Response: 200 OK
{
  "deadlines": [
    {
      "returnType": "GSTR3B",
      "dueDate": "2024-04-20",
      "period": "March 2024",
      "daysRemaining": 5
    },
    ...
  ]
}
```

#### 6. **Chat with AI**

Ask GST-related questions in natural language.

```http
POST /chat

Request Body:
{
  "message": "What is the GST rate on packaged food?",
  "context": {
    "gstin": "29ABCDE1234F1Z5",
    "language": "en"
  }
}

Response: 200 OK
{
  "response": "Packaged food items attract a GST rate of 5% to 18% depending on the specific product category...",
  "confidence": 0.95,
  "sources": [ ... ]
}
```

---

## 🤖 Telegram Bot Usage

### Getting Started

1. **Start Bot**: Open Telegram and search for your bot (@YourBotUsername)
2. **Send `/start`**: Begin registration process
3. **Select Language**: Choose English, Hindi, or Telugu
4. **Complete Onboarding**:
   - Enter trade name
   - Provide GSTIN (validated automatically)
   - Confirm state code

### Commands

| Command     | Description                    |
| ----------- | ------------------------------ |
| `/start`    | Start bot and register         |
| `/help`     | Show available commands        |
| `/language` | Change language preference     |
| `/deadline` | View upcoming filing deadlines |
| `/penalty`  | Calculate late filing penalty  |
| `/invoice`  | Upload invoice for processing  |
| `/query`    | Ask GST-related question       |
| `/reminder` | Set filing reminders           |
| `/status`   | Check compliance status        |

### Natural Language Queries

Just send a message to ask questions:

- "What is GST rate on mobile phones?"
- "How to file GSTR-1?"
- "मुझे GST registration के बारे में बताइए" (Hindi)
- "GST రిటర్న్ ఎలా file చేయాలి?" (Telugu)

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        CompliBot System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Telegram Bot  │  │   REST API     │  │  Google AI     │ │
│  │  (Telegraf)   │  │  (Express.js)  │  │  (Gemini 2.5)  │ │
│  └───────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
│          │                   │                     │         │
│          └───────────────────┼─────────────────────┘         │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │  Application Core  │                    │
│                    │   (src/index.js)   │                    │
│                    └─────────┬─────────┘                    │
│                              │                               │
│          ┌───────────────────┼───────────────────┐          │
│          │                   │                   │          │
│  ┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼───────┐  │
│  │  AI Helper     │  │  GST Helper │  │  Database      │  │
│  │  (aiHelper.js) │  │(gstHelper.js)│  │  (Turso Cloud) │  │
│  └────────────────┘  └─────────────┘  └────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend Framework**

- Node.js v22.14.0
- Express.js v5.2.1
- CommonJS Module System

**AI & Machine Learning**

- Google Gemini 2.5 Flash
- @google/generative-ai v0.21.0
- Vision AI for Invoice OCR
- NLP for conversational queries

**Database**

- Turso Cloud (Serverless SQLite)
- @libsql/client v0.14.0
- Global edge replication
- ACID transactions

**Telegram Integration**

- Telegraf v4.16.3
- Scene-based conversations
- Multi-language support
- Webhook & long-polling modes

**File Processing**

- Multer v1.4.5 for uploads
- Image processing with AI
- 10MB max file size
- JPG/PNG support

### Project Structure

```
complibot/
├── src/
│   ├── index.js                 # Application entry point
│   ├── server.js                # Express API server
│   ├── bot.js                   # Telegram bot implementation
│   ├── config/
│   │   └── env.js               # Environment configuration
│   ├── db/
│   │   └── index.js             # Database client & schema
│   ├── modules/
│   │   ├── aiHelper.js          # Google AI integration
│   │   ├── gstHelper.js         # GST utility functions
│   │   ├── jsonHelper.js        # JSON processing
│   │   └── smsHelper.js         # SMS notifications
│   └── tools/
│       └── jsonGenerator.js     # GST JSON generator
├── test-system.js               # Comprehensive test suite
├── package.json                 # Dependencies & scripts
├── .env                         # Environment variables (create this)
├── MASTER_DOCUMENTATION.md      # Complete system documentation
├── QUICKSTART.md                # Quick setup guide
└── README.md                    # This file
```

---

## 🧪 Testing

### Run Test Suite

```bash
npm test
```

### Test Coverage

- ✅ GSTIN Validation (15 test cases)
- ✅ State Code Mapping (37 states + UTs)
- ✅ Penalty Calculation (10 scenarios)
- ✅ AI Response Generation (5 query types)
- ✅ Database Connection (CRUD operations)
- ✅ Environment Configuration (17 variables)

### Manual Testing

**Test API Endpoint:**

```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is GST?", "context": {"language": "en"}}'
```

**Test Invoice Upload:**

```bash
curl -X POST http://localhost:8080/generate-gst-json \
  -F "invoiceImage=@/path/to/invoice.jpg"
```

---

## 🚀 Deployment

### Deployment Options

#### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set GOOGLE_AI_API_KEY=your_key
railway variables set TURSO_DATABASE_URL=your_url
railway variables set TURSO_AUTH_TOKEN=your_token
railway variables set TELEGRAM_BOT_TOKEN=your_token

# Deploy
railway up
```

#### Option 2: Docker

```bash
# Build image
docker build -t complibot .

# Run container
docker run -d \
  -p 8080:8080 \
  --env-file .env \
  --name complibot \
  complibot
```

#### Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Post-Deployment

1. **Set Telegram Webhook:**

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/telegram/webhook"
```

2. **Verify Deployment:**

```bash
curl https://your-domain.com
```

3. **Monitor Logs:**

```bash
# Railway
railway logs

# Docker
docker logs -f complibot
```

---

## 🔐 Security & Best Practices

### Environment Variables

- **Never commit `.env` file** to version control
- Use **strong, unique tokens** for all services
- Rotate API keys regularly (every 90 days)
- Use **environment-specific configs** (dev, staging, prod)

### API Security

- **Rate limiting**: 100 requests/minute per IP
- **File validation**: Only JPG/PNG, max 10MB
- **GSTIN validation**: All inputs validated before processing
- **Error handling**: Never expose internal errors to users

### Database Security

- **Turso authentication** with secure tokens
- **Prepared statements** to prevent SQL injection
- **Encrypted connections** via HTTPS/TLS
- **Regular backups** (Turso automatic backups)

---

## 🛠️ Configuration

### AI Model Options

```env
# Fast & cost-effective (default)
AI_MODEL=gemini-2.5-flash

# High accuracy
AI_MODEL=gemini-2.5-pro

# Temperature (0.0 = deterministic, 1.0 = creative)
AI_TEMPERATURE=0.7

# Max tokens per response
AI_MAX_TOKENS=2048
```

### Language Support

```env
# Default language for API
DEFAULT_LANGUAGE=en  # en, hi, te

# Telegram bot languages
BOT_LANGUAGES=en,hi,te
```

### Rate Limits

```env
# Google AI (free tier)
AI_REQUESTS_PER_DAY=20

# Recommended for production: 1000/day at ₹500/month
AI_REQUESTS_PER_DAY=1000
```

---

## 📊 Database Schema

### Tables

**users**

- `id`, `telegram_chat_id`, `gstin`, `trade_name`, `state_code`, `language_preference`, `created_at`, `last_active`

**gst_state_codes**

- `state_code`, `state_name`, `state_type`

**filing_periods**

- `id`, `gstin`, `period`, `return_type`, `due_date`, `filed_date`, `status`

**invoices**

- `id`, `gstin`, `invoice_number`, `invoice_date`, `buyer_gstin`, `place_of_supply`, `total_amount`, `tax_amount`

**invoice_items**

- `id`, `invoice_id`, `item_description`, `hsn_code`, `quantity`, `unit_price`, `taxable_value`, `gst_rate`

**user_queries**

- `id`, `telegram_chat_id`, `query_text`, `ai_response`, `query_type`, `timestamp`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (CommonJS)
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 📞 Support

### Documentation

- 📖 [Master Documentation](MASTER_DOCUMENTATION.md) - Complete system guide
- 🚀 [Quick Start Guide](QUICKSTART.md) - Setup in 5 minutes
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - 90+ verification items

### Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/complibot/issues)
- **Email**: support@complibot.example.com
- **Telegram**: @CompliBot_Support

### Resources

- [Google AI Studio](https://ai.google.dev/) - Get API key
- [Turso Documentation](https://docs.turso.tech/) - Database setup
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot development
- [GST Portal](https://www.gst.gov.in/) - Official GST information

---

<div align="center">

**Built with ❤️ for Indian Businesses**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/yourusername/complibot/issues) •
[Request Feature](https://github.com/yourusername/complibot/issues) •
[Documentation](MASTER_DOCUMENTATION.md)

</div>
