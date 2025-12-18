# 🚀 DEPLOYMENT CHECKLIST

Use this checklist to deploy the central account system integration step by step.

## Pre-Deployment

### ✅ Code Review
- [ ] All files created and committed
- [ ] Schema changes reviewed
- [ ] Environment variables documented
- [ ] Test script available

### ✅ Backup
- [ ] Database backup created
- [ ] Current .env file backed up
- [ ] PM2 process list saved: `pm2 save`

## Deployment Steps

### Step 1: Environment Configuration
- [ ] Open `.env` file: `nano /www/wwwroot/SarayaQuiz/.env`
- [ ] Add these lines:
  ```
  CENTRAL_API_URL="http://46.62.200.141:3005"
  CENTRAL_ADMIN_EMAIL="eldardzuho2000@gmail.com"
  CENTRAL_PLATFORM_KEY="sk_platform_6ef43cdcae98dd732647e59facbddf411790136852ceb6bd68dcf24d4ee57c92"
  ```
- [ ] Save and close: `Ctrl+X`, `Y`, `Enter`

### Step 2: Test API Connection
```bash
cd /www/wwwroot/SarayaQuiz
node test-central-api.js
```
- [ ] All 6 tests pass ✅
- [ ] Account created successfully
- [ ] Rewards recorded correctly
- [ ] Balance updated properly

### Step 3: Database Migration

**Option A: Using Prisma (Recommended)**
```bash
cd /www/wwwroot/SarayaQuiz
npx prisma db push
```
- [ ] Migration successful
- [ ] No errors reported

**Option B: Using SQL directly**
```bash
# Get your database credentials from .env
psql -U your_username -d your_database -f migration-account-system.sql
```
- [ ] User table created
- [ ] New columns added to Attempt and ScoreEntry
- [ ] Indexes created

### Step 4: Verify Schema
```bash
psql -U your_username -d your_database -c "\d User"
```
- [ ] User table exists with: id, email, name, accountId, createdAt, updatedAt

### Step 5: Install Dependencies
```bash
cd /www/wwwroot/SarayaQuiz
npm install
```
- [ ] All dependencies installed
- [ ] No errors

### Step 6: Build Application
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No build errors

### Step 7: Restart Application
```bash
pm2 restart Saraya-Quiz
```
- [ ] Application restarted
- [ ] Check status: `pm2 status`
- [ ] Status should be "online"

### Step 8: Check Logs
```bash
pm2 logs Saraya-Quiz --lines 50
```
- [ ] No critical errors
- [ ] Application started successfully
- [ ] Server listening on port 3001

## Post-Deployment Testing

### Test 1: Homepage Redirect
- [ ] Visit: `http://your-domain:3001`
- [ ] Should redirect to `/auth/user-login`

### Test 2: User Registration
- [ ] Visit: `http://your-domain:3001/auth/user-register`
- [ ] Fill form: name, email, password
- [ ] Click "Sign Up"
- [ ] Should redirect to homepage after success

### Test 3: Balance Display
- [ ] Homepage shows user info in top right
- [ ] Balance visible: 0 coins, 0 tokens, 0 XP, Level 1
- [ ] User name displayed
- [ ] Logout button present

### Test 4: Quiz Completion
- [ ] Click on a quiz card
- [ ] Complete all questions
- [ ] Submit quiz
- [ ] Results page shows:
  - [ ] Score and percentage
  - [ ] "🎉 Rewards Earned" section
  - [ ] Coins earned (score/10)
  - [ ] XP earned (equal to score)
  - [ ] Token earned (if 100% score)

### Test 5: Balance Update
- [ ] Return to homepage
- [ ] Balance should be updated
- [ ] Coins increased
- [ ] XP increased
- [ ] Tokens increased (if perfect score)

### Test 6: Logout
- [ ] Click logout button (top right)
- [ ] Redirected to login page
- [ ] Cannot access homepage without login

### Test 7: Login
- [ ] Visit: `http://your-domain:3001/auth/user-login`
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] Should redirect to homepage
- [ ] Balance loads correctly

### Test 8: Admin Access
- [ ] Visit: `http://your-domain:3001/admin`
- [ ] Admin login still works
- [ ] Quiz management functional
- [ ] No conflicts with user auth

