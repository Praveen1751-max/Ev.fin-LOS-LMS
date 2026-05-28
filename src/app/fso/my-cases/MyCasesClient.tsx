'use client'
import { useState } from 'react'
import { Search, Info, Upload, MapPin } from 'lucide-react'
import { FsoShell } from '@/components/fso/FsoShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { fmtINRShort } from '@/lib/utils/formatters'
import { OEM_CONFIG } from '@/lib/types'
import type { Profile, Application } from '@/lib/types'

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'review',   label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'disbursed',label: 'Disbursed' },
]

export function MyCasesClient({ profile, applications }: { profile: Profile | null; applications: Application[] }) {
  const [filter, setFilter] = useState('all')
  const [toastNode, showToast] = useToast()

  const counts: Record<string, number> = {
    all:      applications.length,
    pending:  applications.filter(a => ['submitted', 'query_raised'].includes(a.status)).length,
    review:   applications.filter(a => a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    disbursed:applications.filter(a => a.status === 'disbursed').length,
  }

  const visible = applications.filter(a => {
    if (filter === 'all')      return true
    if (filter === 'pending')  return ['submitted', 'query_raised'].includes(a.status)
    if (filter === 'review')   return a.status === 'under_review'
    if (filter === 'approved') return a.status === 'approved'
    if (filter === 'disbursed')return a.status === 'disbursed'
    return true
  })

  return (
    <FsoShell profile={profile}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, paddingTop: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 2 }}>All your applications</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>My cases</h1>
        </div>
        <button style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
          <Search size={18} />
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 10px', margin: '0 -16px', paddingLeft: 16, paddingRight: 16, scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              border: '1px solid', borderRadius: 999, padding: '6px 12px',
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
              borderColor: filter === f.id ? 'var(--navy)' : 'var(--line)',
              background: filter === f.id ? 'var(--navy)' : 'var(--surface)',
              color: filter === f.id ? '#fff' : 'var(--ink-2)',
            }}
          >
            {f.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)', fontSize: 13 }}>
          No applications match this filter
        </div>
      ) : visible.map(app => (
        <div key={app.id}>
          {app.status === 'query_raised' && app.queries && app.queries.length > 0 ? (
            <QueryCard app={app} onUpload={() => showToast('Document re-uploaded — re-review queued')} />
          ) : (
            <AppCard app={app} />
          )}
        </div>
      ))}

      {toastNode}
    </FsoShell>
  )
}

function AppCard({ app }: { app: Application }) {
  const oem = OEM_CONFIG[app.oem]
  const daysAgo = Math.floor((Date.now() - new Date(app.submitted_at).getTime()) / 86_400_000)
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'monospace', marginBottom: 6 }}>{app.app_number}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{app.customer_name}</div>
        <StatusBadge status={app.status} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
          <b style={{ color: 'var(--ink)' }}>{oem?.label ?? app.oem}</b>
          <span>·</span>
          <span>{app.vehicle_model}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600 }}>{fmtINRShort(app.loan_amount)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 4, alignItems: 'center' }}>
          <MapPin size={11} /> {app.city}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{daysAgo}d ago</div>
      </div>
    </div>
  )
}

function QueryCard({ app, onUpload }: { app: Application; onUpload: () => void }) {
  const latestQuery = app.queries?.[0]
  return (
    <div style={{ borderRadius: 14, marginBottom: 10, border: '1px solid var(--amber)', overflow: 'hidden' }}>
      <div style={{
        background: 'var(--amber-50)', color: 'var(--amber)',
        padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
        borderBottom: '1px solid rgba(186,117,23,0.2)',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--amber)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Info size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600 }}>Query raised on {app.app_number}</h4>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>
            {latestQuery?.message ?? 'Credit ops has raised a query on this application'}
          </p>
          <button className="btn btn-primary" style={{ marginTop: 10, height: 34, fontSize: 12 }} onClick={onUpload}>
            <Upload size={12} /> Re-upload document
          </button>
        </div>
      </div>
      <div style={{ padding: 12, background: 'var(--surface)' }}>
        <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'monospace', marginBottom: 6 }}>{app.app_number}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{app.customer_name}</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtINRShort(app.loan_amount)}</div>
        </div>
      </div>
    </div>
  )
}
