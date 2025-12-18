/**
 * Central Account Management System Integration
 * 
 * This module handles all interactions with the centralized account system
 * that manages user accounts, coins, tokens, and XP across all platforms.
 */

const CENTRAL_API_URL = process.env.CENTRAL_API_URL || 'http://46.62.200.141:3005'
const ADMIN_EMAIL = process.env.CENTRAL_ADMIN_EMAIL || 'eldardzuho2000@gmail.com'
const PLATFORM_CODE = 'QUIZ'
const PLATFORM_KEY = process.env.CENTRAL_PLATFORM_KEY || 'sk_platform_6ef43cdcae98dd732647e59facbddf411790136852ceb6bd68dcf24d4ee57c92'

export interface CentralAccount {
  id: string
  email: string
  name: string
  coin_wallets?: {
    coins_balance: number
    tokens_balance: number
  }
  xp_profiles?: {
    xp_total: number
    level: number
  }
}

export interface UserBalance {
  coins: number
  tokens: number
  xp: number
  level: number
}

/**
 * Check if an account exists in the central system
 */
export async function checkAccountExists(email: string): Promise<CentralAccount | null> {
  try {
    const response = await fetch(
      `${CENTRAL_API_URL}/api/accounts?search=${encodeURIComponent(email)}`,
      {
        headers: {
          'x-admin-email': ADMIN_EMAIL
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to check account:', await response.text())
      return null
    }

    const result = await response.json()
    
    if (result.data && result.data.length > 0) {
      return result.data[0] as CentralAccount
    }
    
    return null
  } catch (error) {
    console.error('Error checking account:', error)
    return null
  }
}

/**
 * Create a new account in the central system
 */
export async function createCentralAccount(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; accountId?: string; error?: string }> {
  try {
    // First check if account already exists
    const existing = await checkAccountExists(email)
    if (existing) {
      return { success: true, accountId: existing.id }
    }

    // Create new account
    const response = await fetch(`${CENTRAL_API_URL}/api/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': ADMIN_EMAIL
      },
      body: JSON.stringify({
        email,
        name,
        password,
        initialBalance: 0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create account:', errorText)
      return { success: false, error: 'Failed to create account in central system' }
    }

    const result = await response.json()
    return { success: true, accountId: result.data.id }
  } catch (error) {
    console.error('Error creating central account:', error)
    return { success: false, error: 'Network error while creating account' }
  }
}

/**
 * Record quiz completion and award rewards
 */
export async function recordQuizCompletion(
  accountId: string,
  quizId: string,
  score: number,
  maxScore: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculate rewards based on new formula
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
    const isPerfect = percentage === 100
    
    // Flat rewards for completion
    const coinsEarned = 100 // Fixed 100 coins per quiz completion
    const xpEarned = 50     // Fixed 50 XP per quiz completion
    
    // Tokens: 1 per correct answer + 2 bonus for perfect score
    const correctAnswers = score // Assuming score equals number of correct answers
    let tokensEarned = correctAnswers
    if (isPerfect) {
      tokensEarned += 2 // Add 2 bonus tokens for perfect score
    }

    const response = await fetch(`${CENTRAL_API_URL}/api/platforms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-platform-code': PLATFORM_CODE,
        'x-platform-key': PLATFORM_KEY
      },
      body: JSON.stringify({
        accountId,
        eventType: isPerfect ? 'perfect_score' : 'quiz_completed',
        coinsChange: coinsEarned,
        tokensChange: tokensEarned,
        xpChange: xpEarned,
        metadata: {
          quizId,
          score,
          maxScore,
          correctAnswers,
          percentage: percentage.toFixed(1),
          isPerfect,
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to record activity:', errorText)
      return { success: false, error: 'Failed to record quiz completion' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error recording quiz completion:', error)
    return { success: false, error: 'Network error while recording activity' }
  }
}

/**
 * Get user balance (coins, tokens, XP, level)
 */
export async function getUserBalance(email: string): Promise<UserBalance | null> {
  try {
    const account = await checkAccountExists(email)
    
    if (!account) {
      return null
    }
    
    return {
      coins: account.coin_wallets?.coins_balance || 0,
      tokens: account.coin_wallets?.tokens_balance || 0,
      xp: account.xp_profiles?.xp_total || 0,
      level: account.xp_profiles?.level || 1
    }
  } catch (error) {
    console.error('Error getting user balance:', error)
    return null
  }
}

/**
 * Get user balance by accountId
 */
export async function getUserBalanceById(accountId: string): Promise<UserBalance | null> {
  try {
    const response = await fetch(
      `${CENTRAL_API_URL}/api/accounts?search=${accountId}`,
      {
        headers: {
          'x-admin-email': ADMIN_EMAIL
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    
    if (result.data && result.data.length > 0) {
      const account = result.data[0] as CentralAccount
      return {
        coins: account.coin_wallets?.coins_balance || 0,
        tokens: account.coin_wallets?.tokens_balance || 0,
        xp: account.xp_profiles?.xp_total || 0,
        level: account.xp_profiles?.level || 1
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting user balance by ID:', error)
    return null
  }
}
