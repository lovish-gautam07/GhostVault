# 🚀 SETUP & RUN GHOSTVAULT

## The Issue
The white screen was caused by:
1. React 19 (which isn't stable yet in 2026)
2. Google Fonts blocking in layout.tsx

## ✅ Fixed Now

I've updated:
- React 19 → React 18 (stable)
- Next.js 15 → Next.js 14 (stable)
- Removed Google Fonts import (using system fonts)

## 🔧 How to Run Now

### Step 1: Install Dependencies

```bash
cd /Users/lovishgautam.07/Desktop/capstone

# Install backend
cd backend
npm install

# Install frontend  
cd ../frontend
npm install
cd ..
```

### Step 2: Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

### Step 3: Start Servers (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/lovishgautam.07/Desktop/capstone
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
cd /Users/lovishgautam.07/Desktop/capstone
npm run dev:frontend
```

### Step 4: Open Browser

Go to: **http://localhost:3000**

---

## If you see "command not found" errors:

Make sure you're running from the project root and the packages are installed.

Run this to check:
```bash
ls -la backend/node_modules frontend/node_modules
```

If empty, the npm install commands need to complete successfully first.