### Test 9: Central System Verification
- [ ] Visit: `http://46.62.200.141:3005/admin`
- [ ] Login with: eldardzuho2000@gmail.com
- [ ] Search for your test user email
- [ ] Verify:
  - [ ] Account exists
  - [ ] Balance correct
  - [ ] Activity recorded
  - [ ] Platform shows "QUIZ"

## Verification Commands

### Check Application Status
```bash
pm2 status
pm2 logs Saraya-Quiz --lines 100
```

### Check Database
```bash
# Connect to database
psql -U your_username -d your_database

# Check tables
\dt

# Check User table
SELECT * FROM "User" LIMIT 5;

# Check Attempt with accountId
SELECT id, "playerName", "playerEmail", "accountId" FROM "Attempt" 
WHERE "accountId" IS NOT NULL LIMIT 5;

# Exit
\q
```

### Test Central API Manually
```bash
# Check if account exists
curl -H "x-admin-email: eldardzuho2000@gmail.com" \
  "http://46.62.200.141:3005/api/accounts?search=your-test-email@example.com"

# Should return account data with coins, tokens, XP, level
```

## Rollback Plan (If Needed)

### If Something Goes Wrong

1. **Stop Application**
   ```bash
   pm2 stop Saraya-Quiz
   ```

2. **Restore Database** (if migration ran)
   ```bash
   # Drop new tables/columns
   psql -U user -d database << EOF
   ALTER TABLE "Attempt" DROP COLUMN IF EXISTS "playerEmail";
   ALTER TABLE "Attempt" DROP COLUMN IF EXISTS "accountId";
   ALTER TABLE "ScoreEntry" DROP COLUMN IF EXISTS "accountId";
   DROP TABLE IF EXISTS "User";
   EOF
   ```

3. **Restore Environment**
   ```bash
   # Remove new env vars or restore backup
   cp .env.backup .env
   ```

4. **Checkout Previous Version**
   ```bash
   git checkout previous-commit-hash
   npm install
   npm run build
   ```

5. **Restart**
   ```bash
   pm2 restart Saraya-Quiz
   ```

## Common Issues & Solutions

### Issue: "Cannot connect to central API"
**Solution:**
```bash
# Test connectivity
curl http://46.62.200.141:3005/api/accounts

# Check firewall
# Check environment variable is set
echo $CENTRAL_API_URL
```

### Issue: "User table not found"
**Solution:**
```bash
# Run migration again
cd /www/wwwroot/SarayaQuiz
npx prisma db push --force-reset
# WARNING: This will delete all data!
```

### Issue: "Balance not showing"
**Solution:**
- Check browser console for errors
- Verify central API is reachable
- Check server logs: `pm2 logs Saraya-Quiz`
- Test with: `node test-central-api.js`

### Issue: "Rewards not recording"
**Solution:**
- Verify CENTRAL_PLATFORM_KEY is correct
- Check server logs for API errors
- Test manually with curl
- Verify accountId exists for user

## Success Criteria

✅ All tests pass
✅ Users can register and login
✅ Homepage shows balance
✅ Quiz completion awards rewards
✅ Perfect scores get token bonus
✅ Balance updates in real-time
✅ Admin panel still works
✅ No errors in logs

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor PM2 logs: `pm2 logs Saraya-Quiz --lines 100`
- [ ] Check for errors or warnings
- [ ] Monitor user registrations
- [ ] Verify rewards are being recorded

### First Week
- [ ] Review central admin dashboard
- [ ] Check for any failed API calls
- [ ] Verify cross-platform integration (if applicable)
- [ ] Monitor database performance

## Documentation

- [ ] Update internal documentation
- [ ] Notify team of new features
- [ ] Share admin dashboard access
- [ ] Document any custom changes

## Completion

Date Deployed: ________________

Deployed By: ________________

Notes:
_____________________________________
_____________________________________
_____________________________________

---

## Quick Reference

**Test API**: `node test-central-api.js`
**Check Logs**: `pm2 logs Saraya-Quiz`
**Restart App**: `pm2 restart Saraya-Quiz`
**Check Status**: `pm2 status`
**Admin Dashboard**: http://46.62.200.141:3005/admin

**Homepage**: http://your-domain:3001
**Login**: http://your-domain:3001/auth/user-login
**Register**: http://your-domain:3001/auth/user-register
**Admin**: http://your-domain:3001/admin
