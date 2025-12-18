'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from './ui/Button'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createSupabaseClient()
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Redirect to login
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Button 
      onClick={handleSignOut}
      variant="danger"
    >
      Sign Out
    </Button>
  )
}
