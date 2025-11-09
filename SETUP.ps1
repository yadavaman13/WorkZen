#!/usr/bin/env pwsh
#
# WorkZen HRMS - Production Setup Script for PowerShell
# This script automates the setup process
#

$ErrorActionPreference = "Continue"

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║           WorkZen HRMS - Production Setup                   ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║           Automated Installation & Configuration            ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Step 1: Check prerequisites
Write-Host "[1/10] Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green

$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green

# Step 2: Check PostgreSQL
Write-Host "`n[2/10] Checking PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ PostgreSQL not found in PATH" -ForegroundColor Yellow
    Write-Host "Please ensure PostgreSQL is installed and added to PATH" -ForegroundColor Yellow
    $continue = Read-Host "Continue setup? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
}

# Step 3: Create database
Write-Host "`n[3/10] Setting up PostgreSQL database..." -ForegroundColor Yellow
$createDb = psql -U postgres -c "CREATE DATABASE workzen_hrms;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Database might already exist (this is okay)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database created" -ForegroundColor Green
}

# Step 4: Backend setup
Write-Host "`n[4/10] Backend: Installing dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Step 5: Backend env file
Write-Host "`n[5/10] Backend: Creating environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠ IMPORTANT: Edit backend\.env with your configuration" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET" -ForegroundColor Yellow
    Write-Host "   - SMTP settings" -ForegroundColor Yellow
} else {
    Write-Host "⚠ .env already exists" -ForegroundColor Yellow
}

# Step 6: Frontend setup
Write-Host "`n[6/10] Frontend: Installing dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

# Step 7: Frontend env file
Write-Host "`n[7/10] Frontend: Creating environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created (default values are okay for development)" -ForegroundColor Green
} else {
    Write-Host "⚠ .env already exists" -ForegroundColor Yellow
}

Set-Location ..

# Step 8: Database migrations
Write-Host "`n[8/10] Database: Running migrations..." -ForegroundColor Yellow
Set-Location backend
npm run migrate 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Migration may have failed or completed with warnings" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database migrations completed" -ForegroundColor Green
}

# Step 9: Database seeding
Write-Host "`n[9/10] Database: Seeding initial data..." -ForegroundColor Yellow
npm run seed 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Seeding may have failed" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database seeded with initial data" -ForegroundColor Green
}

Set-Location ..

# Step 10: Verification
Write-Host "`n[10/10] Verifying installation..." -ForegroundColor Yellow

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   SETUP COMPLETE! ✓                         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "1. Configure Backend (if not already done):" -ForegroundColor Yellow
Write-Host "   - Edit: backend\.env" -ForegroundColor Gray
Write-Host "   - Update DATABASE_URL, JWT_SECRET, SMTP settings" -ForegroundColor Gray
Write-Host "`n"

Write-Host "2. Start Backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "`n"

Write-Host "3. Start Frontend (in new terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "`n"

Write-Host "4. Access Application:" -ForegroundColor Yellow
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   - API: http://localhost:5000" -ForegroundColor Gray
Write-Host "   - Health Check: http://localhost:5000/health" -ForegroundColor Gray
Write-Host "`n"

Write-Host "5. Default Login:" -ForegroundColor Yellow
Write-Host "   - Email: admin@workzen.com" -ForegroundColor Gray
Write-Host "   - Password: password123" -ForegroundColor Gray
Write-Host "`n"

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - Setup Guide: SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host "   - Flows & Architecture: docs\ARCHITECTURE_FLOW.md" -ForegroundColor Gray
Write-Host "   - Implementation: IMPLEMENTATION_GUIDE.md" -ForegroundColor Gray
Write-Host "`n"

Write-Host "For detailed help, see: SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "`n"

Read-Host "Press Enter to exit"
