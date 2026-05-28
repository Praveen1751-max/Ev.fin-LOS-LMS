import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // If env vars are missing (e.g. preview before they're set), pass through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Public paths — always allow through
  const isPublic = path.startsWith('/login') || path.startsWith('/fso/login') || path.startsWith('/api')
  if (!user && !isPublic) {
    // FSO paths → FSO login, everything else → main login
    const loginUrl = path.startsWith('/fso') ? '/fso/login' : '/login'
    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  // Already logged in on a login page → redirect by role
  if (user && (path === '/login' || path === '/fso/login' || path === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    const target = role === 'fso' ? '/fso/home' : '/lms/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // FSO cannot access LMS
  if (user && path.startsWith('/lms')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'fso') {
      return NextResponse.redirect(new URL('/fso/home', request.url))
    }
  }

  // Non-FSO cannot access FSO pages
  if (user && path.startsWith('/fso') && !path.startsWith('/fso/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role && profile.role !== 'fso') {
      return NextResponse.redirect(new URL('/lms/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
