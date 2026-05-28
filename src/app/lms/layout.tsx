import type { Metadata } from 'next'
import { LmsSidebar } from '@/components/lms/LmsSidebar'

export const metadata: Metadata = {
  title: 'ev.fin Credit Ops LMS',
}

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <LmsSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
