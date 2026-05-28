import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ role: null, error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch profile using server client (uses service role key — bypasses RLS issues)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ role: null, error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ role: profile.role, name: profile.name })
  } catch (err) {
    console.error('Role API error:', err)
    return NextResponse.json({ role: null, error: 'Server error' }, { status: 500 })
  }
}
