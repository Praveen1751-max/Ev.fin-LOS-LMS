'use client'
import type { AppStatus } from '@/lib/types'
import { STATUS_META } from '@/lib/types'

const CLS_MAP: Record<string, string> = {
  submitted:    'b-blue',
  under_review: 'b-blue',
  query_raised: 'b-amber',
  approved:     'b-teal',
  rejected:     'b-red',
  sanctioned:   'b-purple',
  disbursed:    'b-lime',
}

export function StatusBadge({ status, dot = true }: { status: AppStatus | string; dot?: boolean }) {
  const meta = STATUS_META[status as AppStatus] ?? { label: status, color: '#6A7872', bg: '#F0F3F1' }
  const cls = CLS_MAP[status] ?? 'b-gray'
  return (
    <span className={`badge ${cls}`}>
      {dot && <span className="dot" />}
      {meta.label}
    </span>
  )
}
