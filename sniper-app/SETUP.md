# IndiaMART Sniper - Setup Guide

## Quick Setup Checklist

### 1. Dependencies Installation ✅
Run in the project directory:
```bash
npm install
```

### 2. Environment Variables ✅
Copy the example file:
```bash
cp .env.example .env
```

### 3. Free API Keys Setup 🔑

#### A. Hugging Face (Required for AI Analysis)
1. Go to: https://huggingface.co/join
2. Click profile → Settings → Access Tokens
3. Create new token
4. Copy and add to `.env`:
   ```
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
   ```

#### B. ExchangeRate API (Required for Currency)
1. Go to: https://www.exchangerate-api.com/
2. Click "Get Free Key"
3. Sign up with email
4. Copy API key and add to `.env`:
   ```
   EXCHANGE_RATE_API_KEY=xxxxxxxxxxxxx
   ```

#### C. Vapi.ai (Optional for Voice Calls)
1. Go to: https://vapi.ai/
2. Sign up for free trial ($10 credit)
3. Get API key from dashboard
4. Add to `.env`:
   ```
   VAPI_API_KEY=xxxxxxxxxxxxx
   ```

**Alternative**: Use Retell AI or Twilio (similar free trials)

#### D. SendGrid (Optional for Emails)
1. Go to: https://sendgrid.com/
2. Sign up (free 100 emails/day)
3. Create API key in Settings
4. Add to `.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### 4. Run Development Server 🚀
```bash
npm run dev
```

Visit: http://localhost:3000

## Demo Mode

The app works in **DEMO MODE** without any API keys! It uses:
- Mock vendor data
- Simulated voice call transcripts
- Approximate currency conversions
- Fake email confirmations

Perfect for:
- Testing the UI/UX
- Hackathon demos
- Understanding the workflow

## Production Mode

Once you add API keys, the app automatically switches to **PRODUCTION MODE** with:
- Real vendor scraping
- Live currency rates
- Actual voice calls
- Real email delivery

## Troubleshooting

### Port Already in Use
```bash
# Kill the process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Delete .next cache
rm -rf .next
npm run dev
```

## Project Structure Overview

```
HACKATHON/
├── app/
│   ├── api/           → Backend API routes
│   ├── dashboard/     → Main app interface
│   └── globals.css    → Global styles
├── components/        → React components
├── store/            → State management
├── lib/              → Utility functions
└── .env              → Your API keys (create this!)
```

## Features Without API Keys

✅ Complete UI/UX journey
✅ Animated workflow steps
✅ Mock vendor results
✅ Decision matrix visualization
✅ Steam Deal certificate
✅ Responsive design

## Features With API Keys

✅ Everything above, PLUS:
✅ Real vendor data from platforms
✅ Live currency conversion
✅ AI-powered vendor analysis
✅ Actual voice negotiations
✅ Email distribution

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env` file from `.env.example`
3. ⚠️ Add at least 2 API keys (Hugging Face + ExchangeRate)
4. ✅ Run: `npm run dev`
5. 🎉 Test the app at http://localhost:3000

## Need Help?

Check `README.md` for detailed documentation!
