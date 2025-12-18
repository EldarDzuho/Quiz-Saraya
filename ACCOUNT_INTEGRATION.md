# Central Account System Integration

This document describes the integration of the Quiz platform with the centralized account management system.

## Overview

The Quiz platform now integrates with a central account system that manages:
- **User Accounts** - Cross-platform user authentication
- **Coins** (💰) - Regular currency earned from completing quizzes
- **Tokens** (💎) - Premium currency for perfect scores and special achievements
- **XP** (⚡) - Experience points for leveling up
- **Levels** (🎯) - User progression system

## Features Implemented

### 1. User Authentication
- **Register**: `/auth/user-register` - New users create accounts
- **Login**: `/auth/user-login` - Returning users sign in
- **Homepage Protection**: Users must be logged in to access quizzes
- **Session Management**: Automatic logout button on homepage

### 2. Central Account Creation
- When users register, an account is automatically created in the central system
- The `accountId` from the central system is stored locally
- Email is used as the unique identifier across platforms

### 3. Rewards System
Quiz completion automatically awards:
- **Coins**: 1 coin per 10 points scored
- **XP**: Equal to quiz score
- **Tokens**: 1 token for perfect score (100%)

Examples:
- Score 75/100: Earn 7 coins, 75 XP, 0 tokens
- Score 100/100: Earn 10 coins, 100 XP, 1 token (Perfect Score Bonus!)

### 4. Balance Display
The homepage shows the user's current balance:
- Coins balance with coin icon
- Tokens balance with gem icon  
- Total XP with lightning icon
- Current level with trophy icon

### 5. Results Page
After completing a quiz, users see:
- Their score and percentage
- Rewards earned breakdown
- Review of correct/incorrect answers

## API Integration

### Central API Details
- **Base URL**: `http://46.62.200.141:3005`
- **Platform Code**: `QUIZ`
- **Admin Email**: `eldardzuho2000@gmail.com`

### Security
- All API calls are made server-side only
- API keys stored in environment variables
- Never exposed to client-side JavaScript

## Database Schema Changes

### New User Table
```sql
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
);
```

### Updated Tables
- **Attempt**: Added `playerEmail` and `accountId` fields
- **ScoreEntry**: Added `accountId` field

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:

```env
# Central Account System
CENTRAL_API_URL="http://46.62.200.141:3005"
CENTRAL_ADMIN_EMAIL="eldardzuho2000@gmail.com"
CENTRAL_PLATFORM_KEY="sk_platform_6ef43cdcae98dd732647e59facbddf411790136852ceb6bd68dcf24d4ee57c92"
```

### 2. Database Migration
Run the migration script:

```bash
# Using psql
psql -U your_user -d your_database -f migration-account-system.sql

# Or using Prisma
npx prisma db push
```

### 3. Install Dependencies
No new dependencies required - all API calls use native fetch.

### 4. Test the Integration
1. Visit homepage - should redirect to login
2. Create a new account at `/auth/user-register`
3. Complete a quiz
4. Check that rewards appear on results page
5. Verify balance updates on homepage

## User Flow

### New User Registration
1. User visits homepage
2. Redirected to `/auth/user-register`
3. Fills out name, email, password
4. Account created in:
   - Supabase Auth (authentication)
   - Central System (coins, tokens, XP)
   - Local User table (accountId storage)
5. Redirected to homepage with balance displayed

### Quiz Completion
1. User clicks on a quiz card
2. Enters quiz interface
3. Answers all questions
4. Submits quiz
5. Server calculates score and rewards
6. Server records activity in central system
7. User sees results with rewards earned
8. Balance automatically updates

### Returning User Login
1. User visits homepage
2. Redirected to `/auth/user-login`
3. Enters email and password
4. Authenticated via Supabase Auth
5. AccountId fetched from local User table
6. Redirected to homepage
7. Balance loaded from central system

## Reward Formulas

```javascript
// Coins: 1 coin per 10 points
coins = Math.floor(score / 10)

// XP: Equal to score
xp = score

// Tokens: 1 for perfect score
tokens = (score / maxScore === 1.0) ? 1 : 0

// Event Type
eventType = (score / maxScore === 1.0) ? 'perfect_score' : 'quiz_completed'
```

## API Functions

### `lib/central-account.ts`

#### `checkAccountExists(email)`
Checks if an account exists in the central system.

#### `createCentralAccount(email, name, password)`
Creates a new account in the central system.

#### `recordQuizCompletion(accountId, quizId, score, maxScore)`
Records quiz completion and awards coins, tokens, and XP.

#### `getUserBalance(email)`
Fetches current balance (coins, tokens, XP, level).

### `app/actions/user-actions.ts`

#### `handleUserSignup(email, name, password)`
Server action to create account in both Supabase and central system.

#### `getOrCreateUserAccountId(email, name?)`
Gets existing accountId or creates account if needed.

#### `getUserBalanceAction(email)`
Server action to fetch user balance.

## Components

### `UserBalance`
Displays user's coins, tokens, XP, and level with animated badges.

Location: `components/user/UserBalance.tsx`

Props:
- `email`: User's email address
- `name`: User's display name

### `QuizHomepageClient` (Updated)
Now includes:
- User info bar at top
- Balance display
- Logout button

### `QuizResults` (Updated)
Now shows:
- Rewards earned section
- Perfect score bonus indicator

## Cross-Platform Compatibility

Users who register on the Quiz platform can:
- Use the same email/password on other platforms (Hotspot, etc.)
- Access the same wallet (coins and tokens)
- Share the same XP and level
- See unified activity across all platforms

## Admin Dashboard

View all user activity and balances at:
**URL**: `http://46.62.200.141:3005/admin`
**Username**: `eldardzuho2000@gmail.com`

## Troubleshooting

### Balance not showing
- Check that `CENTRAL_API_URL` is set correctly
- Verify user has accountId in User table
- Check browser console for API errors

### Rewards not being awarded
- Verify `CENTRAL_PLATFORM_KEY` is correct
- Check server logs for API call failures
- Ensure accountId is passed to submitQuiz

### User can't register
- Check central API is accessible
- Verify admin email is correct
- Check for duplicate email addresses

## Future Enhancements

Potential additions:
- Daily login bonuses
- Quiz streaks (complete X quizzes in a row)
- Leaderboard rankings with token rewards
- Achievement badges
- Token shop for premium features
- Social features (friends, challenges)

## Support

For issues or questions:
- Check central system admin dashboard
- Review server logs for API errors
- Verify environment variables are set
- Test API endpoints manually with curl/Postman
