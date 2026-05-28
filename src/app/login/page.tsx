'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'
import { Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    // Get role and redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role
    router.push(role === 'fso' ? '/fso/home' : '/lms/dashboard')
  }

  const fillDemo = (type: 'fso' | 'analyst' | 'rcm') => {
    const creds: Record<string, { email: string; password: string }> = {
      fso:     { email: 'fso@evfin.in',          password: 'Test@1234' },
      analyst: { email: 'analyst@evfin.in',       password: 'Test@1234' },
      rcm:     { email: 'rcm@evfin.in',           password: 'Test@1234' },
    }
    setEmail(creds[type].email)
    setPassword(creds[type].password)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--navy) 0%, #073562 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--teal)',
            display: 'grid', placeItems: 'center',
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.01em' }}>ev.fin</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>EV Loan Origination · West Region</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.01em' }}>Sign in</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 24 }}>Access your workspace</p>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@evfin.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)',
                  display: 'grid', placeItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--red-50)', color: 'var(--red)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Sign in'}
          </button>
        </form>

        {/* Demo shortcuts */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Demo accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['fso', 'analyst', 'rcm'] as const).map(type => (
              <button
                key={type}
                onClick={() => fillDemo(type)}
                style={{
                  padding: '8px 4px',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  background: 'var(--line-2)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                {type === 'fso' ? 'FSO' : type === 'analyst' ? 'Analyst' : 'RCM'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
