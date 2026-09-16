# GhostVault — Production Deployment Guide

This guide outlines the production deployment workflows for **GhostVault**, including database provisioning, backend API hosting, Next.js frontend deployment, and production security checklists.

---

## 1. System Architecture

```
[ Beneficiary Browser ]  <-->  [ Next.js Frontend (Vercel / Edge) ]
        |                                       |
        | (Client-Side Decryption)              | (HTTPS REST / Bearer JWT)
        v                                       v
[ Client-Side AES-256-GCM ]             [ Node.js/Express API (Render / Docker) ]
                                                |
                                        +-------+-------+
                                        |               |
                                        v               v
                             [ PostgreSQL DB ]   [ SMTP Provider ]
```

---

## 2. Deployment Options

### Option A: Cloud PaaS (Recommended: Vercel + Render)

#### 1. Backend & Database on Render
1. Connect your repository to [Render](https://render.com).
2. Use the included `render.yaml` Blueprint, or create:
   - **PostgreSQL Database**:
     - Name: `ghostvault-db`
     - Database: `ghostvault`
     - User: `ghostvault_admin`
   - **Web Service**:
     - Root Directory: `backend`
     - Build Command: `npm install && npx prisma generate && npx prisma db push`
     - Start Command: `npm start`
     - Environment Variables:
       * `NODE_ENV`: `production`
       * `PORT`: `10000`
       * `DATABASE_URL`: *(Attached from PostgreSQL database)*
       * `JWT_SECRET`: *(Generate via `openssl rand -base64 32`)*
       * `FRONTEND_URL`: `https://your-frontend-app.vercel.app`
       * `SMTP_HOST`: `smtp.sendgrid.net` (or Resend / Postmark / SES)
       * `SMTP_PORT`: `587`
       * `SMTP_USER`: `apikey`
       * `SMTP_PASS`: `your_smtp_key`
       * `EMAIL_FROM`: `GhostVault Security <noreply@yourdomain.com>`

#### 2. Frontend on Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com/api`
5. Deploy.

---

### Option B: Full-Stack Docker / Self-Hosted

GhostVault includes production Dockerfiles and a `docker-compose.yml` for unified deployment on VPS (DigitalOcean, AWS EC2, Hetzner, Linode):

```bash
# 1. Clone repository
git clone <your-repo-url> ghostvault
cd ghostvault

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start full container stack
docker compose up -d --build
```

---

## 3. Database Provider Configuration

### Switching from SQLite to PostgreSQL
For high concurrency and data durability, switch `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run schema synchronization:
```bash
npx prisma generate
npx prisma db push
```

---

## 4. Production Security Checklist

- [x] **Client-Side Zero-Knowledge Encryption**: All sensitive payloads are encrypted with AES-256-GCM using Web Crypto API in the client's browser before transmission.
- [x] **High-Entropy JWT Secret**: Ensure `JWT_SECRET` is set to a secure, random string (min 32 characters). The backend strictly refuses to boot in `production` mode if missing.
- [x] **Rate Limiting**: Protects authentication endpoints (`/api/auth/login`, `/api/auth/signup`) against credential stuffing (30 reqs / 15 mins).
- [x] **Security Headers**: Powered by `helmet` with strict Content-Security-Policy (CSP), frameguard, and MIME sniffing protection.
- [x] **CORS Origin Whitelisting**: Strict origin matching matching `FRONTEND_URL`.
- [x] **Password Complexity**: Enforced on both frontend and backend (minimum 8 characters, uppercase, lowercase, and numeric digits).
- [x] **Log Sanitization**: Error middleware automatically suppresses database internals, stack traces, and credentials in production mode.
- [x] **TLS/HTTPS Termination**: Ensure all HTTP traffic is redirected to HTTPS at the CDN/load balancer level to protect WebCrypto key derivations and JWT transmission.
