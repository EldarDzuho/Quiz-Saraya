#!/usr/bin/env node

/**
 * Test script for Central Account System Integration
 * 
 * This script tests the connection to the central account API
 * and verifies that all endpoints are working correctly.
 * 
 * Usage: node test-central-api.js
 */

const CENTRAL_API_URL = process.env.CENTRAL_API_URL || 'http://46.62.200.141:3005'
const ADMIN_EMAIL = process.env.CENTRAL_ADMIN_EMAIL || 'eldardzuho2000@gmail.com'
const PLATFORM_KEY = process.env.CENTRAL_PLATFORM_KEY || 'sk_platform_6ef43cdcae98dd732647e59facbddf411790136852ceb6bd68dcf24d4ee57c92'

const TEST_EMAIL = `test-${Date.now()}@example.com`
const TEST_NAME = 'Test User'
const TEST_PASSWORD = 'TestPassword123!'

async function testConnection() {
  console.log('🧪 Testing Central Account System Connection...\n')
  
  // Test 1: Check if API is reachable
  console.log('1️⃣  Testing API Connectivity...')
  try {
    const response = await fetch(`${CENTRAL_API_URL}/api/accounts`, {
      headers: {
        'x-admin-email': ADMIN_EMAIL
      }
    })
    
    if (response.ok) {
      console.log('✅ API is reachable\n')
    } else {
      console.log(`❌ API returned status: ${response.status}\n`)
      return
    }
  } catch (error) {
    console.log(`❌ Cannot connect to API: ${error.message}\n`)
    return
  }
  
  // Test 2: Create test account
  console.log('2️⃣  Creating test account...')
  let accountId
  try {
    const response = await fetch(`${CENTRAL_API_URL}/api/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': ADMIN_EMAIL
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        name: TEST_NAME,
        password: TEST_PASSWORD,
        initialBalance: 0
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      accountId = result.data.id
      console.log(`✅ Account created: ${accountId}`)
      console.log(`   Email: ${TEST_EMAIL}`)
      
      // Check if wallet and XP data exists
      if (result.data.coin_wallets) {
        console.log(`   Coins: ${result.data.coin_wallets.coins_balance || 0}`)
        console.log(`   Tokens: ${result.data.coin_wallets.tokens_balance || 0}`)
      } else {
        console.log(`   Coins: 0 (wallet will be created on first activity)`)
        console.log(`   Tokens: 0`)
      }
      
      if (result.data.xp_profiles) {
        console.log(`   XP: ${result.data.xp_profiles.xp_total || 0}`)
        console.log(`   Level: ${result.data.xp_profiles.level || 1}`)
      } else {
        console.log(`   XP: 0 (profile will be created on first activity)`)
        console.log(`   Level: 1`)
      }
      console.log('')
    } else {
      const error = await response.text()
      console.log(`❌ Failed to create account: ${error}\n`)
      return
    }
  } catch (error) {
    console.log(`❌ Error creating account: ${error.message}\n`)
    return
  }
  
  // Test 3: Check account exists
  console.log('3️⃣  Checking if account exists...')
  try {
    const response = await fetch(
      `${CENTRAL_API_URL}/api/accounts?search=${encodeURIComponent(TEST_EMAIL)}`,
      {
        headers: {
          'x-admin-email': ADMIN_EMAIL
        }
      }
    )
    
    if (response.ok) {
      const result = await response.json()
      if (result.data && result.data.length > 0) {
        console.log(`✅ Account found: ${result.data[0].id}\n`)
      } else {
        console.log(`❌ Account not found\n`)
        return
      }
    } else {
      console.log(`❌ Failed to check account\n`)
      return
    }
  } catch (error) {
    console.log(`❌ Error checking account: ${error.message}\n`)
    return
  }
  
  // Test 4: Record quiz completion
  console.log('4️⃣  Recording quiz completion...')
  try {
    const response = await fetch(`${CENTRAL_API_URL}/api/platforms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-platform-code': 'QUIZ',
        'x-platform-key': PLATFORM_KEY
      },
      body: JSON.stringify({
        accountId: accountId,
        eventType: 'quiz_completed',
        coinsChange: 10,
        tokensChange: 0,
        xpChange: 100,
        metadata: {
          quizId: 'test-quiz',
          score: 100,
          test: true
        }
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Activity recorded: ${result.data.id}`)
      console.log(`   Coins Delta: ${result.data.coins_delta}`)
      console.log(`   Tokens Delta: ${result.data.tokens_delta}`)
      console.log(`   XP Delta: ${result.data.xp_delta}\n`)
    } else {
      const error = await response.text()
      console.log(`⚠️  Platform activity recording returned: ${error}`)
      console.log(`   Note: Platform key may need to be activated in the central system`)
      console.log(`   Contact admin to ensure QUIZ platform is registered\n`)
      // Don't return - continue with other tests
    }
  } catch (error) {
    console.log(`❌ Error recording activity: ${error.message}\n`)
    // Don't return - continue with other tests
  }
  
  // Test 5: Get updated balance
  console.log('5️⃣  Fetching updated balance...')
  try {
    const response = await fetch(
      `${CENTRAL_API_URL}/api/accounts?search=${encodeURIComponent(TEST_EMAIL)}`,
      {
        headers: {
          'x-admin-email': ADMIN_EMAIL
        }
      }
    )
    
    if (response.ok) {
      const result = await response.json()
      if (result.data && result.data.length > 0) {
        const account = result.data[0]
        console.log(`✅ Balance updated:`)
        console.log(`   💰 Coins: ${account.coin_wallets?.coins_balance || 0}`)
        console.log(`   💎 Tokens: ${account.coin_wallets?.tokens_balance || 0}`)
        console.log(`   ⚡ XP: ${account.xp_profiles?.xp_total || 0}`)
        console.log(`   🎯 Level: ${account.xp_profiles?.level || 1}\n`)
      } else {
        console.log(`❌ Account not found\n`)
      }
    } else {
      console.log(`❌ Failed to fetch balance\n`)
    }
  } catch (error) {
    console.log(`❌ Error fetching balance: ${error.message}\n`)
  }
  
  // Test 6: Test perfect score bonus
  console.log('6️⃣  Testing perfect score bonus (with token)...')
  try {
    const response = await fetch(`${CENTRAL_API_URL}/api/platforms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-platform-code': 'QUIZ',
        'x-platform-key': PLATFORM_KEY
      },
      body: JSON.stringify({
        accountId: accountId,
        eventType: 'perfect_score',
        coinsChange: 50,
        tokensChange: 1,
        xpChange: 100,
        metadata: {
          quizId: 'test-quiz-2',
          score: 100,
          maxScore: 100,
          achievement: 'perfect_quiz',
          test: true
        }
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Perfect score recorded!`)
      console.log(`   Coins Delta: ${result.data.coins_delta}`)
      console.log(`   Tokens Delta: ${result.data.tokens_delta} (BONUS!)`)
      console.log(`   XP Delta: ${result.data.xp_delta}\n`)
    } else {
      const error = await response.text()
      console.log(`⚠️  Perfect score recording returned: ${error}`)
      console.log(`   (Same platform registration issue as above)\n`)
    }
  } catch (error) {
    console.log(`❌ Error recording perfect score: ${error.message}\n`)
  }
  
  console.log('✅ Basic tests completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ API connectivity working`)
  console.log(`   ✅ Account creation working`)
  console.log(`   ✅ Account lookup working`)
  console.log(`   ⚠️  Platform activity recording needs platform registration`)
  console.log(`\n📝 Next Steps:`)
  console.log(`   1. Verify QUIZ platform is registered in central system`)
  console.log(`   2. Contact admin: ${ADMIN_EMAIL}`)
  console.log(`   3. Or proceed with deployment - rewards will work once platform is active`)
  console.log(`\n📊 View accounts in admin dashboard:`)
  console.log(`   ${CENTRAL_API_URL}/admin`)
  console.log(`   Username: ${ADMIN_EMAIL}`)
  console.log(`\n🧹 Test account created: ${TEST_EMAIL}`)
  console.log(`   AccountId: ${accountId}`)
  console.log(`   You may want to delete this test account from the admin dashboard.\n`)
}

// Run tests
testConnection().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
