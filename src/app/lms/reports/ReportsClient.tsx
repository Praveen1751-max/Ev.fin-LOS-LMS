'use client'
import { useState, useMemo } from 'react'
import { Download, BarChart3 } from 'lucide-react'
import { fmtINRShort } from '@/lib/utils/formatters'

interface AppRow { id: string; status: string; oem: string; loan_amount: number; submitted_at: string; state: string; fso_id: string }
interface FsoRow { id: string; name: string }

const OEMS = ['ather', 'ola', 'bajaj', 'river', 'ampere', 'simple']
const STATES = ['Maharashtra', 'Telangana', 'Andhra Pradesh', 'Odisha']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getMonth(iso: string) { return new Date(iso).getMonth() }

export function ReportsClient({ apps, fsos }: { apps: AppRow[]; fsos: FsoRow[] }) {
  const [tab, setTab] = useState<'oem' | 'state' | 'fso' | 'monthly'>('oem')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/reports/export?type=all')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evfin-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const oemData = useMemo(() => OEMS.map(oem => {
    const rows = apps.filter(a => a.oem === oem)
    const disbursed = rows.filter(a => a.status === 'disbursed')
    return {
      oem,
      total: rows.length,
      approved: rows.filter(a => ['approved', 'sanctioned', 'disbursed'].includes(a.status)).length,
      disbursed: disbursed.length,
      volume: disbursed.reduce((s, a) => s + a.loan_amount, 0),
    }
  }).filter(d => d.total > 0), [apps])

  const stateData = useMemo(() => STATES.map(state => {
    const rows = apps.filter(a => a.state === state)
    const disbursed = rows.filter(a => a.status === 'disbursed')
    return {
      state,
      total: rows.length,
      approved: rows.filter(a => ['approved', 'sanctioned', 'disbursed'].includes(a.status)).length,
      volume: disbursed.reduce((s, a) => s + a.loan_amount, 0),
    }
  }), [apps])

  const fsoData = useMemo(() => fsos.map(fso => {
    const rows = apps.filter(a => a.fso_id === fso.id)
    const disbursed = rows.filter(a => a.status === 'disbursed')
    const approved = rows.filter(a => ['approved', 'sanctioned', 'disbursed'].includes(a.status))
    return {
      name: fso.name,
      total: rows.length,
      approved: approved.length,
      approvalRate: rows.length ? Math.round((approved.length / rows.length) * 100) : 0,
      volume: disbursed.reduce((s, a) => s + a.loan_amount, 0),
    }
  }).sort((a, b) => b.volume - a.volume), [apps, fsos])

  const monthlyData = useMemo(() => MONTHS.map((m, i) => {
    const rows = apps.filter(a => getMonth(a.submitted_at) === i)
    const disbursed = rows.filter(a => a.status === 'disbursed')
    return { month: m, total: rows.length, disbursed: disbursed.length, volume: disbursed.reduce((s, a) => s + a.loan_amount, 0) }
  }), [apps])

  const TABS = [
    { id: 'oem' as const, label: 'OEM-wise' },
    { id: 'state' as const, label: 'State-wise' },
    { id: 'fso' as const, label: 'FSO Performance' },
    { id: 'monthly' as const, label: 'Monthly Trend' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Credit Operations · West Region</div>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Reports</h1>
        </div>
        <button className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ height: 36, padding: '0 16px', fontSize: 13, gap: 8 }}>
          <Download size={14} /> {exporting ? 'Exporting…' : 'Export Excel'}
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Applications', value: apps.length },
          { label: 'Disbursed', value: apps.filter(a => a.status === 'disbursed').length },
          { label: 'Total Volume', value: fmtINRShort(apps.filter(a => a.status === 'disbursed').reduce((s, a) => s + a.loan_amount, 0)) },
          { label: 'Approval Rate', value: apps.length ? `${Math.round((apps.filter(a => ['approved','sanctioned','disbursed'].includes(a.status)).length / apps.length) * 100)}%` : '—' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            color: tab === t.id ? 'var(--teal)' : 'var(--ink-3)',
            borderBottom: tab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        {tab === 'oem' && (
          <ReportTable
            headers={['OEM', 'Applications', 'Approved', 'Disbursed', 'Volume']}
            rows={oemData.map(d => [d.oem.toUpperCase(), d.total, d.approved, d.disbursed, fmtINRShort(d.volume)])}
          />
        )}
        {tab === 'state' && (
          <ReportTable
            headers={['State', 'Applications', 'Approved', 'Volume']}
            rows={stateData.map(d => [d.state, d.total, d.approved, fmtINRShort(d.volume)])}
          />
        )}
        {tab === 'fso' && (
          <ReportTable
            headers={['FSO Name', 'Applications', 'Approved', 'Approval Rate', 'Volume']}
            rows={fsoData.map(d => [d.name, d.total, d.approved, `${d.approvalRate}%`, fmtINRShort(d.volume)])}
          />
        )}
        {tab === 'monthly' && (
          <ReportTable
            headers={['Month', 'Applications', 'Disbursed', 'Volume']}
            rows={monthlyData.filter(d => d.total > 0).map(d => [d.month, d.total, d.disbursed, fmtINRShort(d.volume)])}
          />
        )}
      </div>
    </div>
  )
}

function ReportTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: 'var(--bg-2, #f8f8f8)', borderBottom: '1px solid var(--line)' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={headers.length} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>No data</td></tr>
        )}
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--line-2, #f5f5f5)' : 'none' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '12px 16px', textAlign: j === 0 ? 'left' : 'right', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
