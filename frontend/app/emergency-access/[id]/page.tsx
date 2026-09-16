'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { releaseApi } from '@/lib/api'
import { deriveKey, decryptPayload } from '@/lib/crypto'
import { ShieldLock, Lock, Unlock, AlertTriangle, Key, ShieldCheck, CheckCircle } from '@/components/Icons'

export default function EmergencyAccessPage() {
  const params = useParams()
  const releaseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [release, setRelease] = useState<any>(null)
  const [error, setError] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [decryptedContent, setDecryptedContent] = useState<any>(null)
  const [decrypting, setDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState('')

  useEffect(() => {
    if (!releaseId) return
    loadRelease()
  }, [releaseId])

  const loadRelease = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await releaseApi.get(releaseId)
      setRelease(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load emergency release. The link may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!masterPassword || !release?.vaultItem) return

    setDecrypting(true)
    setDecryptError('')

    try {
      // Salt is the owner's email address
      const salt = release.owner.email || ''
      const cryptoKey = await deriveKey(masterPassword, salt)
      const result = await decryptPayload(
        release.vaultItem.encryptedData,
        release.vaultItem.iv,
        cryptoKey
      )
      setDecryptedContent(result)
    } catch (err: any) {
      setDecryptError('Decryption failed. Please verify the master password or passphrase.')
    } finally {
      setDecrypting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vault-50 dark:bg-vault-950 px-4">
        <div className="text-center space-y-3">
          <ShieldLock size={32} className="mx-auto text-accent-600 animate-pulse" />
          <p className="text-xs font-mono text-vault-500">Retrieving secure emergency release data...</p>
        </div>
      </div>
    )
  }

  if (error || !release) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-vault-50 dark:bg-vault-950 px-4 py-12">
        <div className="max-w-md w-full gv-card p-8 text-center space-y-4">
          <AlertTriangle size={36} className="mx-auto text-danger" />
          <h1 className="text-lg font-bold text-vault-900 dark:text-vault-100">Release Not Available</h1>
          <p className="text-xs text-vault-500 leading-relaxed">{error || 'This emergency access link is not valid.'}</p>
          <div className="pt-2">
            <Link href="/" className="gv-btn-secondary inline-block text-xs py-2 px-4">
              Return to GhostVault Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-vault-50 dark:bg-vault-950 text-vault-900 dark:text-vault-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <ShieldLock size={28} className="text-accent-600 dark:text-accent-400" />
            <span className="font-bold text-xl tracking-tight">GhostVault</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-vault-900 dark:text-vault-100">
            Emergency Access Release Portal
          </h1>
          <p className="text-xs text-vault-500 dark:text-vault-400">
            Designated beneficiary release for <span className="font-semibold text-vault-700 dark:text-vault-200">{release.contact.name}</span>
          </p>
        </div>

        {/* Release Metadata Card */}
        <div className="gv-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-vault-200 dark:border-vault-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-vault-400">Vault Owner</span>
              <p className="text-sm font-semibold text-vault-900 dark:text-vault-100">{release.owner.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-vault-400">Release Status</span>
              <div>
                <span className="gv-badge bg-safe/10 text-safe border-safe/20 text-xs">
                  <CheckCircle size={12} />
                  Authorized & Released
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-vault-400">Item Title:</span>
              <p className="font-medium text-vault-900 dark:text-vault-100">{release.vaultItem.title}</p>
            </div>
            <div>
              <span className="text-vault-400">Item Type:</span>
              <p className="font-mono uppercase font-semibold text-accent-600 dark:text-accent-400">
                {release.vaultItem.type}
              </p>
            </div>
          </div>

          {release.owner.keyHint && (
            <div className="bg-vault-100 dark:bg-vault-850 p-3.5 rounded-lg border border-vault-200 dark:border-vault-700">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-vault-800 dark:text-vault-200 mb-1">
                <Key size={14} className="text-accent-500" />
                <span>Password Recovery Hint from {release.owner.name}</span>
              </div>
              <p className="text-xs text-vault-600 dark:text-vault-400 font-mono italic">
                "{release.owner.keyHint}"
              </p>
            </div>
          )}
        </div>

        {/* Decryption Section */}
        <div className="gv-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-vault-200 dark:border-vault-800 pb-3">
            <Lock size={16} className="text-accent-600 dark:text-accent-400" />
            <h2 className="text-sm font-semibold text-vault-900 dark:text-vault-100">
              Client-Side Payload Decryption
            </h2>
          </div>

          <p className="text-xs text-vault-500 dark:text-vault-400 leading-relaxed">
            This payload was encrypted on the owner's device using zero-knowledge AES-256-GCM cryptography.
            Enter the master password or shared passphrase to decrypt it locally in your browser.
          </p>

          {decryptError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs p-3 rounded-lg">
              {decryptError}
            </div>
          )}

          {!decryptedContent ? (
            <form onSubmit={handleDecrypt} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                  Master Password / Key
                </label>
                <input
                  type="password"
                  required
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="gv-input font-mono"
                  placeholder="Enter the master password known for this vault"
                />
              </div>

              <button
                type="submit"
                disabled={decrypting || !masterPassword}
                className="gv-btn-primary w-full py-2.5 text-xs font-semibold"
              >
                <Unlock size={14} />
                <span>{decrypting ? 'Decrypting via WebCrypto API...' : 'Decrypt Payload'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-safe font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} />
                  Decrypted Successfully
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDecryptedContent(null)
                    setMasterPassword('')
                  }}
                  className="text-vault-400 hover:text-vault-600 text-[11px] underline"
                >
                  Lock Again
                </button>
              </div>

              <div className="bg-vault-100 dark:bg-vault-900 border border-vault-200 dark:border-vault-700 rounded-lg p-4 font-mono text-xs text-vault-900 dark:text-vault-100 whitespace-pre-wrap break-words">
                {typeof decryptedContent === 'object'
                  ? JSON.stringify(decryptedContent, null, 2)
                  : String(decryptedContent)}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-vault-400 hover:text-vault-600 dark:hover:text-vault-300">
            ← GhostVault Home
          </Link>
        </div>
      </div>
    </div>
  )
}
