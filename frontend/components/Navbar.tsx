'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShieldLock, LogOut } from './Icons'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user from localStorage', e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('masterPassword')
    router.push('/login')
  }

  return (
    <nav className="bg-white dark:bg-vault-900 border-b border-vault-200 dark:border-vault-700 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-3">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-vault-900 dark:text-vault-100 hover:opacity-90 transition-opacity">
              <ShieldLock size={22} className="text-accent-600 dark:text-accent-400" />
              <span className="font-semibold text-base tracking-tight">GhostVault</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-vault-400 border border-vault-200 dark:border-vault-700 px-1.5 py-0.5 rounded">
              AES-256-GCM
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-medium text-vault-900 dark:text-vault-100">{user.name}</span>
                  <span className="text-[11px] text-vault-400 font-mono">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs text-vault-600 dark:text-vault-300 hover:text-vault-900 dark:hover:text-white bg-vault-100 dark:bg-vault-800 hover:bg-vault-200 dark:hover:bg-vault-700 px-3 py-1.5 rounded-md border border-vault-200 dark:border-vault-700 transition-colors"
                  title="Sign out and clear session keys"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-vault-600 dark:text-vault-300 hover:text-vault-900 dark:hover:text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold bg-accent-600 text-white hover:bg-accent-700 px-3.5 py-1.5 rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
