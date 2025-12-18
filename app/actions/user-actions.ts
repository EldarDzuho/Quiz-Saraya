'use server'

import { createSupabaseServerClient } from '@/lib/supabase'
import { createCentralAccount, getUserBalance } from '@/lib/central-account'
import { createSupabaseServiceClient } from '@/lib/supabase'

/**
 * Handle user signup - create Supabase auth account and central account
 */
export async function handleUserSignup(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string; accountId?: string }> {
  try {
    // Create account in central system
    const centralResult = await createCentralAccount(email, name, password)
    
    if (!centralResult.success || !centralResult.accountId) {
      return { success: false, error: centralResult.error || 'Failed to create account' }
    }

    // Store accountId in Supabase User table
    const supabase = createSupabaseServiceClient()
    
    // Check if user record exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (!existingUser) {
      // Create user record with accountId
      const { nanoid } = await import('nanoid')
      const userId = 'u' + nanoid(24)
      
      const { error: userError } = await supabase
        .from('User')
        .insert({
          id: userId,
          email,
          name,
          accountId: centralResult.accountId
        })

      if (userError) {
        console.error('Error creating user record:', userError)
        // Don't fail the whole operation if user record creation fails
      }
    }

    return { 
      success: true, 
      accountId: centralResult.accountId 
    }
  } catch (error) {
    console.error('Error in handleUserSignup:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get or create user's accountId from their email
 */
export async function getOrCreateUserAccountId(email: string, name?: string): Promise<string | null> {
  try {
    const supabase = createSupabaseServiceClient()
    
    // Check if user exists in our database
    const { data: user } = await supabase
      .from('User')
      .select('accountId')
      .eq('email', email)
      .single()

    if (user?.accountId) {
      return user.accountId
    }

    // If not in database, check central system
    const { checkAccountExists } = await import('@/lib/central-account')
    const account = await checkAccountExists(email)
    
    if (account) {
      // Save to our database
      const { nanoid } = await import('nanoid')
      const userId = 'u' + nanoid(24)
      
      await supabase
        .from('User')
        .insert({
          id: userId,
          email,
          name: name || account.name,
          accountId: account.id
        })
      
      return account.id
    }

    return null
  } catch (error) {
    console.error('Error getting user accountId:', error)
    return null
  }
}

/**
 * Get user's current balance
 */
export async function getUserBalanceAction(email: string) {
  try {
    const balance = await getUserBalance(email)
    return balance
  } catch (error) {
    console.error('Error getting user balance:', error)
    return null
  }
}
