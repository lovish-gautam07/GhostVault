#!/bin/bash
set -e

echo "================================================"
echo "🔐 GhostVault - Complete Setup & Launch Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backend Dependencies
echo "📦 Step 1/5: Installing backend dependencies..."
cd backend
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Step 2: Generate Prisma Client
echo "🗄️  Step 2/5: Generating Prisma Client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 3: Create Database
echo "🗄️  Step 3/5: Creating SQLite database..."
npx prisma db push --accept-data-loss
echo -e "${GREEN}✅ Database created at backend/prisma/dev.db${NC}"
echo ""

# Step 4: Frontend Dependencies
echo "📦 Step 4/5: Installing frontend dependencies..."
cd ../frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

cd ..

# Step 5: Instructions
echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "🚀 To start GhostVault, open TWO terminal windows:"
echo ""
echo -e "${YELLOW}Terminal 1 - Backend API:${NC}"
echo "  cd $(pwd)"
echo "  npm run dev:backend"
echo ""
echo -e "${YELLOW}Terminal 2 - Frontend App:${NC}"
echo "  cd $(pwd)"
echo "  npm run dev:frontend"
echo ""
echo "Then open your browser to:"
echo -e "${GREEN}👉 http://localhost:3000${NC}"
echo ""
echo "================================================"
