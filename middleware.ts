import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // TEMPORARY BYPASS - Check for temp_auth in cookie
  const tempAuth = request.cookies.get('temp_auth')
  console.log('Middleware - Checking auth:', { 
    pathname, 
    hasCookie: !!tempAuth, 
    cookieValue: tempAuth?.value,
    allCookies: request.cookies.getAll().map(c => c.name)
  })
  
  if (tempAuth?.value === 'true') {
    console.log('Middleware - Allowing access with temp auth')
    return NextResponse.next()
  }

  // Check for session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // No session, redirect to login
  if (!session) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // All authenticated Supabase users are admins
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
