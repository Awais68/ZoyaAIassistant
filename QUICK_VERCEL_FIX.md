# ⚡ Quick Vercel Fix - 5 Minutes

## Problem

✅ **Local works perfectly**  
❌ **Vercel deployment fails**

**Why?** Environment variables not set on Vercel.

---

## Your API Key

```
GEMINI_API_KEY=AIzaSyDKKukoUyH5ob1BsAQxNSIhm2atlokj3JU
```

---

## 🚀 Solution (Do This Now)

### Step 1: Go to Vercel

Open: https://vercel.com/dashboard

### Step 2: Select Your Project

Click on **ZoyaAIassistant** project

### Step 3: Click Settings

Click **Settings** in the top menu

### Step 4: Click Environment Variables

On the left sidebar, click **Environment Variables**

### Step 5: Add GEMINI_API_KEY

- Click **Add** button
- **Name**: `GEMINI_API_KEY`
- **Value**: `AIzaSyDKKukoUyH5ob1BsAQxNSIhm2atlokj3JU`
- **Environments**: Check all three (Production, Preview, Development)
- Click **Add**

### Step 6: Add NODE_ENV

- Click **Add** button again
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environments**: Check Production only
- Click **Add**

### Step 7: Save and Redeploy

Vercel will automatically trigger a redeploy. Wait 2-3 minutes.

---

## ✅ Check It Works

When deployment finishes (green checkmark), visit your app:

- https://zoyaaiassistant.vercel.app (or your URL)
- Type a command
- It should work! 🎉

---

## In Summary

| Before              | After                   |
| ------------------- | ----------------------- |
| ❌ No env vars      | ✅ Env vars added       |
| ❌ Deployment fails | ✅ Deployment works     |
| ✅ Local works      | ✅ Local + Vercel works |

---

## Done! 🎉

Your app is now deployed and working!
