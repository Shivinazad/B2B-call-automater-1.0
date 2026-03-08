#!/bin/bash

# 🚀 ONE-COMMAND STARTUP SCRIPT
# This will get your app running in 2 minutes

set -e

echo "🚀 IndiaMART Sniper - Quick Start"
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take 2-3 minutes)..."
    npm install --legacy-peer-deps --force
    echo "✅ Dependencies installed!"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please make sure .env.local exists in the project root"
    exit 1
fi

# Check for required env vars
if ! grep -q "NEXTAUTH_SECRET=\"hackathon-demo-secret" .env.local; then
    echo "⚠️  Warning: NEXTAUTH_SECRET might not be set properly"
    echo "Check .env.local file"
fi

if ! grep -q "DATABASE_URL=\"file:./dev.db\"" .env.local; then
    echo "⚠️  Warning: DATABASE_URL might not be set to SQLite"
    echo "Using SQLite for quick start. Check .env.local if you want PostgreSQL"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate || {
    echo "❌ Prisma generate failed. This might be okay if Prisma isn't needed yet."
}
echo ""

# Setup database
echo "🗄️  Setting up database..."
npx prisma db push --skip-generate 2>/dev/null || {
    echo "⚠️  Database setup skipped (might fail without proper config)"
    echo "You can run 'npx prisma db push' manually later"
}
echo ""

echo "✅ SETUP COMPLETE!"
echo ""
echo "=================================="
echo "🎯 STARTING DEVELOPMENT SERVER..."
echo "=================================="
echo ""
echo "Your app will be available at: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dev server
npm run dev
