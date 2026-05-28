'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'
import { Eye, EyeOff, Zap } from 'lucide-react'

export default function FsoLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr || !data.user) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    // Fetch profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'fso') {
      setError('This app is for Field Sales Officers only. Please use the web portal.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.replace('/fso/home')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #042C53 0%, #073562 60%, #0F6E56 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'rgba(255,255,255,0.12)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 14px',
          backdropFilter: 'blur(10px)',
        }}>
          <Zap size={32} color="#b9e070" />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>ev.fin</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Field Sales Officer App</div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '32px 28px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em', color: 'var(--navy)' }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24 }}>Sign in to start capturing leads</p>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="label">Work Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@evfin.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
                required
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)',
                display: 'grid', placeItems: 'center', padding: 4,
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: '#fff0f0', color: 'var(--red)',
              fontSize: 13, border: '1px solid #ffd0d0',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: 48, fontSize: 15, fontWeight: 600, borderRadius: 12, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? <Spinner size={18} /> : 'Sign in →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--ink-4)' }}>
          Greaves Finance Limited · ev.fin West Region
        </div>
      </div>
    </div>
  )
}
