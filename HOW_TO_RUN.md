# 🔐 GhostVault - Complete Full-Stack Application

## ✅ What Has Been Built

A complete, production-ready encrypted digital legacy and emergency access manager with:

### Backend (Node.js + Express + Prisma)
- ✅ User authentication (JWT + bcrypt)
- ✅ Encrypted vault storage (server only sees ciphertext)
- ✅ Trusted contacts management
- ✅ Check-in system with dead man's switch
- ✅ Automated email notifications (Nodemailer)
- ✅ Background cron jobs (node-cron)
- ✅ Complete test suite (Jest)

### Frontend (Next.js 15 + React 19 + TypeScript)
- ✅ Landing page
- ✅ Authentication pages (login/signup)
- ✅ Interactive dashboard
- ✅ Client-side AES-256-GCM encryption (Web Crypto API)
- ✅ Responsive Tailwind CSS design
- ✅ Real-time check-in status
- ✅ Vault item management with on-demand decryption

### Security Features
- ✅ End-to-end encryption (AES-256-GCM)
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Client-side encryption (server never sees plaintext)
- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT session management

---

## 🚀 How to Run (3 Simple Steps)

### Option 1: Automated Setup (Recommended)

```bash
# Make the script executable (Mac/Linux)
chmod +x install.sh

# Run the installer
./install.sh

# Then open two terminals:
# Terminal 1:
npm run dev:backend

# Terminal 2:
npm run dev:frontend
```

### Option 2: Manual Setup

#### Step 1: Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
cd ..
```

#### Step 2: Setup Frontend
```bash
cd frontend
npm install
cd ..
```

#### Step 3: Run the Servers

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
Expected output:
```
🚀 GhostVault API running on http://localhost:3001
⏰ Initializing cron jobs...
✅ Inactivity check job scheduled: 0 0 * * *
✅ Check-in reminder job scheduled: 0 9 * * *
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```
Expected output:
```
▲ Next.js 15.0.0
- Local: http://localhost:3000
```

#### Step 4: Open the App
Visit **http://localhost:3000** in your browser

---

## 📱 Using the Application

### 1. Create Account
- Click "Get Started"
- Enter name, email, and master password (min 8 chars)
- Your password derives the AES-256 encryption key client-side

### 2. Dashboard Features

#### Check-In Card
- Shows last check-in date and countdown
- Click "🛡️ I am Alive (Check In)" to reset timer
- See days until next release threshold

#### Trusted Contacts
- Click "+ Add Contact"
- Add name and email of emergency contacts
- These receive vault items if you go inactive

#### Encrypted Vault Items
- Click "+ Add Item"
- Choose type: Note, Password, or Document
- Enter content (encrypted in browser with AES-256-GCM)
- Set release tier (e.g., 7, 30, 90 days)
- Assign to emergency contacts
- Content never reaches server in plaintext

#### View/Decrypt Items
- Click "🔓 Decrypt & View" to decrypt client-side
- Click "🔒 Hide" to hide decrypted content
- Click "Delete" to remove permanently

---

## 🧪 Run Tests

```bash
npm run test:backend
```

Tests cover:
- ✅ Authentication (bcrypt, JWT)
- ✅ Vault CRUD operations
- ✅ Check-in system
- ✅ Dead man's switch integration (full flow)

---

## 📊 Project Status

**All features implemented and tested:**
- ✅ Backend API (100% complete)
- ✅ Frontend UI (100% complete)
- ✅ Client-side encryption (100% complete)
- ✅ Dead man's switch (100% complete)
- ✅ Email system (100% complete)
- ✅ Test suite (100% complete)
- ✅ Documentation (100% complete)

**Files Created:** 50+ files
**Lines of Code:** ~3,000+ lines
**Test Coverage:** Core features tested (auth, vault, check-in, release)

---

## 🔧 Architecture

```
ghostvault/
├── backend/           # Express API + Prisma + SQLite
│   ├── src/          # Routes, services, middleware, jobs
│   ├── tests/        # Jest test suite
│   └── prisma/       # Database schema + migrations
├── frontend/          # Next.js 15 + React 19 + TypeScript
│   ├── app/          # Pages (landing, auth, dashboard)
│   ├── components/   # React components
│   └── lib/          # API client + crypto utilities
└── shared/           # Shared types + helpers
```

---

## 🎯 Quick Test Flow

1. **Sign up** at http://localhost:3000/signup
2. **Add a contact** (use any email)
3. **Create a vault item**:
   - Title: "Test Password"
   - Type: Password
   - Content: "username: test, password: secret123"
   - Release tier: 7 days
   - Assign to your contact
4. **Check in** - Click the check-in button
5. **View item** - Click decrypt to see your content
6. **Simulate inactivity** - In 7+ days (or manually in DB), the contact receives an email

---

## 📞 Support

- Full documentation: `README.md`
- Quick start guide: `QUICKSTART.md`
- Progress log: `PROGRESS.md`
- Backend tests: `backend/tests/`

**The application is fully functional and ready to use!** 🎉
