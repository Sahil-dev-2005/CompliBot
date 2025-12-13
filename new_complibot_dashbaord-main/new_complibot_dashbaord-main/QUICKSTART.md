# Quick Start Guide

## Setup in 3 Steps

### Step 1: Install Dependencies
```bash
cd complibot-dashboard
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

### Step 3: Ensure Backend is Running
Make sure your backend API is running at: `http://localhost:3000`

## Test the Application

### Login Flow
1. Open `http://localhost:5173`
2. Enter GSTIN: `07ABCDE1234F1Z5`
3. Click "Send OTP"
4. Enter the 6-digit OTP from your backend
5. Click "Verify OTP"

### Dashboard
- View compliance score (7/10)
- Check pending dues and filings
- Review completed filings
- Read latest GST news

### Logout
- Click the "Logout" button in the top-right corner

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Troubleshooting

### Backend Connection Error
**Error**: "Server unreachable. Check if backend is running."

**Solution**: 
1. Verify backend is running at `http://localhost:3000`
2. Check CORS is enabled on backend
3. Test backend endpoints manually

### Port Already in Use
**Error**: Port 5173 is already in use

**Solution**:
```bash
# Kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.js
```

### Dependencies Installation Failed
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### RSS Feed Not Loading
**Issue**: News section shows "Unable to load latest news"

**Possible Causes**:
1. Network connectivity issue
2. RSS feed URL is blocked
3. CORS issue with RSS feed

**Solution**: Check browser console for errors

## Project Structure Overview

```
complibot-dashboard/
├── src/
│   ├── pages/           # Login & Dashboard pages
│   ├── components/      # Reusable UI components
│   ├── services/        # API & RSS parser
│   ├── utils/           # Validators
│   └── config.js        # Configuration
├── public/              # Static assets
└── package.json         # Dependencies
```

## Configuration

### Change API URL
Create `.env` file:
```env
VITE_API_URL=http://your-backend-url:port
```

### Modify Dummy Data
Edit `src/pages/Dashboard.jsx`:
- `pendingFilings` array
- `completedFilings` array

### Adjust Compliance Score
Edit `src/components/Header.jsx`:
```javascript
<ComplianceGauge score={7} maxScore={10} />
```

## Next Steps

1. ✅ Complete installation
2. ✅ Test login flow
3. ✅ Explore dashboard
4. 📖 Read full [README.md](./README.md)
5. 🧪 Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend API is responding
3. Review error messages in the UI
4. Check network tab in DevTools

## Production Deployment

```bash
# Build for production
npm run build

# Output will be in 'dist' folder
# Deploy 'dist' folder to your hosting service
```

Popular hosting options:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
