# OTP Email Verification - Testing Guide

## 🚀 System Overview

This WorkZen HRMS implementation uses **OTP-based email verification** for user registration with Resend.com email service.

### Flow
1. User registers → Account created with `status='pending'`
2. OTP sent to email → 6-digit code (10-minute expiry)
3. User verifies OTP → Account activated (`status='active'`)
4. Welcome email sent → User logged in

---

## 📋 Prerequisites

### Database
- PostgreSQL with `email_otps` table and `users.status` column
- Migration already run: ✅ `migrations/002_create_email_otps.sql`

### Environment Variables
```env
# Resend Email Service
RESEND_API_KEY=re_Ezyp8u2Q_BoE72X7VhbTMo9pejB2boEdK
FROM_EMAIL=onboarding@resend.dev

# Database
DATABASE_URL=your_postgres_connection_string

# JWT
JWT_SECRET=your_secret_key

# Frontend URL (for welcome email)
FRONTEND_URL=http://localhost:5173
```

### Important Limitation
⚠️ **Testing Domain Restriction**: With `onboarding@resend.dev`, emails can **only** be sent to:
- **yadavaman1948@gmail.com** (registered Resend email)

For production:
1. Verify a custom domain at https://resend.com/domains
2. Update `FROM_EMAIL` to use your domain (e.g., `noreply@yourdomain.com`)

---

## 🧪 API Testing

### 1. Register New User (Sends OTP)
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "companyName": "Test Company",
  "name": "Aman Yadav",
  "email": "yadavaman1948@gmail.com",
  "phone": "9876543210",
  "password": "test1234"
}
```

**Expected Response:**
```json
{
  "msg": "Registration successful! Please check your email for the verification code.",
  "email": "yadavaman1948@gmail.com"
}
```

**Check Database:**
```sql
-- User should be pending
SELECT id, name, email, status FROM users WHERE email = 'yadavaman1948@gmail.com';
-- status should be 'pending'

