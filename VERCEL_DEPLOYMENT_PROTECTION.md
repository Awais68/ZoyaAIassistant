# Fix: Disable Vercel Deployment Protection

Your Vercel deployment is blocking API access because **Deployment Protection** is enabled.

## How to Fix (2 steps)

### Step 1: Go to Vercel Dashboard

1. Open your Vercel project: https://vercel.com/dashboard
2. Select your project: **ZoyaAIassistant**
3. Go to **Settings** → **Security**

### Step 2: Disable Deployment Protection

Look for **Deployment Protection** section and:

- Change from **Enabled** → **Disabled** (or set to **None**)
- Save changes

### Step 3: Redeploy (Optional)

Push a new commit to trigger redeployment:

```bash
git add -A
git commit -m "chore: deployment updates"
git push origin main
```

Or manually redeploy:

- Vercel Dashboard → Deployments → Latest → Redeploy

## After Disabling Protection

Your API will be accessible:

```bash
curl -X POST https://zoi-jqd3rotg5-hamzajiis-projects.vercel.app/api/commands/process \
  -H "Content-Type: application/json" \
  -d '{"input":"create a task to buy groceries","language":"en"}'
```

## What Commands Will Work

Once protection is disabled:

✅ **Voice/Text Commands** → API processes them
✅ **Task Creation** → Stored in MemStorage (ephemeral)
✅ **Calendar Checks** → Returns sample events
✅ **Email Checks** → Returns sample emails
✅ **All Fallback Features** → Work without Gemini API key

## To Make Tasks Persistent

Set `DATABASE_URL` environment variable in Vercel:

1. Settings → Environment Variables
2. Add: `DATABASE_URL` = your PostgreSQL connection string
3. (Get one from Neon, Vercel Postgres, or PlanetScale)
4. Redeploy

Then tasks will persist across requests.

---

**Time to fix:** ~30 seconds
