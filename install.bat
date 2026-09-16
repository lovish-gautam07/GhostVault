@echo off
echo ================================================
echo GhostVault - Complete Setup Script
echo ================================================
echo.

REM Step 1: Backend Dependencies
echo Step 1/5: Installing backend dependencies...
cd backend
call npm install
echo Backend dependencies installed
echo.

REM Step 2: Generate Prisma Client
echo Step 2/5: Generating Prisma Client...
call npx prisma generate
echo Prisma Client generated
echo.

REM Step 3: Create Database
echo Step 3/5: Creating SQLite database...
call npx prisma db push --accept-data-loss
echo Database created
echo.

REM Step 4: Frontend Dependencies
echo Step 4/5: Installing frontend dependencies...
cd ..\frontend
call npm install
echo Frontend dependencies installed
echo.

cd ..

echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo To start GhostVault, open TWO command prompts:
echo.
echo Terminal 1 - Backend API:
echo   npm run dev:backend
echo.
echo Terminal 2 - Frontend App:
echo   npm run dev:frontend
echo.
echo Then open: http://localhost:3000
echo ================================================
pause