-- OTP should be created
SELECT id, email, used, attempts, expires_at FROM email_otps WHERE email = 'yadavaman1948@gmail.com';
-- used should be false, expires_at should be ~10 minutes from now
```

**Check Email:**
- Go to yadavaman1948@gmail.com inbox
- Look for email with subject: "Verify Your Email - WorkZen HRMS"
- Note the 6-digit OTP code

---

### 2. Verify OTP (Activate Account)
```bash
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "yadavaman1948@gmail.com",
  "otp": "123456"
}
```

**Expected Response (Success):**
```json
{
  "msg": "Email verified successfully!",
  "user": {
    "id": 1,
    "employee_id": "TST-AMA-001",
    "name": "Aman Yadav",
    "email": "yadavaman1948@gmail.com",
    "role": "employee",
    "status": "active",
    "company_name": "Test Company",
    "phone": "9876543210"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirect": "/dashboard/employee"
}
```

**Expected Response (Invalid OTP):**
```json
{
  "msg": "Invalid OTP. 2 attempt(s) remaining."
}
```

**Expected Response (Expired OTP):**
```json
{
  "msg": "Invalid or expired OTP. Please request a new one."
}
```

**Check Database After Verification:**
```sql
-- User should be active
SELECT id, name, email, status FROM users WHERE email = 'yadavaman1948@gmail.com';
-- status should be 'active'

-- OTP should be marked as used
SELECT id, email, used, attempts FROM email_otps WHERE email = 'yadavaman1948@gmail.com';
-- used should be true
```

**Check Email:**
- Look for welcome email with subject: "Welcome to WorkZen HRMS!"

---

### 3. Resend OTP (If Expired or Lost)
```bash
POST http://localhost:5000/api/auth/resend-otp
Content-Type: application/json

{
  "email": "yadavaman1948@gmail.com"
}
```

**Expected Response:**
```json
{
  "msg": "New verification code sent to your email",
  "email": "yadavaman1948@gmail.com"
}
```

**Expected Response (Rate Limited - too soon):**
```json
{
  "msg": "Please wait 60 seconds before requesting a new OTP"
}
```

**Expected Response (Already Verified):**
```json
{
  "msg": "Email already verified"
}
```

**Check Database:**
```sql
-- Old OTPs should be marked as used
SELECT id, email, used, created_at FROM email_otps WHERE email = 'yadavaman1948@gmail.com' ORDER BY created_at DESC;
-- Only the newest OTP should have used = false
```

---

## 🌐 Frontend Testing (UI)

### Start the Application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Test Registration Flow

1. **Register Page** (`http://localhost:5173/register`)
   - Fill in all fields
   - Use email: `yadavaman1948@gmail.com`
   - Click "Create Account"
   - Should redirect to `/verify-otp`

2. **Verify OTP Page** (`http://localhost:5173/verify-otp`)
   - Check your email for 6-digit code
   - Enter the code in the input field
   - Click "Verify & Continue"
   - Should show success alert
   - Should redirect to `/dashboard`

3. **Resend OTP**
   - On verify page, click "Resend Code"
   - Wait 60 seconds (countdown timer)
   - Click again to resend
   - Check email for new code

4. **Error Cases**
   - Enter wrong OTP → Shows "Invalid OTP. X attempt(s) remaining"
   - Enter expired OTP → Shows "Invalid or expired OTP. Please request a new one"
   - Exceed 3 attempts → OTP invalidated, must resend

---

## 🔒 Security Features

### ✅ Implemented
1. **Bcrypt Hashing**: OTPs hashed before storage
2. **10-Minute Expiry**: OTPs auto-expire
3. **Single-Use**: OTPs can only be used once
4. **Attempt Limiting**: Max 3 verification attempts per OTP
5. **Rate Limiting**: 
   - Registration: 3 requests/minute
   - Resend OTP: 3 requests/minute
   - 60-second cooldown between resends
6. **Audit Logging**: All OTP actions logged
7. **Automated Cleanup**: Cron job removes old OTPs every hour

### 🔍 Security Testing

**Test Rate Limiting:**
```bash
# Try registering 4 times in 1 minute with same email
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "companyName": "Test",
      "name": "Test User",
      "email": "yadavaman1948@gmail.com",
      "phone": "1234567890",
      "password": "test123"
    }'
  echo "\n---\n"
done
# 4th request should return: "Too many OTP requests. Please try again later."
```

**Test Brute Force Protection:**
```bash
# Try verifying with wrong OTP 4 times
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "email": "yadavaman1948@gmail.com",
      "otp": "000000"
    }'
  echo "\n---\n"
done
# After 3 attempts, should require resending OTP
```

---

## 📊 Monitoring & Maintenance

### Check OTP Statistics
```sql
-- Active OTPs (not used, not expired)
SELECT COUNT(*) as active_otps 
FROM email_otps 
WHERE used = false AND expires_at > NOW();

-- Expired OTPs
SELECT COUNT(*) as expired_otps 
FROM email_otps 
WHERE used = false AND expires_at < NOW();

-- Used OTPs
SELECT COUNT(*) as used_otps 
FROM email_otps 
WHERE used = true;

-- Recent OTPs (last 24 hours)
SELECT email, used, attempts, expires_at, created_at 
FROM email_otps 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Cleanup Job Logs
Check console output for:
```
🧹 Running OTP cleanup job...
✅ Cleaned up 5 expired/used OTP(s)
📊 OTP stats: 2 active, 10 used, 0 expired
```

### Manual Cleanup (if needed)
```sql
-- Delete expired OTPs (older than 2 days)
DELETE FROM email_otps 
WHERE expires_at < NOW() - INTERVAL '2 days';

-- Delete old used OTPs (older than 7 days)
DELETE FROM email_otps 
WHERE used = true AND created_at < NOW() - INTERVAL '7 days';
```

---

## 🐛 Troubleshooting

### Issue: Email Not Received

**Cause**: Testing domain restriction
**Solution**: 
- Only use `yadavaman1948@gmail.com` for testing
- Check spam/junk folder
- Verify Resend API key is correct
- Check server logs for email send errors

**Debug:**
```sql
-- Check if OTP was created
SELECT * FROM email_otps WHERE email = 'your_email@example.com' ORDER BY created_at DESC LIMIT 1;

-- In development, check otp_plain column
SELECT otp_plain FROM email_otps WHERE email = 'your_email@example.com' AND used = false ORDER BY created_at DESC LIMIT 1;
```

### Issue: "User not found" on Verify OTP

**Cause**: Registration failed or email mismatch
**Solution**:
```sql
-- Check if user exists
SELECT id, email, status FROM users WHERE email = 'your_email@example.com';
```

### Issue: "Invalid or expired OTP"

**Cause**: OTP expired (> 10 minutes old) or already used
**Solution**:
```sql
-- Check OTP status
SELECT expires_at, used, attempts FROM email_otps 
WHERE email = 'your_email@example.com' 
ORDER BY created_at DESC LIMIT 1;

-- If expired or used, click "Resend Code" button
```

### Issue: "Maximum OTP attempts exceeded"

**Cause**: 3 failed verification attempts
**Solution**:
- Click "Resend Code" to get a new OTP
- Old OTP is invalidated

### Issue: "Email already verified"

**Cause**: User already activated
**Solution**:
- User can log in directly at `/login`
- No need to verify again

---

## 🧹 Database Cleanup

### Reset User for Testing (Delete & Re-register)
```sql
-- Delete user and related OTPs
DELETE FROM email_otps WHERE email = 'yadavaman1948@gmail.com';
DELETE FROM users WHERE email = 'yadavaman1948@gmail.com';

-- Now you can register again with the same email
```

### Reset User Status (Change Active → Pending)
```sql
-- Make active user pending again for re-testing verification
UPDATE users SET status = 'pending' WHERE email = 'yadavaman1948@gmail.com';

-- Generate a new OTP manually (or use resend endpoint)
```

---

## 📈 Production Checklist

Before deploying to production:

1. ✅ **Verify Custom Domain** at https://resend.com/domains
2. ✅ Update `FROM_EMAIL` environment variable to use custom domain
3. ✅ Remove `otp_plain` column from production database:
   ```sql
   ALTER TABLE email_otps DROP COLUMN IF EXISTS otp_plain;
   ```
4. ✅ Set `NODE_ENV=production` to disable plain OTP storage
5. ✅ Configure proper rate limiting (stricter in production)
6. ✅ Set up monitoring for email delivery failures
7. ✅ Configure database backups
8. ✅ Test end-to-end flow with real email addresses
9. ✅ Set up error tracking (e.g., Sentry)
10. ✅ Document customer support process for OTP issues

---

## 📚 API Endpoints Summary

| Endpoint | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `/api/auth/register` | POST | 3/min | Create pending user, send OTP |
| `/api/auth/verify-otp` | POST | None | Verify OTP, activate account, login |
| `/api/auth/resend-otp` | POST | 3/min + 60s cooldown | Invalidate old OTPs, send new one |
| `/api/auth/login` | POST | None | Login active users |

---

## 🎯 Test Scenarios Checklist

### Happy Path
- [x] Register → Receive OTP → Verify → Activated → Welcome Email
- [x] Login with activated account

### Edge Cases
- [x] Wrong OTP (3 attempts)
- [x] Expired OTP (> 10 minutes)
- [x] Resend OTP multiple times
- [x] Rate limiting on registration
- [x] Rate limiting on resend
- [x] Already verified user tries to verify again
- [x] Register with same email twice (pending vs active)
- [x] Verify with non-existent email

### Security
- [x] OTP hashed in database
- [x] Single-use OTP enforcement
- [x] Attempt limiting (max 3)
- [x] Rate limiting on all endpoints
- [x] Audit logging

### Cleanup
- [x] Automated cleanup job runs every hour
- [x] Old OTPs removed (expired > 2 days, used > 7 days)

---

## 🔗 Related Files

**Backend:**
- `server/src/controllers/authController.js` - register, verifyOtp, resendOtp
- `server/src/routes/authRoutes.js` - API routes with rate limiting
- `server/src/utils/otpUtil.js` - OTP generation & hashing
- `server/src/utils/mailTemplates.js` - Email HTML templates
- `server/src/jobs/cleanupOtps.js` - Automated cleanup
- `server/src/config/resend.js` - Email sending
- `migrations/002_create_email_otps.sql` - Database schema

**Frontend:**
- `client/src/pages/Register.jsx` - Registration form
- `client/src/pages/VerifyOtp.jsx` - OTP verification page
- `client/src/context/AuthProvider.jsx` - Auth state management
- `client/src/App.jsx` - Routes

---

## 📞 Support

For issues or questions:
1. Check server console logs
2. Check database state with SQL queries above
3. Verify environment variables
4. Check Resend dashboard for email delivery logs: https://resend.com/emails

---

**Last Updated:** December 2024
**Version:** 1.0
**Author:** WorkZen Dev Team
