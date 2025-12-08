'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createSupabaseClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Use singleton client from lib
  const supabase = useMemo(() => createSupabaseClient(), [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // TEMPORARY BYPASS - Remove this later and restore Supabase auth
    if (email === 'admin@saraya.com' && password === 'admin123') {
      // Set cookie directly in the browser
      document.cookie = 'temp_auth=true; path=/; max-age=' + (60 * 60 * 24 * 7)
      console.log('Cookie set:', document.cookie)
      
      // Small delay to ensure cookie is written
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.href = redirect
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.session) {
        // Give the session a moment to be stored in cookies
        await new Promise(resolve => setTimeout(resolve, 100))
        // Use window.location for a hard redirect to ensure session is properly loaded
        window.location.href = redirect
      }
    } catch (err) {
      setError('An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Saraya Quiz Admin</h1>
        <p className="text-gray-900 text-center mb-8">Sign in to manage quizzes</p>
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-sm text-gray-800 text-center mt-6">
          Only users added in Supabase can access the admin panel
        </p>
      </div>
    </div>
  )
}
