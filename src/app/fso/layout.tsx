import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ev.fin Field App',
  description: 'FSO Loan Origination · ev.fin West Region',
}

export default function FsoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F6F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Mobile device frame */}
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100vh',
        background: 'var(--surface)',
        position: 'relative',
        boxShadow: '0 0 60px rgba(4,44,83,0.15)',
      }}>
        {children}
      </div>
    </div>
  )
}
