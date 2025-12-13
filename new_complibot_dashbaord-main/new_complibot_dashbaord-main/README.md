# Complibot Dashboard Frontend

A professional React-based GST compliance dashboard with OTP authentication and real-time news feed integration.

## Features

- **OTP Authentication**: Secure login with GSTIN validation and OTP verification
- **Compliance Dashboard**: View pending dues, completed filings, and compliance score
- **Real-time GST News**: Fetches latest updates from GST India RSS feed
- **Responsive Design**: Mobile-first approach with clean, professional UI
- **LocalStorage Session**: Persistent user sessions across page refreshes

## Tech Stack

- React 19.2 with Vite
- React Router DOM for navigation
- React Circular Progressbar for compliance gauge
- CSS Modules for styling
- Native Fetch API for HTTP requests
- DOMParser for RSS feed parsing

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running at `http://localhost:3000`

## Installation

1. Navigate to the project directory:
```bash
cd complibot-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional) to customize API URL:
```env
VITE_API_URL=http://localhost:3000
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.jsx              # Main app with routing
├── main.jsx             # Entry point
├── config.js            # Configuration constants
├── pages/
│   ├── Login.jsx        # Login page with OTP flow
│   ├── Login.module.css
│   ├── Dashboard.jsx    # Main dashboard
│   └── Dashboard.module.css
├── components/
│   ├── Header.jsx       # Dashboard header
│   ├── Header.module.css
│   ├── ComplianceGauge.jsx  # Circular gauge component
│   ├── ComplianceGauge.module.css
│   ├── FilingCard.jsx   # Reusable filing card
│   ├── FilingCard.module.css
│   ├── NewsCard.jsx     # News item card
│   └── NewsCard.module.css
├── services/
│   ├── api.js           # API call functions
│   └── rssParser.js     # RSS feed parser
└── utils/
    └── validators.js    # GSTIN and OTP validation
```

## API Integration

The application expects the following backend endpoints:

### Send OTP
```
POST http://localhost:3000/api/auth/otp
Body: { "gstin": "07ABCDE1234F1Z5" }
Response: { "success": true, "message": "OTP sent successfully" }
```

### Verify OTP
```
POST http://localhost:3000/api/auth/verify
Body: { "gstin": "07ABCDE1234F1Z5", "otp": "123456" }
Response: { 
  "success": true, 
  "user": { 
    "gstin": "07ABCDE1234F1Z5",
    "trade_name": "Test Store",
    "legal_name": "John Doe"
  }
}
```

## Features Checklist

- ✅ GSTIN validation (15 characters, specific format)
- ✅ Send OTP with loading state and button disable
- ✅ OTP input appears after successful OTP send
- ✅ Verify button enabled only with 6-digit OTP
- ✅ Dashboard loads user data from localStorage
- ✅ Authentication guard redirects unauthenticated users
- ✅ Compliance score gauge with color coding
- ✅ Pending filings with overdue/pending status
- ✅ Completed filings with ARN display
- ✅ RSS feed integration for GST news
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Logout functionality
- ✅ Error handling and loading states

## Testing the Application

1. **Start the backend server** at `http://localhost:3000`

2. **Open the frontend** at `http://localhost:5173`

3. **Test Login Flow**:
   - Enter a valid GSTIN (e.g., `07ABCDE1234F1Z5`)
   - Click "Send OTP"
   - Enter the 6-digit OTP received
   - Click "Verify OTP"

4. **Test Dashboard**:
   - View user information in header
   - Check compliance score gauge
   - Review pending and completed filings
   - Scroll to see GST news feed
   - Test logout functionality

5. **Test Responsive Design**:
   - Resize browser window
   - Test on mobile device (DevTools)
   - Verify layout adapts correctly

## Customization

### Change API URL
Edit `src/config.js`:
```javascript
export const API_BASE_URL = "http://your-api-url:port";
```

### Modify Dummy Data
Edit filing data in `src/pages/Dashboard.jsx`:
```javascript
const pendingFilings = [...];
const completedFilings = [...];
```

### Adjust Compliance Score
Edit in `src/components/Header.jsx`:
```javascript
<ComplianceGauge score={7} maxScore={10} />
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
