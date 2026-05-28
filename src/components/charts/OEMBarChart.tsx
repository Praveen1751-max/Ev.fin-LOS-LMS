'use client'

const OEM_COLORS: Record<string, string> = {
  ather: '#1F2C36', ola: '#C60000', bajaj: '#1A4789',
  river: '#0E5E48', ampere: '#B61F2B', simple: '#1F1F1F',
}
const OEM_LABELS: Record<string, string> = {
  ather: 'Ather', ola: 'Ola', bajaj: 'Bajaj',
  river: 'River', ampere: 'Ampere', simple: 'Simple',
}

interface OEMData { oem: string; v: number }

export function OEMBarChart({ data }: { data?: OEMData[] }) {
  const d = data ?? [
    { oem: 'ather', v: 67 }, { oem: 'ola', v: 52 }, { oem: 'bajaj', v: 48 },
    { oem: 'river', v: 38 }, { oem: 'ampere', v: 28 }, { oem: 'simple', v: 14 },
  ]
  const max = 80
  const w = 460, h = 240, padL = 40, padT = 16, padB = 36
  const cw = (w - padL - 20) / d.length

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {[0, 20, 40, 60, 80].map(g => {
        const y = padT + ((max - g) / max) * (h - padT - padB)
        return (
          <g key={g}>
            <line x1={padL} x2={w - 12} y1={y} y2={y} stroke="#EFF2F0" strokeWidth="1" />
            <text x="32" y={y + 3} fontSize="10" fill="#9AA6A1" textAnchor="end">{g}</text>
          </g>
        )
      })}
      {d.map((item, i) => {
        const bh = (item.v / max) * (h - padT - padB)
        const x = padL + i * cw + 6
        const y = padT + (h - padT - padB) - bh
        return (
          <g key={item.oem}>
            <rect x={x} y={y} width={cw - 16} height={bh} rx="4"
              fill={OEM_COLORS[item.oem] ?? '#6A7872'} opacity="0.9" />
            <text x={x + (cw - 16) / 2} y={y - 6} fontSize="11" fontWeight="600"
              fill="#0E1A14" textAnchor="middle">{item.v}</text>
            <text x={x + (cw - 16) / 2} y={h - padB + 16} fontSize="11"
              fill="#6A7872" textAnchor="middle">{OEM_LABELS[item.oem] ?? item.oem}</text>
          </g>
        )
      })}
    </svg>
  )
}
