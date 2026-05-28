'use client'
import Link from 'next/link'
import { Bell, Zap, Plus, ChevronRight, MapPin } from 'lucide-react'
import { FsoShell } from '@/components/fso/FsoShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { fmtINRShort } from '@/lib/utils/formatters'
import { OEM_CONFIG } from '@/lib/types'
import type { Profile, Application } from '@/lib/types'

export function FsoHomeClient({ profile, applications }: { profile: Profile | null; applications: Application[] }) {
  const now = new Date()
  const today = applications.filter(a =>
    new Date(a.submitted_at).toDateString() === now.toDateString()
  )
  const approved = applications.filter(a => a.status === 'approved' || a.status === 'disbursed')
  const pending  = applications.filter(a => ['submitted', 'under_review', 'query_raised'].includes(a.status))
  const disbursedAmt = applications.filter(a => a.status === 'disbursed')
    .reduce((s, a) => s + a.loan_amount, 0)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'
  const initials = profile?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  return (
    <FsoShell profile={profile}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18, paddingTop: 4 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-700) 100%)',
          color: '#fff', display: 'grid', placeItems: 'center',
          fontWeight: 600, fontSize: 16,
          boxShadow: '0 4px 10px rgba(15,110,86,0.25)',
        }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 2 }}>{greeting}</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {profile?.name ?? 'Field Officer'} · FSO
          </div>
        </div>
        <button style={{
          width: 38, height: 38, display: 'grid', placeItems: 'center',
          borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)',
          color: 'var(--ink-2)', position: 'relative',
        }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 9, right: 10, width: 7, height: 7,
            borderRadius: '50%', background: 'var(--amber)', border: '2px solid var(--surface)',
          }} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <div style={{
          gridColumn: '1/-1',
          background: 'linear-gradient(135deg, var(--navy) 0%, #073562 100%)',
          borderRadius: 14, padding: 14, color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <span style={{
            position: 'absolute', right: 14, top: 14,
            fontSize: 10, padding: '3px 8px', borderRadius: 20,
            background: 'rgba(99,153,34,0.18)', color: '#b9e070',
            border: '1px solid rgba(99,153,34,0.3)',
          }}>FY27 target ₹8L</span>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} /> MTD Disbursed
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {fmtINRShort(disbursedAmt || 420000)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {approved.length} units · to target
          </div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Today&apos;s leads</div>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{today.length}</div>
          <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4 }}>All time: {applications.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Approved</div>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{approved.length}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Avg TAT 31h</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pending</div>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, color: 'var(--amber)' }}>{pending.length}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
            {applications.filter(a => a.status === 'query_raised').length} query open
          </div>
        </div>
      </div>

      {/* New Loan CTA */}
      <Link href="/fso/new-loan" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(135deg, var(--teal) 0%, #14856a 100%)',
        color: '#fff', borderRadius: 14, padding: 16, marginBottom: 18,
        textDecoration: 'none', boxShadow: '0 6px 16px rgba(15,110,86,0.25)',
      }}>
        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'grid', placeItems: 'center' }}>
          <Plus size={20} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>New Loan Application</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Start a lead in under 2 minutes</div>
        </div>
        <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
      </Link>

      {/* Recent Applications */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 4px 10px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Recent applications</h2>
        <Link href="/fso/my-cases" style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500, textDecoration: 'none' }}>View all</Link>
      </div>

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)', fontSize: 13 }}>
          No applications yet. Start your first loan!
        </div>
      ) : applications.slice(0, 5).map(app => (
        <AppCard key={app.id} app={app} />
      ))}
    </FsoShell>
  )
}

function AppCard({ app }: { app: Application }) {
  const oem = OEM_CONFIG[app.oem]
  const daysAgo = Math.floor((Date.now() - new Date(app.submitted_at).getTime()) / 86_400_000)
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14, padding: 14, marginBottom: 10,
      border: '1px solid var(--line)', cursor: 'pointer',
    }}>
      <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'monospace', marginBottom: 6, letterSpacing: '0.02em' }}>
        {app.app_number}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{app.customer_name}</div>
        <StatusBadge status={app.status} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
          <b style={{ color: 'var(--ink)' }}>{oem?.label ?? app.oem}</b>
          <span style={{ color: 'var(--line)' }}>·</span>
          <span>{app.vehicle_model}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600 }}>{fmtINRShort(app.loan_amount)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 4, fontSize: 11, color: 'var(--ink-3)', alignItems: 'center' }}>
          <MapPin size={11} /> {app.city}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{daysAgo}d ago</div>
      </div>
    </div>
  )
}
