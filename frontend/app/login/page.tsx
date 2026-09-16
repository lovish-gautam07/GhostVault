'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { ShieldLock, Lock, ArrowRight, Eye, EyeOff } from '@/components/Icons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      // Save password in session for client-side decryption during session
      sessionStorage.setItem('masterPassword', password)

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-vault-50 dark:bg-vault-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <ShieldLock size={28} className="text-accent-600 dark:text-accent-400" />
            <span className="font-bold text-xl tracking-tight text-vault-900 dark:text-vault-100">GhostVault</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-vault-900 dark:text-vault-100">
            Sign in to your vault
          </h1>
          <p className="mt-1 text-xs text-vault-500 dark:text-vault-400">
            Or{' '}
            <Link href="/signup" className="font-medium text-accent-600 dark:text-accent-400 hover:underline">
              create a new encrypted vault
            </Link>
          </p>
        </div>

        <div className="gv-card p-6 sm:p-8">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="gv-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-vault-700 dark:text-vault-300">
                  Master Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-vault-400 hover:text-vault-600 dark:hover:text-vault-200 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="gv-input font-mono"
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <p className="mt-1 text-[11px] text-vault-400">
                Derives your client-side decryption key. Never stored in plaintext on servers.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gv-btn-primary w-full py-2.5 text-xs font-semibold mt-2"
            >
              <Lock size={14} />
              <span>{loading ? 'Authenticating & Deriving Keys...' : 'Unlock Vault'}</span>
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-vault-400 hover:text-vault-600 dark:hover:text-vault-300">
            ← Back to GhostVault home
          </Link>
        </div>
      </div>
    </div>
  )
}
