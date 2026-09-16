'use client'

import { useState } from 'react'
import { vaultApi } from '@/lib/api'
import { deriveKey, encryptPayload } from '@/lib/crypto'
import type { Contact } from './ContactsList'
import { ShieldLock, X, Lock } from './Icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  contacts: Contact[]
}

export default function AddVaultItemModal({ isOpen, onClose, onSuccess, contacts }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'note' | 'password' | 'document'>('note')
  const [plainData, setPlainData] = useState('')
  const [releaseTier, setReleaseTier] = useState(30)
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const masterPassword = sessionStorage.getItem('masterPassword')
      if (!masterPassword) {
        throw new Error('Master password not found in session. Please sign in again.')
      }

      const userStr = localStorage.getItem('user')
      if (!userStr) throw new Error('User session not found')
      const user = JSON.parse(userStr)

      // Derive key using PBKDF2 (100k iterations) with user's email as salt
      const key = await deriveKey(masterPassword, user.email)

      // Client-side AES-256-GCM encryption with random 12-byte IV
      const { encryptedData, iv } = await encryptPayload(plainData, key)

      // Transmit ciphertext only
      await vaultApi.create({
        title,
        type,
        encryptedData,
        iv,
        releaseTier,
        contactIds: selectedContactIds,
      })

      // Reset
      setTitle('')
      setPlainData('')
      setReleaseTier(30)
      setSelectedContactIds([])
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create vault item')
    } finally {
      setLoading(false)
    }
  }

  const toggleContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-vault-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-vault-900 border border-vault-200 dark:border-vault-700 rounded-xl shadow-modal max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white dark:bg-vault-900 border-b border-vault-200 dark:border-vault-700 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <ShieldLock size={20} className="text-accent-600 dark:text-accent-400" />
            <h2 className="text-base font-semibold text-vault-900 dark:text-vault-100">
              Add Encrypted Vault Item
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-vault-400 hover:text-vault-600 dark:hover:text-vault-200 p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
              Item Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master seed phrase, Bitwarden export, Will & estate notes"
              className="gv-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Item Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="gv-input"
              >
                <option value="note">Note / Instructions</option>
                <option value="password">Password / Credential</option>
                <option value="document">Document / File Data</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Release Threshold (days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={releaseTier}
                onChange={(e) => setReleaseTier(parseInt(e.target.value, 10) || 1)}
                className="gv-input font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300">
                Payload / Sensitive Data
              </label>
              <span className="text-[11px] font-mono text-vault-400 flex items-center gap-1">
                <Lock size={10} /> Encrypted client-side
              </span>
            </div>
            <textarea
              required
              value={plainData}
              onChange={(e) => setPlainData(e.target.value)}
              placeholder={
                type === 'note'
                  ? 'Write emergency instructions, account details, or personal message...'
                  : type === 'password'
                  ? 'Service: ...\nUsername: ...\nPassword: ...\n2FA Recovery Code: ...'
                  : 'Document reference, cloud locker URL, or file contents...'
              }
              rows={6}
              className="gv-input font-mono text-xs"
            />
            <p className="text-[11px] text-vault-400 mt-1 flex items-center gap-1">
              <Lock size={11} className="text-accent-500" />
              Plaintext is never transmitted. Web Crypto API performs AES-256-GCM in your browser.
            </p>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-2">
                Assign to Emergency Contacts (Optional)
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-vault-200 dark:border-vault-700 rounded-lg p-2.5 bg-vault-50/50 dark:bg-vault-850/50">
                {contacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-2.5 p-1.5 rounded hover:bg-vault-100 dark:hover:bg-vault-800 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="rounded border-vault-300 text-accent-600 focus:ring-accent-500"
                    />
                    <span className="font-medium text-vault-900 dark:text-vault-100">{contact.name}</span>
                    <span className="text-vault-400 font-mono">({contact.email})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-vault-200 dark:border-vault-700">
            <button
              type="button"
              onClick={onClose}
              className="gv-btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gv-btn-primary text-xs py-2 px-5"
            >
              <Lock size={13} />
              <span>{loading ? 'Encrypting & Storing...' : 'Encrypt & Store'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
