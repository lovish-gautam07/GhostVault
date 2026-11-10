# GhostVault 🔐

An encrypted digital legacy and emergency access manager with a dead man's switch system.

## Overview

GhostVault lets users securely store sensitive information (passwords, documents, personal messages) that automatically releases to chosen emergency contacts if the user goes inactive for a set period of time.

## Core Features

- **End-to-End Encryption**: Data is encrypted client-side using AES-256-GCM with PBKDF2 key derivation before being uploaded to the server. The server never sees your plaintext data or master passwords.
- **Dead Man's Switch**: Configurable inactivity timers (release tiers: 7, 30, 90 days, etc.) that automatically trigger item releases to trusted emergency contacts.
- **Check-In System**: Manual check-in button on the dashboard or automated email links to prove you're active and reset the dead man's switch timer.
- **Trusted Contacts**: Assign specific vault items to designated emergency contacts.
- **Tiered Access Rules**: Different release timeframes for different vault items (e.g., immediate passwords after 7 days, legacy messages after 30 days).
- **Scheduled Background Jobs**: Node-cron jobs running daily to monitor inactivity, send check-in reminders, and trigger emergency releases.
- **Email Notifications**: Automated check-in reminders and emergency access links sent via Nodemailer.

## AI Features (Google Gemini)

All AI runs **server-side**; the Gemini API key never reaches the browser. Every feature is privacy-first and has an **offline fallback**, so the app keeps working without a key.

| Feature | Where | What is sent to the AI |
|---|---|---|
| **Ghost — AI Chat Assistant** | Floating chat bubble on every page | Only the chat messages (users are warned never to paste secrets) |
| **AI Legacy Letter Writer** | *Add Item → Note → AI Letter Writer* | Only the rough notes the user explicitly chooses to send; the final letter is AES-256-GCM encrypted in the browser before storage |
| **AI Security Advisor** | Dashboard → *AI Security Tools* | Only anonymous counts (items, contacts, thresholds, days since check-in), never titles, emails or ciphertext |
| **Password Strength Checker** | Dashboard → *AI Security Tools* | The password is analysed **locally**; only derived features (length, character classes, patterns) are sent for coaching tips |

API endpoints (`/api/ai/*`): `GET status`, `POST chat`, `POST letter` (auth), `GET advisor` (auth), `POST password-tips`. All inputs are validated with strict Zod schemas and rate-limited (40 requests / 15 min per IP).

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini (REST API, server-side only) with offline fallbacks
- **Security**: AES-256-GCM (Web Crypto API), bcrypt password hashing, JWT authentication
- **Email**: Nodemailer (Ethereal for dev/testing, SMTP for prod)
- **Scheduler**: node-cron for background jobs
- **Testing**: Jest with ECMAScript modules support

## Project Architecture

```
ghostvault/
├── backend/                  # Express API server
│   ├── src/
│   │   ├── index.js          # Express app entrypoint & cron initialization
│   │   ├── routes/           # API routes (auth, vault, contacts, checkin, releases, ai)
│   │   ├── middleware/       # Auth (JWT) & error handling middleware
│   │   ├── services/         # Business logic (vault, contacts, checkin, email, ai)
│   │   ├── utils/            # Auth helpers (bcrypt, JWT)
│   │   └── jobs/             # node-cron scheduler for inactivity & reminders
│   ├── prisma/
│   │   └── schema.prisma     # Prisma database schema
│   ├── tests/                # Jest tests (auth, vault, checkin, release integration)
│   └── .env.example          # Environment variables template
├── frontend/                 # Next.js frontend application
│   ├── app/                  # Next.js 16 App Router pages (landing, login, signup, dashboard)
│   ├── components/           # React components (Navbar, CheckInCard, ContactsList, VaultItemList, AddVaultItemModal, ChatWidget, AiToolsPanel, LetterWriter)
│   ├── lib/                  # API client, Web Crypto AES-256-GCM encryption, local password analysis
│   └── tailwind.config.js    # Tailwind CSS configuration
├── shared/                   # Shared TypeScript types & encryption helpers
├── PROGRESS.md               # Progress tracking log
└── README.md                 # Project documentation
```

## Quick Start / Local Development

### 1. Prerequisites

- Node.js 18+ and npm

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Setup Database (Backend)

```bash
cd backend

# Copy environment template
cp .env.example .env

# (Optional) enable live AI: add your free Gemini key from https://aistudio.google.com/apikey
# to backend/.env  ->  GEMINI_API_KEY=your_key_here
# Never put this key in the frontend or commit it. .env is gitignored.

# Generate Prisma client and create SQLite database
npx prisma db push
# or: npx prisma generate

cd ..
```

### 4. Run the Development Servers

