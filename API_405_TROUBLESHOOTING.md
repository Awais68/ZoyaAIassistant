# 405 Method Not Allowed - Troubleshooting Guide

## What's Happening?

You're getting a **405 Method Not Allowed** error when trying to call `/api/commands/process`. This means the server is receiving the request but rejecting it because it doesn't recognize the method.

## Root Causes (in order of likelihood)

### 1. **Deployment Protection is STILL Active** (Most Likely)
Even though you see a 405 error (not an auth page), Deployment Protection might still be active and returning a 405 instead of redirecting.

**Steps to verify & fix:**
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project (ZoyaAIassistant)
3. Go to **Settings** → **Security** → **Deployment Protection**
4. Set to **Disabled** (not Preview Deployments)
5. Wait 1-2 minutes for changes to propagate
6. Test again in your app

### 2. **Latest Code Not Yet Deployed**
We just pushed a fix to `vercel.json`. Vercel might not have deployed it yet.

**Steps to force redeploy:**
1. Go to your Vercel project dashboard
2. Go to **Deployments** tab
3. Find the most recent deployment
4. Click the **3-dot menu** → **Redeploy**
5. Wait for deployment to complete (2-3 minutes)
6. Test again

### 3. **Test the Basic API Routing**

We created a simple test endpoint at `/api/test`. If this works, then API routing is OK and the issue is specific to `/api/commands/process`.

**Test it in your browser console:**
```javascript
fetch('/api/test').then(r => r.json()).then(console.log)
```

**Expected response:**
```json
{
  "success": true,
  "message": "API test endpoint is working!",
  "method": "GET",
  "timestamp": "2025-10-28T..."
}
```

**If you get:**
- ✅ 200 OK → API routing works, issue is specific to `/api/commands/process`
- ❌ 405 → API routing is broken, likely Deployment Protection

### 4. **If `/api/test` works but `/api/commands/process` fails**

The issue is in the handler itself. Possible causes:
- **CORS headers not set correctly** - The handler has CORS headers but they might be getting blocked
- **Handler export issue** - The TypeScript might not be compiling correctly
- **Missing dependencies** - The handler imports fail at runtime

**Solution:**
1. Check browser console for any CORS errors (look for red errors, not just 405)
2. If CORS error, we need to adjust the CORS headers
3. If it's a 405, the handler might not be exporting correctly

### 5. **Check Vercel Function Logs**

The best way to see what's happening:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Functions** tab (should show your API functions)
4. Click on `api/commands/process` or `api/test`
5. Scroll down to see **Recent Logs**
6. Click on a recent request to see detailed logs

This will show you:
- If the function is being called at all
- Any errors inside the function
- The exact request/response details

## Quick Diagnostic Command

Run this in your browser console to test both endpoints:

```javascript
// Test basic routing
fetch('/api/test')
  .then(r => {
    console.log('Test endpoint status:', r.status);
    return r.json();
  })
  .then(data => console.log('Test response:', data))
  .catch(e => console.error('Test error:', e));

// Test command processor
fetch('/api/commands/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'hello', language: 'en' })
})
  .then(r => {
    console.log('Commands endpoint status:', r.status);
    return r.json();
  })
  .then(data => console.log('Commands response:', data))
  .catch(e => console.error('Commands error:', e));
```

## What to Do Next

1. **First**: Verify Deployment Protection is disabled
2. **Second**: Wait 2-3 minutes and refresh your app
3. **Third**: If still failing, run the diagnostic command above
4. **Fourth**: Share the browser console output and Vercel function logs with the debugging info

---

## Technical Details (For Reference)

**Fixed in this update:**
- ✅ Updated `vercel.json` routes configuration for better API handling
- ✅ Added `api/test.ts` endpoint for diagnostics
- ✅ Verified handler exports are correct
- ✅ Confirmed build process compiles without errors

**What we know works:**
- Frontend correctly sends POST to `/api/commands/process` with proper JSON headers
- Build pipeline succeeds without errors
- API handler file exists and has correct TypeScript export
- CORS headers are set in the handler

**What might be wrong:**
- Deployment Protection blocking requests (most likely)
- Vercel hasn't deployed latest code yet
- Some subtle routing issue in vercel.json

**Most common solution:**
Simply disabling Deployment Protection usually fixes this! 🎯
