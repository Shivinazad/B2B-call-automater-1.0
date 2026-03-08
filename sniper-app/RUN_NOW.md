# ⚡ RUN RIGHT NOW - 3 MINUTE SETUP

## 🔴 IMMEDIATE FIX for npm install error:

```bash
cd /Users/shivin/Documents/HACKATHON
npm install --legacy-peer-deps --force
```

The error is a peer dependency conflict between `nodemailer` and `next-auth`. Using `--legacy-peer-deps` will fix it.

---

## ✅ MINIMAL SETUP TO RUN NOW (3 minutes)

### Step 1: Fix Dependencies (1 minute)
```bash
npm install --legacy-peer-deps --force
```

### Step 2: Add These 3 Environment Variables to .env.local

#### Required #1: NextAuth Secret
```bash
NEXTAUTH_SECRET="your-secret-here-change-this-123456789"
NEXTAUTH_URL="http://localhost:3002"
```

#### Required #2: Google Gemini API (FREE - takes 30 seconds)
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy and paste below:
```bash
GOOGLE_GEMINI_API_KEY="your-key-here"
```

#### Required #3: Database URL (Choose one)

**Option A: Use SQLite for Testing (No signup needed)**
```bash
DATABASE_URL="file:./dev.db"
```

**Option B: Vercel Postgres (Free, but requires signup)**
1. Go to: https://vercel.com/dashboard
2. New Project → Storage → Postgres
3. Copy DATABASE_URL

### Step 3: Setup Database
```bash
npx prisma generate
npx prisma db push
```

### Step 4: RUN!
```bash
npm run dev
```

Visit: http://localhost:3002

---

## 🎯 OPTIONAL: Add Google OAuth (5 minutes)

For now, you can **skip this** - the app will work without it.

When ready:
1. https://console.cloud.google.com
2. Create OAuth Client ID
3. Redirect URI: `http://localhost:3002/api/auth/callback/google`
4. Add to .env.local:
```bash
GOOGLE_CLIENT_ID="your-id"
GOOGLE_CLIENT_SECRET="your-secret"
```

---

## 🚨 IF DATABASE SETUP FAILS

Just use SQLite for now (no signup needed):

1. Open `.env.local`
2. Change the DATABASE_URL line to:
```bash
DATABASE_URL="file:./dev.db"
```

3. Also update `prisma/schema.prisma` datasource:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

4. Run:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

---

## 📋 WHAT YOU'LL BE ABLE TO DO:

✅ Scrape 10 B2B platforms  
✅ AI vendor analysis with Google Gemini  
✅ See the beautiful UI  
✅ Test the workflow  

❌ Authentication (needs Google OAuth setup - optional)  
❌ Real voice calls (needs Vapi.ai API key - optional)  
❌ Email sending (needs SendGrid - optional)  

---

## 🎉 QUICK START COMMANDS (Copy-Paste)

```bash
# 1. Fix npm install error
npm install --legacy-peer-deps --force

# 2. Generate Prisma client
npx prisma generate

# 3. Setup database (use SQLite for quick test)
npx prisma db push

# 4. RUN!
npm run dev
```

Then open: http://localhost:3002

---

## 🔧 TROUBLESHOOTING

**Error: "NEXTAUTH_SECRET is not set"**
→ Add `NEXTAUTH_SECRET="any-random-string-here"` to .env.local

**Error: "DATABASE_URL is not set"**
→ Add `DATABASE_URL="file:./dev.db"` to .env.local (for SQLite)

**Error: "GOOGLE_GEMINI_API_KEY is not set"**
→ Get free key: https://aistudio.google.com/app/apikey

**Port 3002 already in use?**
→ Run: `lsof -ti:3002 | xargs kill -9`
→ Then: `npm run dev`
