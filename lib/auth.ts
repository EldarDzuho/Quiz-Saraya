import { createSupabaseServerClient } from './supabase'
import { cookies } from 'next/headers'

export async function getSession() {
  // TEMPORARY BYPASS - Check for temp auth cookie
  const cookieStore = await cookies()
  const tempAuth = cookieStore.get('temp_auth')
  
  if (tempAuth?.value === 'true') {
    // Return a mock session for temp auth
    return {
      user: { id: 'temp-admin', email: 'admin@saraya.com' },
      access_token: 'temp',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      refresh_token: 'temp',
    } as any
  }
  
  const supabase = await createSupabaseServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  
  // User must have a valid Supabase Auth session OR temp auth
  // All users in the Supabase Auth users table are considered admins
  return !!session?.user
}

export async function requireAdmin() {
  const admin = await isAdmin()
  
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  const session = await getSession()
  return session!
}
