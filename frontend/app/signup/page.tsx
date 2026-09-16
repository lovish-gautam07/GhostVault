'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { ShieldLock, ArrowRight, ShieldCheck, Eye, EyeOff } from '@/components/Icons'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keyHint, setKeyHint] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Client-side password strength estimation
  const hasMinLen = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const isStrong = hasMinLen && hasUpper && hasLower && hasDigit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isStrong) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.')
      return
    }

    setLoading(true)

    try {
      const response = await authApi.signup({
        name,
        email,
        password,
        keyHint: keyHint.trim() || undefined,
      })

      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      sessionStorage.setItem('masterPassword', password)

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
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
            Initialize your encrypted vault
          </h1>
          <p className="mt-1 text-xs text-vault-500 dark:text-vault-400">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-accent-600 dark:text-accent-400 hover:underline">
              Sign in to unlock
            </Link>
          </p>
        </div>

        <div className="gv-card p-6 sm:p-8">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="gv-input"
                placeholder="Alice Johnson"
                autoComplete="name"
              />
            </div>

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
                placeholder="alice@example.com"
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
                placeholder="Min. 8 characters (upper, lower, digit)"
                autoComplete="new-password"
              />
              {password && (
                <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px] font-mono">
                  <span className={hasMinLen ? 'text-safe' : 'text-vault-400'}>8+ chars</span>
                  <span className={hasUpper ? 'text-safe' : 'text-vault-400'}>Uppercase</span>
                  <span className={hasLower ? 'text-safe' : 'text-vault-400'}>Lowercase</span>
                  <span className={hasDigit ? 'text-safe' : 'text-vault-400'}>Number</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Confirm Master Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="gv-input font-mono"
                placeholder="Confirm your master password"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Password Recovery Hint <span className="text-vault-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={keyHint}
                onChange={(e) => setKeyHint(e.target.value)}
                className="gv-input"
                placeholder="A memory clue known only to you"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gv-btn-primary w-full py-2.5 text-xs font-semibold mt-3"
            >
              <ShieldCheck size={14} />
              <span>{loading ? 'Deriving Keys & Generating Account...' : 'Initialize Vault'}</span>
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