```bash
# Terminal 1: Backend API (runs on port 3001)
npm run dev:backend

# Terminal 2: Frontend App (runs on port 3000)
npm run dev:frontend
```

Visit [http://localhost:3000](http://localhost:3000) to open GhostVault.

## Running Tests

GhostVault includes 6 automated unit and integration test suites (37 tests total):

- **Authentication tests (`auth.test.js`)**: Bcrypt password hashing (12 rounds), salt randomness, JWT generation & tampering rejection
- **Vault tests (`vault.test.js`)**: Encrypted CRUD operations, unauthorized access and deletion prevention across tenant boundaries
- **Check-in tests (`checkin.test.js`)**: Manual pulse check-ins, inactivity calculation, risk evaluation, and dead man's switch status
- **Release integration tests (`release.integration.test.js`)**: Full end-to-end trigger flow: inactive user detection → missed check-in simulation → release trigger verification & email dispatch
- **AI tests (`ai.test.js`)**: Offline fallbacks, API key sent only in headers (never in URLs or logs), advisor scoring rules, letter and password-tip fallbacks
- **Security tests (`security.test.js`)**: Zero-knowledge ciphertext storage validation, bcrypt work factor verification, and public release data shielding (no password hash exposure)

```bash
# Run all backend tests
npm run test:backend

# Or from backend directory
cd backend
npm test
```

## How the Dead Man's Switch Works

1. **User Active**: The user logs in and clicks the **"I am Alive (Check In)"** button periodically.
2. **Timer Reset**: Checking in updates the `lastCheckinAt` timestamp in the database and records a `CheckIn` entry.
3. **Approaching Inactivity**: The daily cron job checks if a user is within 3 days of their shortest release tier and sends an email reminder.
4. **Triggering Release**: If `daysSinceLastCheckin >= releaseTier`, the daily scheduler:
   - Identifies all assigned emergency contacts for eligible vault items.
   - Creates a `Release` entry with `status: "sent"`.
   - Sends an emergency access email to the contact with item details and secure access link.
   - Prevents duplicate releases for already-dispatched items.

## Security Architecture

- **Zero-Knowledge Client-Side Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations, using the master password and user email as salt (Web Crypto API).
- **Client-Side Encryption**: AES-256-GCM with a cryptographically secure random 12-byte IV generated per item before transmission.
- **Zero-Knowledge Storage**: The backend and database strictly store base64 ciphertext and IV. Plaintext data and master keys never touch the network or server disk.
- **Emergency Beneficiary Access**: Dedicated beneficiary portal (`/emergency-access/[id]`) allowing authorized contacts to decrypt released ciphertext locally in-browser using recovery hints.
- **Server Authentication**: Master passwords hashed using bcrypt with 12 salt rounds.
- **Input Validation & Sanitization**: Zod schema validation enforcing RFC 5322 email formatting and password complexity (uppercase, lowercase, digits).
- **Defense in Depth**: Helmet.js security headers (strict CSP, HSTS, frameguard), CORS origin controls, and rate limiting against brute-force attacks (30 reqs/15m on auth, 300 reqs/15m globally).
- **Production Error Sanitization**: Centralized error middleware suppresses stack traces, SQL internals, and credential leakage.
- **JWT Hardening**: Tokens are signed and verified with a pinned `HS256` algorithm; production refuses to start with a missing or short (< 32 chars) `JWT_SECRET`.
- **AI Safety**: Gemini key stays server-side (sent via header, never in URLs/logs), strict Zod schemas (the password-tips endpoint rejects any unexpected field, so a raw password can't be sent), per-IP AI rate limiting, sanitized upstream errors.
- **Proxy-Aware Rate Limiting**: `trust proxy` is enabled in production so limits apply per real client IP behind Render's proxy.
- **Frontend Security Headers**: `X-Frame-Options: DENY`, `nosniff`, strict `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Dependency Hygiene**: `npm audit --omit=dev` reports **0 vulnerabilities** (Next.js 16, bcrypt 6, zod 4, nodemailer 10, node-cron 4).
- **No Hardcoded Secrets**: `docker-compose.yml` reads `POSTGRES_PASSWORD`, `JWT_SECRET` and `GEMINI_API_KEY` from environment / `.env`.

## Deployment & Production

GhostVault is ready for zero-downtime production deployment across cloud PaaS and self-hosted container environments:
- **Cloud PaaS**: Next.js frontend on [Vercel](https://vercel.com), Node.js Express API and PostgreSQL on [Render](https://render.com) (using `render.yaml`).
- **Docker / Self-Hosted**: Multi-stage `Dockerfile` configurations and `docker-compose.yml` for unified VPS deployment (DigitalOcean, AWS EC2, Hetzner).
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.
- **AI in production**: add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-3.1-flash-lite`) as a secret environment variable on the API service in the Render dashboard.

## License

MIT
