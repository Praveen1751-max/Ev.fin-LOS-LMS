'use client'
import { RefreshCw, Download, FileText, Clock, Check, Wallet, Zap } from 'lucide-react'
import { OEMBarChart } from '@/components/charts/OEMBarChart'
import { StatusDonut } from '@/components/charts/StatusDonut'
import { fmtINRShort, calcTATHours } from '@/lib/utils/formatters'
import type { ActivityLog } from '@/lib/types'

interface AppRow { id: string; status: string; oem: string; loan_amount: number; submitted_at: string; state: string }

export function DashboardClient({ apps, activity }: { apps: AppRow[]; activity: ActivityLog[] }) {
  const now = new Date()
  const today = apps.filter(a => new Date(a.submitted_at).toDateString() === now.toDateString())

  const pending   = apps.filter(a => ['submitted', 'under_review', 'query_raised'].includes(a.status))
  const approved  = apps.filter(a => ['approved', 'sanctioned', 'disbursed'].includes(a.status))
  const disbursed = apps.filter(a => a.status === 'disbursed')
  const rejected  = apps.filter(a => a.status === 'rejected')

  const disbursedToday = apps.filter(a => a.status === 'disbursed' && new Date(a.submitted_at).toDateString() === now.toDateString())
  const disbursedTodayAmt = disbursedToday.reduce((s, a) => s + a.loan_amount, 0)

  const avgTat = apps.length ? Math.round(apps.map(a => calcTATHours(a.submitted_at)).reduce((s, t) => s + t, 0) / apps.length) : 0

  // OEM bar data
  const oemData = ['ather', 'ola', 'bajaj', 'river', 'ampere', 'simple'].map(oem => ({
    oem, v: apps.filter(a => a.oem === oem).length,
  })).filter(d => d.v > 0)

  // Status donut
  const total = apps.length
  const donutData = total ? [
    { label: 'Approved',  value: Math.round((approved.length / total) * 100),  color: '#0F6E56' },
    { label: 'Pending',   value: Math.round((pending.length / total) * 100),   color: '#BA7517' },
    { label: 'Rejected',  value: Math.round((rejected.length / total) * 100),  color: '#A32D2D' },
    { label: 'Disbursed', value: Math.round((disbursed.length / total) * 100), color: '#639922' },
  ] : [
    { label: 'Approved', value: 42, color: '#0F6E56' },
    { label: 'Pending',  value: 31, color: '#BA7517' },
    { label: 'Rejected', value: 15, color: '#A32D2D' },
    { label: 'Disbursed',value: 12, color: '#639922' },
  ]

  const kpis = [
    { label: 'Total Applications', value: String(apps.length || 247), delta: '+12% WoW', up: true, icon: <FileText size={12} /> },
    { label: 'Pending Review',     value: String(pending.length || 38), delta: `${pending.filter(a => calcTATHours(a.submitted_at) > 48).length} over SLA`, up: false, icon: <Clock size={12} />, color: 'var(--amber)' },
    { label: 'Approved Today',     value: String(today.filter(a => ['approved','sanctioned','disbursed'].includes(a.status)).length || 12), delta: '71% approval rate', up: true, icon: <Check size={12} />, color: 'var(--teal)' },
    { label: 'Disbursed Today',    value: fmtINRShort(disbursedTodayAmt || 1840000), delta: '+₹3.2L vs avg', up: true, icon: <Wallet size={12} /> },
    { label: 'Avg TAT',            value: `${avgTat || 31}h`, delta: 'target <48h', up: true, icon: <Zap size={12} /> },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Credit Operations · West Region</div>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <a href="/api/reports/export?type=all" className="btn btn-primary" style={{ height: 36, padding: '0 14px', fontSize: 13, textDecoration: 'none' }}>
            <Download size={14} /> Export
          </a>
        </div>
      </div>

      {/* KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              {k.icon} {k.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, color: k.color ?? 'var(--ink)' }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: k.up ? 'var(--teal)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>OEM-wise applications</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>May 2026 · West Region</div>
          <OEMBarChart data={oemData.length ? oemData : undefined} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Application status split</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>May 2026 · all states</div>
          <StatusDonut data={donutData} total={donutData.reduce((s, d) => s + d.value, 0)} />
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Recent activity</h3>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>Latest credit ops actions</div>
        <div>
          {(activity.length ? activity : DEMO_ACTIVITY).map((it, i) => {
            const action = typeof it.action === 'string' ? it.action : ''
            const dotColor = action.includes('approve') ? 'var(--teal)'
              : action.includes('reject') ? 'var(--red)'
              : action.includes('query') ? 'var(--amber)'
              : action.includes('disburse') ? 'var(--lime)'
              : 'var(--blue)'
            return (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line-2)', fontSize: 13, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div>
                    <b>{(it as ActivityLog & { actor?: { name: string } }).actor?.name ?? 'System'}</b>
                    {' '}{action.replace('decision:', '').replace('_', ' ')}
                    {it.meta && typeof it.meta === 'object' && 'reason' in it.meta && (
                      <span style={{ color: 'var(--ink-3)' }}> — {String(it.meta.reason)}</span>
                    )}
                  </div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 11, marginTop: 2 }}>
                    {new Date(it.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const DEMO_ACTIVITY = [
  { action: 'decision:approve',  actor: { name: 'Aman Verma' },   meta: { reason: 'CIBIL 758 · LTV 78%' }, created_at: new Date(Date.now() - 12 * 60000).toISOString() },
  { action: 'decision:query',    actor: { name: 'Sneha Iyer' },    meta: { reason: 'Income proof — re-upload' }, created_at: new Date(Date.now() - 38 * 60000).toISOString() },
  { action: 'decision:approve',  actor: { name: 'Aman Verma' },   meta: { reason: 'Auto-approve eligible' }, created_at: new Date(Date.now() - 3600000).toISOString() },
  { action: 'decision:disburse', actor: { name: 'Disbursement' }, meta: { reason: 'TXN20260526001442' }, created_at: new Date(Date.now() - 7200000).toISOString() },
  { action: 'decision:reject',   actor: { name: 'Aman Verma' },   meta: { reason: 'CIBIL below cut-off (612)' }, created_at: new Date(Date.now() - 10800000).toISOString() },
] as unknown as ActivityLog[]
