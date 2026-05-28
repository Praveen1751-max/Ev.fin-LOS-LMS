'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Plus, List, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface FsoShellProps {
  profile: Profile | null
  children: React.ReactNode
}

export function FsoShell({ profile, children }: FsoShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tabs = [
    { href: '/fso/home',      label: 'Home',     icon: <Home size={20} /> },
    { href: '/fso/new-loan',  label: 'New Loan', icon: <Plus size={20} />, isFab: true },
    { href: '/fso/my-cases',  label: 'My Cases', icon: <List size={20} /> },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#F4F6F5',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--surface)',
        fontSize: 12, fontWeight: 600,
      }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 6, color: 'var(--ink-3)' }}>
          <span>●●●●</span>
          <span>WiFi</span>
          <span>🔋</span>
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '8px 16px 24px',
        scrollbarWidth: 'none',
      }}>
        {children}
      </div>

      {/* Bottom tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: '6px 8px 20px',
        flexShrink: 0,
      }}>
        {tabs.map(tab => {
          const isActive = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 4px',
              color: tab.isFab ? '#fff' : isActive ? 'var(--teal)' : 'var(--ink-4)',
              fontSize: 10, fontWeight: 500,
              textDecoration: 'none',
              position: 'relative',
            }}>
              {tab.isFab ? (
                <>
                  <span style={{
                    position: 'absolute',
                    inset: '-2px 6px 4px 6px',
                    background: 'var(--teal)',
                    borderRadius: 14,
                    zIndex: 0,
                  }} />
                  <span style={{ position: 'relative', zIndex: 1, color: '#fff' }}>{tab.icon}</span>
                  <span style={{ position: 'relative', zIndex: 1, color: '#fff' }}>{tab.label}</span>
                </>
              ) : (
                <>
                  {tab.icon}
                  <span>{tab.label}</span>
                </>
              )}
            </Link>
          )
        })}

        {/* Profile tab with logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 4px',
            border: 0, background: 'transparent',
            color: 'var(--ink-4)',
            fontSize: 10, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <User size={20} />
          <span>{profile?.name?.split(' ')[0] ?? 'Profile'}</span>
        </button>
      </div>
    </div>
  )
}
