# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Backend API URL configured
- [ ] Environment variables set
- [ ] Production build tested locally
- [ ] CORS configured on backend
- [ ] SSL certificate ready (for HTTPS)

## Build for Production

```bash
cd complibot-dashboard
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Zero configuration for Vite projects
- Automatic HTTPS
- Global CDN
- Free tier available
- Easy environment variable management

**Steps**:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-api.com`

5. Redeploy:
```bash
vercel --prod
```

**Alternative: GitHub Integration**
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy automatically on push

---

### Option 2: Netlify

**Steps**:

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

4. Set environment variables:
```bash
netlify env:set VITE_API_URL https://your-backend-api.com
```

**Alternative: Drag & Drop**
1. Build locally: `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder
4. Configure environment variables in site settings

---

### Option 3: AWS S3 + CloudFront

**Steps**:

1. Build the project:
```bash
npm run build
```

2. Create S3 bucket:
```bash
aws s3 mb s3://complibot-dashboard
```

3. Configure bucket for static website hosting:
```bash
aws s3 website s3://complibot-dashboard \
  --index-document index.html \
  --error-document index.html
```

4. Upload files:
```bash
aws s3 sync dist/ s3://complibot-dashboard --acl public-read
```

5. Create CloudFront distribution:
   - Origin: S3 bucket
   - Default root object: index.html
   - Error pages: 404 → /index.html (for SPA routing)

6. Update DNS to point to CloudFront URL

---

### Option 4: GitHub Pages

**Steps**:

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/complibot-dashboard",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/complibot-dashboard/'
})
```

4. Deploy:
```bash
npm run deploy
```

---

### Option 5: Docker

**Dockerfile**:
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Build and run**:
```bash
docker build -t complibot-dashboard .
docker run -p 80:80 complibot-dashboard
```

---

## Environment Variables

### Development (.env.local)
```env
VITE_API_URL=http://localhost:3000
```

### Production (.env.production)
```env
VITE_API_URL=https://api.yourcompany.com
```

### Setting in Different Platforms

**Vercel**:
- Dashboard → Project → Settings → Environment Variables

**Netlify**:
- Dashboard → Site → Site settings → Environment variables

**AWS**:
- Use AWS Systems Manager Parameter Store
- Reference in CloudFormation/CDK

**Docker**:
```bash
docker run -e VITE_API_URL=https://api.example.com -p 80:80 complibot-dashboard
```

---

## Post-Deployment Verification

### 1. Check Application Loads
```bash
curl -I https://your-domain.com
```
Expected: `200 OK`

### 2. Test Login Flow
1. Open application URL
2. Enter GSTIN
3. Send OTP
4. Verify OTP
5. Check dashboard loads

### 3. Verify API Connection
- Open browser DevTools → Network tab
- Attempt login
- Check API calls to backend
- Verify CORS headers

### 4. Test Responsive Design
- Open on mobile device
- Test on tablet
- Verify desktop layout

### 5. Check RSS Feed
- Navigate to dashboard
- Verify news items load
- Check for CORS errors

---

## SSL/HTTPS Configuration

### Let's Encrypt (Free SSL)

**For Nginx**:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**For Apache**:
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

### Cloudflare (Free SSL + CDN)

1. Add site to Cloudflare
2. Update nameservers
3. Enable "Always Use HTTPS"
4. Set SSL mode to "Full"

---

## Performance Optimization

### 1. Enable Gzip Compression

**Nginx**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Set Cache Headers

**Nginx**:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Enable HTTP/2

**Nginx**:
```nginx
listen 443 ssl http2;
```

### 4. Minify Assets

Already handled by Vite build process.

---

## Monitoring & Analytics

### Google Analytics

Add to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Sentry (Error Tracking)

```bash
npm install @sentry/react
```

Add to `main.jsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

---

## Rollback Strategy

### Vercel
```bash
vercel rollback
```

### Netlify
- Dashboard → Deploys → Select previous deploy → Publish

### AWS S3
- Enable versioning on S3 bucket
- Restore previous version

### Docker
```bash
docker tag complibot-dashboard:latest complibot-dashboard:backup
docker pull complibot-dashboard:previous-version
docker run -p 80:80 complibot-dashboard:previous-version
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## Troubleshooting

### Issue: Blank page after deployment

**Solution**:
1. Check browser console for errors
2. Verify `base` in `vite.config.js`
3. Check routing configuration
4. Ensure all assets loaded correctly

### Issue: API calls failing

**Solution**:
1. Verify `VITE_API_URL` is set correctly
2. Check CORS configuration on backend
3. Ensure backend is accessible from frontend domain
4. Check SSL certificate if using HTTPS

### Issue: 404 on page refresh

**Solution**:
Configure server to serve `index.html` for all routes (SPA routing).

**Nginx**:
```nginx
try_files $uri $uri/ /index.html;
```

**Netlify**: Create `_redirects` file:
```
/*    /index.html   200
```

**Vercel**: Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables not exposed in client code
- [ ] CORS properly configured
- [ ] Content Security Policy headers set
- [ ] XSS protection enabled
- [ ] No sensitive data in localStorage
- [ ] API rate limiting enabled
- [ ] Input validation on both client and server

---

## Maintenance

### Regular Updates
```bash
npm outdated
npm update
npm audit fix
```

### Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor error rates (Sentry)
- Track performance (Google Analytics, Lighthouse)

### Backups
- Regular database backups (if applicable)
- Version control (Git)
- Deployment history (Vercel/Netlify)

---

## Support

For deployment issues:
1. Check deployment platform logs
2. Verify environment variables
3. Test production build locally
4. Check browser console for errors
5. Review network requests in DevTools
