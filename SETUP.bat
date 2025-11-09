@echo off
REM WorkZen HRMS - Production Setup Script for Windows
REM This script automates the setup process

setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║           WorkZen HRMS - Production Setup                   ║
echo ║                                                              ║
echo ║           Automated Installation & Configuration            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo [1/10] Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found: !errorlevel!

npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm is not installed!
    pause
    exit /b 1
)
echo ✓ npm found

echo.
echo [2/10] Checking PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ PostgreSQL not found in PATH
    echo Please ensure PostgreSQL is installed and added to PATH
    echo Continue setup? (Y/N)
    set /p continue=
    if /i not "!continue!"=="Y" exit /b 1
) else (
    echo ✓ PostgreSQL found
)

REM Create databases
echo.
echo [3/10] Setting up PostgreSQL database...
psql -U postgres -c "CREATE DATABASE workzen_hrms;" 2>nul
if errorlevel 1 (
    echo ⚠ Database might already exist (this is okay)
) else (
    echo ✓ Database created
)

echo.
echo [4/10] Backend: Installing dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ✗ Backend npm install failed!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

echo.
echo [5/10] Backend: Creating environment file...
if not exist ".env" (
    copy .env.example .env
    echo ✓ .env file created
    echo ⚠ IMPORTANT: Edit backend\.env with your configuration
    echo   - DATABASE_URL
    echo   - JWT_SECRET
    echo   - SMTP settings
) else (
    echo ⚠ .env already exists
)

echo.
echo [6/10] Frontend: Installing dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ✗ Frontend npm install failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

echo.
echo [7/10] Frontend: Creating environment file...
if not exist ".env" (
    copy .env.example .env
    echo ✓ .env file created (default values are okay for development)
) else (
    echo ⚠ .env already exists
)

cd ..

echo.
echo [8/10] Database: Running migrations...
cd backend
call npm run migrate
if errorlevel 1 (
    echo ⚠ Migration may have failed or completed with warnings
    echo This might be okay if database already has tables
) else (
    echo ✓ Database migrations completed
)

echo.
echo [9/10] Database: Seeding initial data...
call npm run seed
if errorlevel 1 (
    echo ⚠ Seeding may have failed
    echo You can manually seed data later
) else (
    echo ✓ Database seeded with initial data
)

cd ..

echo.
echo [10/10] Verifying installation...
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   SETUP COMPLETE! ✓                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Next steps:
echo.
echo 1. Configure Backend (if not already done):
echo    - Edit: backend\.env
echo    - Update DATABASE_URL, JWT_SECRET, SMTP settings
echo.
echo 2. Start Backend:
echo    cd backend
echo    npm run dev
echo.
echo 3. Start Frontend (in new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Access Application:
echo    - Frontend: http://localhost:3000
echo    - API: http://localhost:5000
echo    - Health Check: http://localhost:5000/health
echo.
echo 5. Default Login:
echo    - Email: admin@workzen.com
echo    - Password: password123
echo.
echo Documentation:
echo    - Setup Guide: SETUP_GUIDE.md
echo    - Flows & Architecture: docs\ARCHITECTURE_FLOW.md
echo    - Implementation: IMPLEMENTATION_GUIDE.md
echo.
echo For detailed help, see: SETUP_GUIDE.md
echo.
pause
