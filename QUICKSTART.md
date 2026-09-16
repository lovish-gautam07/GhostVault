# 🚀 GhostVault - Quick Start Guide

## Step 1: Install Backend Dependencies & Setup Database

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
cd ..
```

This will:
- Install all backend Node.js dependencies (Express, Prisma, bcrypt, JWT, etc.)
- Generate the Prisma client from the schema
- Create the SQLite database file (`backend/prisma/dev.db`)

## Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

This installs Next.js, React, Tailwind CSS, and TypeScript dependencies.

## Step 3: Run the Application

Open **two terminal windows**:

### Terminal 1 - Backend (Port 3001)
```bash
npm run dev:backend
```

You should see:
```
🚀 GhostVault API running on http://localhost:3001
Environment: development
⏰ Initializing cron jobs...
✅ Inactivity check job scheduled: 0 0 * * *
✅ Check-in reminder job scheduled: 0 9 * * *
✨ All cron jobs initialized successfully
```

### Terminal 2 - Frontend (Port 3000)
```bash
npm run dev:frontend
```

You should see:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Ready in 2.5s
```

## Step 4: Open the Application

Visit: **http://localhost:3000**

You'll see the GhostVault landing page with:
- Feature showcase
- "Get Started" and "Sign In" buttons

## Step 5: Create an Account

1. Click **"Get Started"** or navigate to http://localhost:3000/signup
2. Fill in:
   - **Full Name**: Your name
   - **Email**: your@email.com
   - **Master Password**: Choose a strong password (min 8 characters)
   - **Confirm Password**: Re-enter password
   - **Password Hint** (optional): A hint to help remember your password
3. Click **"Create Account"**

You'll be automatically logged in and redirected to the dashboard.

## Step 6: Explore the Dashboard

On the dashboard (http://localhost:3000/dashboard), you can:

### A. Check-In Status Card
- View your last check-in timestamp
- See days since last check-in
- See countdown to next release tier
- Click **"I am Alive (Check In)"** to reset the dead man's timer

### B. Trusted Emergency Contacts
- Click **"+ Add Contact"**
- Enter name and email of emergency contact
- Save contact

### C. Encrypted Vault Items
- Click **"+ Add Item"**
- Choose item type: Note, Password, or Document
- Enter title (e.g., "Bank Account Password")
- Enter content in the textarea (this will be encrypted client-side)
- Set release tier (e.g., 7 days, 30 days)
- Assign to one or more emergency contacts
- Click **"Save Encrypted Item"**
- The data is encrypted in your browser with AES-256-GCM before being sent to the server

### D. View Encrypted Items
- Your vault items are listed (encrypted)
- Click **"🔓 Decrypt & View"** to decrypt an item client-side
- Click **"🔒 Hide"** to hide the decrypted content
- Click **"Delete"** to permanently remove an item

## Testing the Dead Man's Switch

To test the release mechanism:

1. **Create a test vault item** with a 7-day release tier assigned to a contact
2. **Simulate inactivity**: Manually update the database to set `lastCheckinAt` to 8 days ago
3. **Trigger the cron job**: Run the inactivity check manually or wait for the scheduled run
4. **Check email**: The emergency contact should receive an email with the encrypted item

### Manual Database Update (for testing):
```bash
cd backend
npx prisma studio
```
This opens Prisma Studio in your browser where you can edit the User's `lastCheckinAt` field.

## Running Tests

```bash
npm run test:backend
```

This runs the Jest test suite covering:
- ✅ Authentication (password hashing, JWT)
- ✅ Vault operations (CRUD, encryption)
- ✅ Check-in system (activity tracking)
- ✅ Release integration (full dead man's switch flow)

## Environment Variables

Backend (`.env`):
- `PORT`: API server port (default: 3001)
- `DATABASE_URL`: SQLite file path (default: file:./dev.db)
- `JWT_SECRET`: Secret for JWT signing
- `SMTP_*`: Email configuration (uses Ethereal test account in dev)

Frontend (`.env.local`):
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001/api)

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify `backend/prisma/dev.db` was created
- Run `npx prisma generate` in backend folder

### Frontend won't start
- Check if port 3000 is available
- Verify `node_modules` is installed
- Clear `.next` folder: `rm -rf frontend/.next`

### Can't decrypt vault items
- Master password is stored in sessionStorage during login
- If you refresh or clear storage, you need to log in again
- The server cannot decrypt your data (it only has ciphertext)

## Next Steps

- Add more vault items with different release tiers
- Test the check-in functionality
- Explore the email templates (check console for Ethereal preview URLs)
- Review the test suite to understand the system's guarantees
