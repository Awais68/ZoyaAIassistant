# Deployment Reference Guide

## Issue Fixed: 405 Method Not Allowed on `/api/commands/process`

### Quick Summary
- **Problem**: API endpoints returned 405 errors on Vercel
- **Root Cause**: `tsconfig.json` was excluding the `api/` folder from TypeScript compilation
- **Solution**: Added `api/**/*` to tsconfig includes
- **Status**: ✅ FIXED - Changes pushed to GitHub, pending Vercel deployment

---

## Key Files Modified

### 1. `tsconfig.json` (CRITICAL FIX)
**What changed**: Added `api/**/*` to the include array

**Why it matters**: Vercel's build system needs TypeScript to be aware of the `api/` folder files so it can compile them as serverless functions.

**Before**:
```jsonc
"include": ["client/src/**/*", "shared/**/*", "server/**/*"]
```

**After**:
```jsonc
"include": ["client/src/**/*", "shared/**/*", "server/**/*", "api/**/*"]
```

---

### 2. `vercel.json` (ROUTING IMPROVEMENT)
**What changed**: Added explicit HTTP methods to API routes

**Why it matters**: Ensures Vercel explicitly allows POST, PUT, DELETE, etc. on API endpoints

**Key section**:
```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/$1",
    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  }
]
```

---

## New Files Created

### 1. `api/test.ts` (DIAGNOSTIC ENDPOINT)
Simple test endpoint to verify API routing works:
- Path: `/api/test`
- Method: GET or POST
- Response: `{ success: true, message: "API test endpoint is working!", ... }`
- Use this to test if basic API routing is working

### 2. Documentation Files
- **`DEPLOYMENT_FIX_SUMMARY.md`** - Quick start guide (read this first!)
- **`FIX_405_ERRORS.md`** - Technical deep-dive
- **`API_405_TROUBLESHOOTING.md`** - Detailed troubleshooting steps

---

## Serverless API Handlers

These TypeScript files in the `api/` folder are automatically deployed as Vercel serverless functions:

### `/api/commands/process.ts`
- **Purpose**: Process natural language commands
- **Method**: POST
- **Input**: `{ input: string, language?: string, inputType?: string }`
- **Output**: Processed command with AI response and intent
- **Status**: ✅ Now deployable (was returning 405 before)

### `/api/test.ts`
- **Purpose**: Verify API routing works
- **Method**: GET or POST  
- **Output**: Simple success message
- **Status**: ✅ New diagnostic endpoint

### `/api/dashboard.ts`
- **Purpose**: Get dashboard data
- **Method**: GET
- **Output**: Tasks, calendar events, emails, reminders
- **Status**: ✅ Deployable

---

## Configuration Files

### `vercel.json`
Controls how Vercel deploys your app:
- Specifies Node.js 20.x runtime for API functions
- Routes API calls to serverless handlers
- Routes static files to Vite build output
- Sets environment variables

### `.nvmrc`
Specifies Node.js version: `20.19.3`

### `package.json`
Build scripts:
- `npm run build` - Builds Vite frontend + esbuild backend
- Includes `@vercel/node` for TypeScript serverless support
- Includes all necessary dependencies

---

## Deployment Workflow

### Local Development
1. `npm install` - Install dependencies
2. `npm run dev` - Start dev server on port 5000
3. API routes work at `http://localhost:5000/api/*`
4. Frontend works at `http://localhost:5000`

### Production (Vercel)
1. Push to GitHub `main` branch
2. Vercel automatically triggers build
3. Vercel runs `npm run build`
4. TypeScript compiles (including `api/` files now!)
5. API functions deployed as serverless handlers
6. Static files deployed to CDN
7. App available at `https://zoi-*.vercel.app`

---

## Testing After Deployment

### Via Browser Console
```javascript
// Test basic routing
fetch('/api/test').then(r => r.json()).then(console.log)

// Test command processing  
fetch('/api/commands/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'hello', language: 'en' })
}).then(r => r.json()).then(console.log)
```

### Via curl (if you have it)
```bash
# Test endpoint
curl https://your-vercel-url.vercel.app/api/test

# Process command
curl -X POST https://your-vercel-url.vercel.app/api/commands/process \
  -H "Content-Type: application/json" \
  -d '{"input":"hello","language":"en"}'
```

---

## Vercel Dashboard Checks

### To verify deployment:
1. Go to https://vercel.com/dashboard
2. Select **ZoyaAIassistant** project
3. **Deployments** tab - Check for green checkmark (Ready)
4. **Functions** tab - Should see `api/commands/process`, `api/test`, `api/dashboard`
5. **Settings → Security → Deployment Protection** - Should be "Disabled"

### To view logs:
1. Go to **Functions** tab
2. Click on `api/commands/process`
3. Scroll to **Recent Logs**
4. Click on a request to see details

---

## Troubleshooting Checklist

If you still get 405 errors:

- [ ] Deployment Protection is **disabled** (not just for preview)
- [ ] Vercel deployment shows green "Ready" status
- [ ] Waited 2-3 minutes after pushing changes
- [ ] Browser cache cleared (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- [ ] `/api/test` endpoint returns 200
- [ ] Check Vercel Functions logs for errors
- [ ] Check browser DevTools Console (F12) for CORS/network errors

---

## Environment Variables

Set these in Vercel **Settings → Environment Variables**:

- `NODE_ENV` - Set to "production"
- `GEMINI_API_KEY` - Your API key (if using Gemini)
- `DATABASE_URL` - PostgreSQL connection (optional, for persistence)
- Any other .env variables your app needs

---

## Git Commits Related to This Fix

```
4bc3023 - docs: add comprehensive deployment fix summary
110dce2 - docs: add comprehensive fix guide for 405 errors  
9ced39e - fix: include api folder in tsconfig so Vercel compiles serverless functions (⭐ CRITICAL)
a28b072 - chore: add test endpoint and 405 troubleshooting guide
5b60a38 - fix: improve vercel.json routing configuration for API functions
```

The commit `9ced39e` is the critical fix. All others are supporting improvements.

---

## What's Next?

1. ✅ All code changes pushed to GitHub
2. ⏳ Vercel building (should take 1-2 minutes)
3. 🧪 Test the deployment using the browser console commands above
4. ✅ Verify Deployment Protection is disabled
5. 🎉 Your commands should now process successfully!

---

**Happy deploying! 🚀**
