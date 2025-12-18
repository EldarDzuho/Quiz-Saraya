import { createServerClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ============================================
// QUIZ DATABASE CLIENTS (for quiz/attempt data)
// ============================================

// Singleton instance for service client to avoid connection issues
let serviceClientInstance: SupabaseClient | null = null

export function createSupabaseClient() {
  // Simple client without cookies (for server components that don't need auth)
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createSupabaseServiceClient() {
  if (!serviceClientInstance) {
    serviceClientInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return serviceClientInstance
}

// ============================================
// AUTH CLIENTS (for central account system authentication)
// ============================================

export async function createSupabaseServerClient() {
  // This is the AUTH client - uses the central account system's Supabase
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      cookieOptions: {
        name: 'sb-auth-token',
      },
    }
  )
}
