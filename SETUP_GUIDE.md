# Quick Setup Guide - Account System Integration

Follow these steps to deploy the account system integration:

## Step 1: Update Environment Variables

Add these lines to your `.env` file:

```bash
# Central Account System
CENTRAL_API_URL="http://46.62.200.141:3005"
CENTRAL_ADMIN_EMAIL="eldardzuho2000@gmail.com"
CENTRAL_PLATFORM_KEY="sk_platform_6ef43cdcae98dd732647e59facbddf411790136852ceb6bd68dcf24d4ee57c92"
```

## Step 2: Run Database Migration

Execute the migration to add new tables and columns:

```bash
# Connect to your database and run:
psql -U your_username -d your_database -f migration-account-system.sql

# Or if using Prisma:
npx prisma db push
```

## Step 3: Install Dependencies (if needed)

```bash
npm install
# or
yarn install
```

## Step 4: Rebuild and Restart

```bash
# Build the application
npm run build

# Restart PM2
pm2 restart Saraya-Quiz

# Or restart manually
pm2 stop Saraya-Quiz
pm2 start ecosystem.config.js
```

## Step 5: Test the Integration

1. **Visit Homepage**: http://your-domain:3001
   - Should redirect to login page

2. **Create Account**: http://your-domain:3001/auth/user-register
   - Fill in name, email, password
   - Should redirect to homepage after success

3. **Check Balance Display**:
   - Top right corner should show: Coins, Tokens, XP, Level
   - Initially: 0 coins, 0 tokens, 0 XP, Level 1

4. **Complete a Quiz**:
   - Click on any quiz card
   - Complete all questions
   - Submit quiz
   - Check results page for rewards

5. **Verify Rewards**:
   - Results page shows: "🎉 Rewards Earned: X Coins, Y XP"
   - If perfect score: "1 Token (Perfect Score!)"
   - Homepage balance should update

## Verification Checklist

- [ ] Homepage redirects to login when not authenticated
- [ ] User can register a new account
- [ ] User can login with existing account
- [ ] Balance displays correctly on homepage
- [ ] Quiz completion awards coins and XP
- [ ] Perfect score (100%) awards 1 token
- [ ] Results page shows rewards earned
- [ ] Logout button works
- [ ] Admin login still works at `/admin`

## Troubleshooting

### Homepage shows blank or errors
- Check browser console for errors
- Verify environment variables are set
- Check server logs: `pm2 logs Saraya-Quiz`

### Balance doesn't load
```bash
# Test central API manually
curl -H "x-admin-email: eldardzuho2000@gmail.com" \
  "http://46.62.200.141:3005/api/accounts?search=test@example.com"
```

### Database errors
```bash
# Check if migration ran
psql -U your_username -d your_database -c "\d User"

# Should show User table structure
```

### Rewards not recording
```bash
# Check PM2 logs for errors
pm2 logs Saraya-Quiz --lines 100

# Look for "Failed to record quiz completion" errors
```

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove new columns
ALTER TABLE "Attempt" DROP COLUMN IF EXISTS "playerEmail";
ALTER TABLE "Attempt" DROP COLUMN IF EXISTS "accountId";
ALTER TABLE "ScoreEntry" DROP COLUMN IF EXISTS "accountId";

-- Drop User table
DROP TABLE IF EXISTS "User";
```

Then redeploy the previous version.

## Support

- **Admin Dashboard**: http://46.62.200.141:3005/admin
- **Username**: eldardzuho2000@gmail.com
- **Documentation**: See ACCOUNT_INTEGRATION.md for full details

## What Changed

### New Files
- `lib/central-account.ts` - Central API integration
- `app/actions/user-actions.ts` - User signup actions
- `app/auth/user-login/page.tsx` - Login page
- `app/auth/user-register/page.tsx` - Registration page
- `components/user/UserBalance.tsx` - Balance display component
- `migration-account-system.sql` - Database migration

### Modified Files
- `prisma/schema.prisma` - Added User model and accountId fields
- `app/page.tsx` - Added auth requirement
- `app/actions/public-actions.ts` - Added reward recording
- `components/quiz/QuizHomepageClient.tsx` - Added user info bar
- `components/quiz/QuizResults.tsx` - Added rewards display
- `.env.example` - Added central API variables

### Database Changes
- New `User` table
- `Attempt.playerEmail` (nullable)
- `Attempt.accountId` (nullable)
- `ScoreEntry.accountId` (nullable)

## Next Steps

After successful deployment:

1. Monitor the first few user registrations
2. Check admin dashboard for activity
3. Verify rewards are being recorded correctly
4. Test cross-platform account sharing (if applicable)
5. Consider implementing additional features:
   - Daily bonuses
   - Achievement badges
   - Streak tracking
   - Leaderboard with token rewards
