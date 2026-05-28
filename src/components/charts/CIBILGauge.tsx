'use client'

export function CIBILGauge({ score = 724 }: { score?: number }) {
  const min = 300, max = 900
  const pct = Math.min(Math.max((score - min) / (max - min), 0), 1)
  const angle = -Math.PI + pct * Math.PI
  const cx = 90, cy = 90, R = 64
  const x = cx + R * Math.cos(angle)
  const y = cy + R * Math.sin(angle)

  const seg = (a0: number, a1: number, color: string) => {
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
    return <path d={`M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`}
      stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
  }

  const s1 = -Math.PI + Math.PI * 0.33
  const s2 = -Math.PI + Math.PI * 0.55
  const s3 = -Math.PI + Math.PI * 0.75
  const cat = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor'
  const catColor = score >= 750 ? '#0F6E56' : score >= 700 ? '#639922' : score >= 650 ? '#BA7517' : '#A32D2D'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 0' }}>
      <svg width="180" height="110" viewBox="0 0 180 100">
        {seg(-Math.PI, s1, '#A32D2D')}
        {seg(s1, s2, '#BA7517')}
        {seg(s2, s3, '#639922')}
        {seg(s3, 0, '#0F6E56')}
        <circle cx={x} cy={y} r="6" fill="#fff" stroke="#0E1A14" strokeWidth="2.5" />
        <text x="22" y="98" fontSize="10" fill="#9AA6A1">300</text>
        <text x="158" y="98" fontSize="10" fill="#9AA6A1">900</text>
      </svg>
      <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, marginTop: -54 }}>{score}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>CIBIL Score</div>
      <span className="badge" style={{ background: catColor + '22', color: catColor, marginTop: 8 }}>
        <span className="dot" style={{ background: catColor }} /> {cat}
      </span>
    </div>
  )
}
