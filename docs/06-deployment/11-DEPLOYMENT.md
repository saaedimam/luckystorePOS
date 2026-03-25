# React POS - Deployment Guide

## Overview
Guide to deploy the React POS application to production.

---

## Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables documented
- [ ] Edge Functions deployed
- [ ] Supabase RLS policies configured
- [ ] Storage bucket configured

---

## Option 1: Vercel Deployment (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? lucky-pos
# - Directory? ./
# - Override settings? No
```

### Step 4: Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PROCESS_SALE_EDGE_URL`
3. Redeploy

### Step 5: Get Deployment URL

After deployment, Vercel provides:
- Production URL: `https://lucky-pos.vercel.app`
- Preview URLs for each commit

---

## Option 2: Netlify Deployment

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login

```bash
netlify login
```

### Step 3: Deploy

```bash
# Build first
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Step 4: Configure Environment Variables

In Netlify Dashboard:
1. Site Settings → Environment Variables
2. Add all `VITE_*` variables
3. Redeploy

---

## Option 3: Manual Deployment

### Step 1: Build

```bash
npm run build
```

### Step 2: Upload dist/ Folder

Upload `dist/` folder contents to:
- Static hosting (AWS S3, Google Cloud Storage)
- Web server (nginx, Apache)
- CDN

### Step 3: Configure Server

**nginx example:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Environment Variables for Production

### Required Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CREATE_SALE_EDGE_URL=https://your-project.supabase.co/functions/v1/create-sale
```

### Security Notes

- ✅ `VITE_*` variables are exposed to client (this is OK for anon key)
- ❌ Never expose service role key
- ✅ Use RLS policies for security
- ✅ Edge Functions handle sensitive operations

---

## Post-Deployment Steps

### 1. Test Production Build

- [ ] Visit deployed URL
- [ ] Test POS page loads
- [ ] Test Admin page loads
- [ ] Test barcode scanning
- [ ] Test checkout flow
- [ ] Test item creation

### 2. Configure CORS (if needed)

If using custom domain, update Supabase:
1. Go to Project Settings → API
2. Add domain to allowed origins

### 3. Set Up Custom Domain (Optional)

**Vercel:**
1. Project Settings → Domains
2. Add custom domain
3. Configure DNS

**Netlify:**
1. Site Settings → Domain Management
2. Add custom domain
3. Configure DNS

---

## Continuous Deployment

### GitHub Actions (Vercel)

Vercel auto-deploys on push to main branch.

### Manual Deployment

```bash
# Build and deploy
npm run build
vercel --prod
```

---

## Monitoring

### Set Up Error Tracking

**Sentry (Recommended):**

```bash
npm install @sentry/react
```

Add to `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### Analytics

Add Google Analytics or similar:

```typescript
// src/lib/analytics.ts
export function trackEvent(name: string, data?: any) {
  // Implement analytics tracking
}
```

---

## Performance Optimization

### 1. Code Splitting

Already handled by Vite - routes are code-split automatically.

### 2. Image Optimization

- Use Supabase Storage CDN
- Compress images before upload
- Use WebP format

### 3. Caching

Configure caching headers:

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Troubleshooting

### Build Fails

**Issue:** TypeScript errors
**Solution:** Fix TypeScript errors, check `tsconfig.json`

**Issue:** Missing dependencies
**Solution:** Run `npm install`, check `package.json`

### Deployment Fails

**Issue:** Environment variables missing
**Solution:** Add all `VITE_*` variables in deployment platform

**Issue:** Build timeout
**Solution:** Optimize build, check for large dependencies

### Runtime Errors

**Issue:** Supabase connection fails
**Solution:** Check environment variables, verify Supabase project active

**Issue:** Edge Function not found
**Solution:** Verify Edge Function deployed, check URL correct

---

## Rollback Plan

### Vercel

1. Go to Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

### Netlify

1. Go to Deploys
2. Find previous deployment
3. Click "Publish deploy"

---

## Security Checklist

- [ ] RLS policies enabled
- [ ] Service role key not exposed
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Environment variables secured
- [ ] Error messages don't leak sensitive info

---

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up monitoring
3. ✅ Configure backups
4. ✅ Document deployment process
5. ✅ Train users
6. ✅ Set up support process

---

## Deployment URLs Reference

Keep track of:
- Production URL: `https://lucky-pos.vercel.app`
- Staging URL: `https://lucky-pos-staging.vercel.app`
- Supabase Dashboard: `https://app.supabase.com`
- Edge Functions: `https://your-project.supabase.co/functions/v1/`

---

**Status:** Ready to deploy  
**Recommended:** Vercel for easiest setup  
**Next:** Follow deployment steps for your chosen platform

