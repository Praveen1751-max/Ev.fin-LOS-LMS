'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { calcTATHours, tatColor, tatBg, fmtINR, fmtDateTime } from '@/lib/utils/formatters'
import type { AppStatus } from '@/lib/types'

interface QueueRow {
  id: string
  app_number: string
  status: AppStatus
  oem: string
  model: string
  loan_amount: number
  submitted_at: string
  customer_name: string
  city: string
  state: string
  fso?: { name: string } | null
  dealer?: { name: string; city: string } | null
}

const STATUS_TABS: { label: string; value: AppStatus | 'all' }[] = [
  { label: 'All Active', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Query Raised', value: 'query_raised' },
  { label: 'Referred to RCM', value: 'referred_to_rcm' },
]

export function QueueClient({ apps }: { apps: QueueRow[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<AppStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<'submitted_at' | 'loan_amount' | 'tat'>('submitted_at')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let rows = tab === 'all' ? apps : apps.filter(a => a.status === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(a =>
        a.app_number?.toLowerCase().includes(q) ||
        a.customer_name?.toLowerCase().includes(q) ||
        a.oem?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q)
      )
    }
    rows = [...rows].sort((a, b) => {
      let av: number, bv: number
      if (sortCol === 'loan_amount') { av = a.loan_amount; bv = b.loan_amount }
      else if (sortCol === 'tat') { av = calcTATHours(a.submitted_at); bv = calcTATHours(b.submitted_at) }
      else { av = new Date(a.submitted_at).getTime(); bv = new Date(b.submitted_at).getTime() }
      return sortAsc ? av - bv : bv - av
    })
    return rows
  }, [apps, tab, search, sortCol, sortAsc])

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(p => !p)
    else { setSortCol(col); setSortAsc(true) }
  }

  const SortBtn = ({ col, label }: { col: typeof sortCol; label: string }) => (
    <button onClick={() => toggleSort(col)} style={{ background: 'none', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 12, color: sortCol === col ? 'var(--teal)' : 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
      {label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Credit Operations · West Region</div>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Application Queue</h1>
        </div>
        <button className="btn btn-secondary" style={{ height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => router.refresh()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {STATUS_TABS.map(t => {
          const count = t.value === 'all' ? apps.length : apps.filter(a => a.status === t.value).length
          return (
            <button key={t.value} onClick={() => setTab(t.value)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              color: tab === t.value ? 'var(--teal)' : 'var(--ink-3)',
              borderBottom: tab === t.value ? '2px solid var(--teal)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t.label} <span style={{ fontSize: 11, background: tab === t.value ? 'var(--teal)' : 'var(--line)', color: tab === t.value ? '#fff' : 'var(--ink-3)', borderRadius: 10, padding: '1px 6px', marginLeft: 4 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, app#, OEM, city…" style={{ paddingLeft: 34, height: 36, fontSize: 13 }} />
        </div>
        <button className="btn btn-secondary" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
          <SlidersHorizontal size={14} /> Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2, #f5f5f5)', borderBottom: '1px solid var(--line)' }}>
              {[
                { w: 130, label: 'App #' },
                { w: 160, label: 'Customer' },
                { w: 110, label: 'Status' },
                { w: 80,  label: 'OEM' },
                { w: 120, label: <SortBtn col="loan_amount" label="Loan Amt" /> },
                { w: 120, label: <SortBtn col="submitted_at" label="Submitted" /> },
                { w: 90,  label: <SortBtn col="tat" label="TAT" /> },
                { w: 140, label: 'FSO' },
                { w: 80,  label: '' },
              ].map((col, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', width: col.w }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No applications match your filters.</td></tr>
            )}
            {filtered.map((app, i) => {
              const tat = calcTATHours(app.submitted_at)
              return (
                <tr key={app.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line-2, #f0f0f0)' : 'none', transition: 'background 120ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2, #fafafa)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>{app.app_number}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{app.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{app.city}, {app.state}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={app.status} /></td>
                  <td style={{ padding: '12px 14px', textTransform: 'capitalize', fontWeight: 500 }}>{app.oem}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>₹{(app.loan_amount / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '12px 14px', color: 'var(--ink-2)', fontSize: 12 }}>{fmtDateTime(app.submitted_at)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: tatBg(tat), color: tatColor(tat), borderRadius: 8, padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>{tat}h</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--ink-2)', fontSize: 12 }}>{app.fso?.name ?? '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button className="btn btn-primary" style={{ height: 30, padding: '0 12px', fontSize: 12 }} onClick={() => router.push(`/lms/review/${app.id}`)}>
                      Review →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} application{filtered.length !== 1 ? 's' : ''} shown</div>
    </div>
  )
}
