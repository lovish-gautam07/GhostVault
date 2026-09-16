import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GhostVault — Encrypted Digital Legacy Manager',
  description: 'Securely store sensitive information with automatic emergency access. Client-side AES-256-GCM encryption, dead man\'s switch, and trusted contact release.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-vault-50 dark:bg-vault-950 text-vault-900 dark:text-vault-100 antialiased">
        {children}
      </body>
    </html>
  )
}
