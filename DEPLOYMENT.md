# Zoya AI Assistant - Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
- GitHub repository connected to Vercel
- Environment variables configured in Vercel dashboard

### Environment Variables
Add these in your Vercel project settings:

```
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

### Build Configuration
The project is configured to build automatically on push to `main` branch.

**Build Command:** `npm run build`
**Output Directory:** `dist/public`
**Install Command:** `npm install`
**Node.js Version:** 20.19.3 (specified in `.nvmrc`)

### Important Notes

1. **Dependency Resolution**
   - Vite is pinned to `^6.0.0` for compatibility with `@tailwindcss/vite`
   - Using Tailwind CSS v3 (not v4) with PostCSS setup
   - The `@tailwindcss/vite` plugin has been removed (only needed for Tailwind v4)

2. **If you get peer dependency errors:**
   ```bash
   npm install --legacy-peer-deps
   ```
   
3. **Database**
   - This project uses SQLite which doesn't work on Vercel (serverless)
   - Consider switching to PostgreSQL with Neon/Vercel Postgres
   - Or use a different hosting platform that supports persistent storage

## 🔧 Troubleshooting

### Build Fails with Dependency Errors
1. Clear Vercel build cache in project settings
2. Ensure `package.json` has correct versions:
   - `vite: ^6.0.0`
   - NO `@tailwindcss/vite` in devDependencies

### TypeScript Errors
Run locally first:
```bash
npm run check
```

### Gemini API Issues
- Get your API key from: https://aistudio.google.com/apikey
- Add it to Vercel environment variables
- Redeploy after adding variables

## 📝 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 API Endpoints

- `POST /api/commands/process` - Process natural language commands
- `GET /api/dashboard` - Get dashboard data
- `GET /api/calendar/today` - Get today's events
- `GET /api/emails/unread` - Get unread emails
- `GET /api/tasks` - Get pending tasks

## 💡 Tips

1. **First Deployment**: May take 2-3 minutes
2. **Subsequent Deploys**: Usually under 1 minute
3. **Check Logs**: Use Vercel dashboard to see build/runtime logs
4. **Database Migration**: Consider Neon, PlanetScale, or Vercel Postgres for production

---

**Last Updated:** October 27, 2025
