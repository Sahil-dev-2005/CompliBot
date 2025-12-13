# Installation Instructions

## Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)
- Backend API running at http://localhost:3000

## Step-by-Step Installation

### 1. Navigate to Project Directory

```bash
cd complibot-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- react (^19.2.0)
- react-dom (^19.2.0)
- react-router-dom (^6.28.0)
- react-circular-progressbar (^2.1.0)
- vite and other dev dependencies

**Note**: If you encounter PowerShell execution policy errors on Windows, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Start Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:5173**

### 4. Verify Backend Connection

Ensure your backend API is running at: **http://localhost:3000**

Test the endpoints:
- POST http://localhost:3000/api/auth/otp
- POST http://localhost:3000/api/auth/verify

## Alternative Installation Methods

### Using Yarn

```bash
yarn install
yarn dev
```

### Using pnpm

```bash
pnpm install
pnpm dev
```

## Troubleshooting Installation

### Issue: npm install fails

**Solution 1**: Clear npm cache
```bash
npm cache clean --force
npm install
```

**Solution 2**: Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use

**Solution**: Kill the process or change port

**Windows**:
```cmd
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
lsof -ti:5173 | xargs kill -9
```

Or change port in `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001
  }
})
```

### Issue: Module not found errors

**Solution**: Ensure all dependencies are installed
```bash
npm install react-router-dom react-circular-progressbar
```

## Verify Installation

After installation, verify everything works:

1. **Check if dev server starts**:
   ```bash
   npm run dev
   ```
   Should output: `Local: http://localhost:5173/`

2. **Open browser**: Navigate to http://localhost:5173

3. **Check console**: No errors should appear

4. **Test login page**: Should see GSTIN input field

## Next Steps

After successful installation:

1. ✅ Read [QUICKSTART.md](./QUICKSTART.md) for usage guide
2. ✅ Review [README.md](./README.md) for full documentation
3. ✅ Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing
4. ✅ Check [API_CONTRACT.md](./API_CONTRACT.md) for backend integration

## Production Build

To create a production build:

```bash
npm run build
```

Output will be in the `dist/` folder.

To preview the production build:

```bash
npm run preview
```

## Environment Configuration

Create a `.env` file (optional):

```env
VITE_API_URL=http://localhost:3000
```

For production, create `.env.production`:

```env
VITE_API_URL=https://your-production-api.com
```

## System Requirements

- **OS**: Windows, macOS, or Linux
- **Node.js**: v16.0.0 or higher
- **RAM**: 2GB minimum
- **Disk Space**: 500MB for node_modules

## Support

If you encounter issues during installation:

1. Check Node.js version: `node --version`
2. Check npm version: `npm --version`
3. Clear npm cache: `npm cache clean --force`
4. Try deleting node_modules and reinstalling
5. Check for error messages in terminal
6. Ensure you have internet connection for downloading packages

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Clear cache and reinstall
npm cache clean --force && rm -rf node_modules && npm install
```

## Installation Complete!

Once installation is successful, you should see:

```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

You're now ready to use the Complibot Dashboard! 🎉
