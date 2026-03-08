import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sniper - Autonomous Sourcing Agent',
  description: 'The world\'s first autonomous global sourcing agent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-brand-light min-h-screen text-brand-dark font-sans antialiased selection:bg-brand-orange selection:text-white">
        {children}
      </body>
    </html>
  )
}
