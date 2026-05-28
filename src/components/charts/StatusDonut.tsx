'use client'

interface Segment { label: string; value: number; color: string }

export function StatusDonut({ data, total }: { data?: Segment[]; total?: number }) {
  const d: Segment[] = data ?? [
    { label: 'Approved',  value: 42, color: '#0F6E56' },
    { label: 'Pending',   value: 31, color: '#BA7517' },
    { label: 'Rejected',  value: 15, color: '#A32D2D' },
    { label: 'Disbursed', value: 12, color: '#639922' },
  ]
  const sum = total ?? d.reduce((s, x) => s + x.value, 0)
  const cx = 90, cy = 90, R = 70, r = 46
  let cum = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {d.map(seg => {
          const frac = seg.value / sum
          const a0 = cum * 2 * Math.PI - Math.PI / 2
          cum += frac
          const a1 = cum * 2 * Math.PI - Math.PI / 2
          const large = frac > 0.5 ? 1 : 0
          const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
          const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
          const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1)
          const xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0)
          return (
            <path key={seg.label}
              d={`M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${r},${r} 0 ${large} 0 ${xi0},${yi0} Z`}
              fill={seg.color} />
          )
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="600" fill="#0E1A14">{sum}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#6A7872">applications</text>
      </svg>
      <div style={{ flex: 1 }}>
        {d.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--ink-2)', flex: 1 }}>{seg.label}</span>
            <span style={{ fontWeight: 600 }}>{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
