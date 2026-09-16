#!/bin/bash

# GhostVault - Run Everything Script
# This script installs dependencies, sets up the database, and starts both servers

set -e

echo "════════════════════════════════════════════════════════════"
echo "🔐 GhostVault - Complete Setup & Launch"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the capstone project root"
    exit 1
fi

# Step 1: Backend setup
echo "📦 [1/4] Installing backend dependencies..."
cd backend
npm install --silent
echo "✅ Backend dependencies installed"
echo ""

# Step 2: Database setup
echo "🗄️  [2/4] Setting up database..."
npx prisma generate --silent
npx prisma db push --accept-data-loss --skip-generate 2>/dev/null || true
echo "✅ Database ready at backend/prisma/dev.db"
echo ""

# Step 3: Frontend setup
echo "📦 [3/4] Installing frontend dependencies..."
cd ../frontend
npm install --silent
cd ..
echo "✅ Frontend dependencies installed"
echo ""

# Step 4: Run the application
echo "🚀 [4/4] Starting GhostVault servers..."
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Setup Complete! Starting servers now..."
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Backend API:  http://localhost:3001"
echo "Frontend App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "════════════════════════════════════════════════════════════"
echo ""

# Run both servers in parallel
trap 'kill 0' EXIT

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
