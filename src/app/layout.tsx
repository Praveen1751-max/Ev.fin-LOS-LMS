import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ev.fin — EV Loan Origination & Management',
  description: 'Greaves Finance — 2W & 3W EV Financing · West Region',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ev.fin',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#0F6E56" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full" style={{ background: 'var(--background)', color: 'var(--ink)' }}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}` }} />
      </body>
    </html>
  )
}
