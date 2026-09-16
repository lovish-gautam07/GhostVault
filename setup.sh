#!/bin/bash

echo "🔐 GhostVault - Setup & Run Script"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root"
    exit 1
fi

echo "📦 Step 1: Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

echo ""
echo "🗄️  Step 2: Setting up database..."
if [ ! -f "prisma/dev.db" ]; then
    echo "Creating SQLite database and generating Prisma client..."
    npx prisma db push
else
    echo "✅ Database already exists"
    npx prisma generate
fi

echo ""
echo "📦 Step 3: Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "To run the application:"
echo ""
echo "Terminal 1 (Backend - Port 3001):"
echo "  npm run dev:backend"
echo ""
echo "Terminal 2 (Frontend - Port 3000):"
echo "  npm run dev:frontend"
echo ""
echo "Then visit: http://localhost:3000"
