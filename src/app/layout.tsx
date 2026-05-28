import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ev.fin — EV Loan Origination & Management',
  description: 'Greaves Finance — 2W & 3W EV Financing · West Region',
  manifest: '/manifest.json',
  themeColor: '#0F6E56',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" style={{ background: 'var(--background)', color: 'var(--ink)' }}>
        {children}
      </body>
    </html>
  )
}
