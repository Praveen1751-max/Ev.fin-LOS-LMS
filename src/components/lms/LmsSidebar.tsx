'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, List, FileSearch, Wallet, BarChart3, Settings, Zap, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/lms/dashboard',    label: 'Dashboard',         icon: <LayoutDashboard size={18} /> },
  { href: '/lms/queue',        label: 'Application Queue', icon: <List size={18} /> },
  { href: '/lms/disbursement', label: 'Disbursement',      icon: <Wallet size={18} /> },
  { href: '/lms/reports',      label: 'Reports',           icon: <BarChart3 size={18} /> },
]

export function LmsSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 64,
      background: 'var(--navy)',
      color: 'rgba(255,255,255,0.7)',
      padding: '16px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      transition: 'width 200ms ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.width = '220px' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.width = '64px' }}
    >
      {/* Brand */}
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, background: 'var(--teal)', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
          <Zap size={16} />
        </div>
        <span style={{ fontWeight: 600, color: '#fff', fontSize: 14, opacity: 0, transition: 'opacity 120ms', whiteSpace: 'nowrap' }}
          className="nav-lbl">ev.fin · LMS</span>
      </div>

      {NAV.map(n => {
        const isActive = pathname === n.href || (n.href !== '/lms/dashboard' && pathname.startsWith(n.href))
        return (
          <Link key={n.href} href={n.href} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            height: 44, padding: '0 20px', margin: '0 8px',
            borderRadius: 10,
            background: isActive ? 'rgba(99,153,34,0.16)' : 'transparent',
            color: isActive ? '#b9e070' : 'inherit',
            textDecoration: 'none', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500,
          }}>
            <span style={{ flexShrink: 0 }}>{n.icon}</span>
            <span style={{ opacity: 0, transition: 'opacity 120ms' }} className="nav-lbl">{n.label}</span>
          </Link>
        )
      })}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 16px' }} />

      <Link href="/lms/settings" style={{
        display: 'flex', alignItems: 'center', gap: 14, height: 44, padding: '0 20px', margin: '0 8px',
        borderRadius: 10, color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500,
      }}>
        <Settings size={18} />
        <span style={{ opacity: 0, transition: 'opacity 120ms' }} className="nav-lbl">Settings</span>
      </Link>

      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: 14, height: 44, padding: '0 20px', margin: '0 8px',
        borderRadius: 10, background: 'none', border: 0,
        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
        fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
      }}>
        <LogOut size={18} />
        <span style={{ opacity: 0, transition: 'opacity 120ms' }} className="nav-lbl">Sign out</span>
      </button>

      <style>{`
        aside:hover .nav-lbl { opacity: 1 !important; }
      `}</style>
    </aside>
  )
}
