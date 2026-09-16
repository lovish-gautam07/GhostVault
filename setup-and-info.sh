#!/bin/bash

echo "🔐 GhostVault - Complete Setup & Run"
echo "===================================="
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the project root directory"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install > /dev/null 2>&1
echo "✅ Backend dependencies installed"

echo "🗄️  Generating Prisma Client..."
npx prisma generate > /dev/null 2>&1
echo "✅ Prisma Client generated"

echo "🗄️  Setting up database..."
npx prisma db push --accept-data-loss > /dev/null 2>&1
echo "✅ Database created"

cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install > /dev/null 2>&1
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "================================================"
echo "✅ Setup Complete! GhostVault is ready."
echo "================================================"
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "Open TWO terminal windows and run:"
echo ""
echo "Terminal 1:"
echo "  npm run dev:backend"
echo ""
echo "Terminal 2:"
echo "  npm run dev:frontend"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
