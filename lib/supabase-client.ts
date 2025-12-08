import { createClient } from '@supabase/supabase-js'

// Singleton client for browser usage
let browserClient: ReturnType<typeof createClient> | null = null

export function createSupabaseClient() {
  if (typeof window !== 'undefined') {
    // Browser: use singleton to avoid multiple instance warnings
    if (!browserClient) {
      browserClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return browserClient
  }
  
  // Server: create new instance (shouldn't be used from client components)
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
