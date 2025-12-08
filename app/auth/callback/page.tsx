'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  useEffect(() => {
    const supabase = createSupabaseClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push(redirect)
      } else {
        router.push('/auth/login')
      }
    })
  }, [router, redirect])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-900">Completing sign in...</p>
      </div>
    </div>
  )
}
