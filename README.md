# 🤖 CompliBot - AI-Powered GST Compliance Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue)](https://telegram.org/)
[![Google AI](https://img.shields.io/badge/Google-Gemini%202.5-red)](https://ai.google.dev/)

**CompliBot** is an intelligent GST (Goods and Services Tax) compliance assistant for Indian businesses. It combines Telegram bot interface, REST API, and Google Gemini AI to automate GST compliance tasks, calculate penalties, process invoices, and provide instant answers to GST queries.

---

## ✨ Features

- 🤖 **Telegram Bot Interface** - Conversational UI for easy interaction
- 🧠 **AI-Powered** - Google Gemini 2.5 Flash for natural language processing
- 📊 **Penalty Calculator** - Accurate late filing penalty calculation with AI explanations
- 📄 **Invoice OCR** - Extract GST details from invoice images
- 🔔 **Smart Reminders** - Automated filing deadline notifications
- 🌐 **Multi-language** - English, Hindi, Telugu support
- 🌍 **REST API** - Programmatic access to all features
- ☁️ **Cloud Database** - Turso (LibSQL) for scalable storage

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already configured with your credentials:

- ✅ Google AI API Key
- ✅ Turso Database
- ✅ Telegram Bot Token

### 3. Test System

```bash
npm test
```

### 4. Start Server

```bash
npm start
```

Server will start at: **http://localhost:8080**

### 5. Use Telegram Bot

1. Open Telegram
2. Search for your bot
3. Send `/start` to register
4. Start using CompliBot!

📖 **Detailed Guide:** See [QUICKSTART.md](QUICKSTART.md)

---

## 📚 Documentation

- **[MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md)** - Complete system documentation
  - Architecture diagrams
  - API endpoints
  - Database schema
  - Deployment guide
- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide

---

## 🎯 Use Cases

### For Business Owners

- 📅 Never miss GST filing deadlines
- 💰 Calculate penalties before filing
- 📄 Process invoices via photo upload
- ❓ Get instant answers to GST questions

### For CAs & Tax Consultants

- 👥 Manage multiple client GSTINs
- 🔍 ITC reconciliation and validation
- 📊 Compliance analytics dashboard
- 🤖 Automate routine client queries

---

## 🛠️ Tech Stack

| Layer             | Technology              |
| ----------------- | ----------------------- |
| **Backend**       | Node.js, Express.js     |
| **Bot Framework** | Telegraf (Telegram)     |
| **AI Engine**     | Google Gemini 2.5 Flash |
| **Database**      | Turso (LibSQL Cloud)    |
| **Language**      | JavaScript (CommonJS)   |

---

## 📱 Telegram Bot Commands

| Command     | Description                   |
| ----------- | ----------------------------- |
| `/start`    | Register your business        |
| `/help`     | Show all commands             |
| `/status`   | Check filing status           |
| `/deadline` | Get next deadlines            |
| `/penalty`  | Calculate late filing penalty |
| `/invoice`  | Upload and process invoice    |
| `/query`    | Ask any GST question          |
| `/settings` | Change preferences            |

---

## 🌐 API Endpoints

### Health & Info

- `GET /health` - Check service status
- `GET /` - API documentation

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### User Management

- `GET /user/me` - Get user profile
- `PUT /user/update` - Update profile

### GST Operations

- `POST /gst/3b/penalty` - Calculate GSTR-3B penalty
- `GET /gst/3b/next-deadline` - Get next GSTR-3B deadline
- `GET /gst/1/next-deadline` - Get next GSTR-1 deadline
- `POST /gst/validate-rate` - Validate GST rate

### AI Services

- `POST /ai/chat` - Chat with AI about GST
- `POST /ai/analyze-invoice` - OCR invoice image

### Notifications

- `POST /notify/dispatch` - Send notification
- `POST /notify/test` - Test notification

📖 **Full API Docs:** See [MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md#4-api-endpoints)

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Tests include:

- ✅ GSTIN validation
- ✅ Penalty calculation
- ✅ AI response generation
- ✅ Database connection
- ✅ Environment configuration

---

## 📦 Project Structure

```
CompliBot/
├── app.js                      # Main server entry
├── .env                        # Environment config
├── package.json
│
├── src/
│   ├── bot.js                  # Telegram bot
│   ├── config/
│   │   └── env.js              # Config validator
│   ├── db/
│   │   └── index.js            # Database client
│   ├── modules/
│   │   ├── aiHelper.js         # AI service
│   │   ├── gstHelper.js        # GST utilities
│   │   └── ...
│   └── scenes/
│       └── onboarding.js       # Registration flow
│
├── MASTER_DOCUMENTATION.md     # Full docs
├── QUICKSTART.md              # Setup guide
└── test-system.js             # Test suite
```

---

## 🚢 Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Docker

```bash
docker build -t complibot .
docker run -p 8080:8080 --env-file .env complibot
```

### Vercel (Serverless)

```bash
npm i -g vercel
vercel --prod
```

📖 **Deployment Guide:** See [MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md#7-deployment-guide)

---

## 🗺️ Roadmap

### Phase 1 ✅ (Current)

- [x] Telegram bot with registration
- [x] AI-powered GST queries
- [x] Penalty calculator
- [x] Invoice OCR
- [x] REST API
- [x] Multi-language support

### Phase 2 🚧 (Q1 2026)

- [ ] Web dashboard
- [ ] Email notifications
- [ ] Bulk invoice upload
- [ ] GST return auto-fill
- [ ] Payment integration

### Phase 3 🔮 (Q2 2026)

- [ ] WhatsApp integration
- [ ] Voice commands
- [ ] Analytics dashboard
- [ ] E-Way bill generation
- [ ] Mobile app

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📖 **Documentation:** [MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Sahil-dev-2005/CompliBot/issues)
- 💬 **Telegram:** @CompliBot_Support (coming soon)

---

## 👥 Team

Built with ❤️ by Team CompliBot

- **Lead Developer:** Sahil
- **Architect:** GitHub Copilot (AI Assistant)
- **Database Specialist:** Kunal

---

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- Turso for cloud database infrastructure
- Telegram for bot platform
- Indian GST Portal for compliance guidelines

---

## ⚠️ Disclaimer

CompliBot is a compliance assistant tool. While we strive for accuracy, always verify critical GST information with official sources or consult a qualified CA. Not responsible for any tax-related errors or penalties.

---

**Last Updated:** December 13, 2025  
**Version:** 1.0.0

---

**Made in India 🇮🇳 | For India 🇮🇳**

<<<<<<< HEAD
[![ESLint](https://github.com/Sahil-dev-2005/CompliBot/actions/workflows/lint.yml/badge.svg)](https://github.com/Sahil-dev-2005/CompliBot/actions/workflows/lint.yml)
[![Prettier](https://github.com/Sahil-dev-2005/CompliBot/actions/workflows/format.yml/badge.svg)](https://github.com/Sahil-dev-2005/CompliBot/actions/workflows/format.yml)
[![CI](https://github.com/Sahil-dev-2005/CompliBot/actions/workflows/ci.yml/badge.svg)](https://github.com/Sahil-dev-2005/CompliBot/actions/workflows/ci.yml)
=======
A comprehensive GST compliance automation bot with AI-powered invoice processing capabilities.

## Features

- **GST Invoice Processing**: Extract data from invoice images using Google Gemini AI
- **GST Return Generation**: Automatically generate GST return JSON in standard format
- **Telegram Bot Integration**: Interactive bot for GST compliance tasks
- **Database Management**: SQLite database for user and transaction management
- **State Code Validation**: Automatic GST state code mapping and validation

## Quick Start

1. **Install Dependencies:**

```bash
npm install
```

2. **Configure Environment Variables:**

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys and configuration
```

Required environment variables:

- `GOOGLE_AI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com)
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso authentication token

Optional variables:

- `TELEGRAM_BOT_TOKEN` - For Telegram bot features
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)

3. **Start the API Server:**

```bash
npm start
```

4. **Test the API:**

```bash
npm test
```

## API Endpoints

### Generate GST Return JSON

```
POST /generate-gst-json
```

Upload an invoice image and get structured GST return JSON format.

### Health Check

```
GET /
```

Check API status and available endpoints.

## Usage Example

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('invoiceImage', fs.createReadStream('invoice.jpg'));

const response = await axios.post('http://localhost:8080/generate-gst-json', form, {
  headers: form.getHeaders(),
});

console.log(response.data);
```

## Project Structure

```
src/
├── server.js              # Main Express API server
├── bot.js                 # Telegram bot implementation
├── index.js               # Application entry point
├── db/
│   └── index.js           # Database connection and schema
├── modules/
│   ├── gstHelper.js       # GST utility functions
│   ├── jsonHelper.js      # JSON processing utilities
│   └── smsHelper.js       # SMS notification utilities
└── tools/
    └── jsonGenerator.js   # AI-powered GST JSON generation
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- [Example Usage](./example-usage.js) - Code examples
- [Schema Documentation](./schemacode.md) - Database schema

## Dependencies

- **Express**: Web framework for API server
- **Google Generative AI**: AI-powered invoice processing
- **Multer**: File upload handling
- **Telegraf**: Telegram bot framework
- **SQLite**: Database management

## License

ISC

> > > > > > > d67fb256a78ae9baf9d290d52d499ff053370f3b
