'use client'

import { useState } from 'react'
import { vaultApi } from '@/lib/api'
import { deriveKey, decryptPayload } from '@/lib/crypto'
import type { Contact } from './ContactsList'
import {
  Lock,
  Unlock,
  Key,
  FileText,
  StickyNote,
  Package,
  Trash,
  Shield,
  Clock,
  Users,
} from './Icons'

interface VaultItem {
  id: string
  title: string
  type: 'note' | 'password' | 'document'
  encryptedData: string
  iv: string
  releaseTier: number
  createdAt: string
  updatedAt: string
  contacts?: Contact[]
}

interface Props {
  items: VaultItem[]
  onRefresh: () => void
}

export default function VaultItemList({ items, onRefresh }: Props) {
  const [decryptedItems, setDecryptedItems] = useState<Record<string, string>>({})
  const [decrypting, setDecrypting] = useState<Record<string, boolean>>({})

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <StickyNote size={16} />
      case 'password':
        return <Key size={16} />
      case 'document':
        return <FileText size={16} />
      default:
        return <Package size={16} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'note':
        return 'Note'
      case 'password':
        return 'Credential'
      case 'document':
        return 'Document'
      default:
        return 'Item'
    }
  }

  const handleDecrypt = async (item: VaultItem) => {
    setDecrypting({ ...decrypting, [item.id]: true })

    try {
      const masterPassword = sessionStorage.getItem('masterPassword')
      if (!masterPassword) {
        alert('Session master password not found. Please sign in again to unlock your vault.')
        return
      }

      const userStr = localStorage.getItem('user')
      if (!userStr) throw new Error('User session not found')
      const user = JSON.parse(userStr)

      const key = await deriveKey(masterPassword, user.email)
      const decrypted = await decryptPayload(item.encryptedData, item.iv, key)

      setDecryptedItems({ ...decryptedItems, [item.id]: decrypted })
    } catch (err: any) {
      alert(`Decryption failed: ${err.message}. Ensure your master password is correct.`)
    } finally {
      setDecrypting({ ...decrypting, [item.id]: false })
    }
  }

  const handleHide = (itemId: string) => {
    const updated = { ...decryptedItems }
    delete updated[itemId]
    setDecryptedItems(updated)
  }

  const handleDelete = async (itemId: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return

    try {
      await vaultApi.delete(itemId)
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete item')
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-vault-200 dark:border-vault-800 rounded-lg">
        <Shield size={28} className="mx-auto text-vault-300 dark:text-vault-600 mb-2" />
        <p className="text-sm font-medium text-vault-700 dark:text-vault-300">Your vault is empty</p>
        <p className="text-xs text-vault-500 dark:text-vault-400 mt-1 max-w-sm mx-auto">
          Add sensitive credentials, recovery keys, notes, or emergency instructions. Everything is encrypted client-side with AES-256-GCM before storage.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isDecrypted = !!decryptedItems[item.id]
        const isDecrypting = !!decrypting[item.id]

        return (
          <div
            key={item.id}
            className="p-4 rounded-lg bg-vault-50/50 dark:bg-vault-850/50 border border-vault-200/80 dark:border-vault-700/80 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-vault-500 dark:text-vault-400">
                    {getTypeIcon(item.type)}
                  </span>
                  <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 truncate">
                    {item.title}
                  </h3>
                  <span className="gv-badge bg-vault-200 dark:bg-vault-700 text-vault-700 dark:text-vault-300 font-mono text-[11px]">
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="gv-badge bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[10px] font-mono">
                    <Shield size={10} />
                    AES-256-GCM
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-vault-500 dark:text-vault-400">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock size={12} />
                    Release: {item.releaseTier}d inactivity
                  </span>
                  {item.contacts && item.contacts.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {item.contacts.map((c) => c.name).join(', ')}
                    </span>
                  )}
                  <span className="text-vault-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-start">
                {!isDecrypted ? (
                  <button
                    onClick={() => handleDecrypt(item)}
                    disabled={isDecrypting}
                    className="gv-btn-secondary text-xs py-1 px-3"
                  >
                    <Lock size={13} />
                    <span>{isDecrypting ? 'Decrypting...' : 'Decrypt'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleHide(item.id)}
                    className="gv-btn-secondary text-xs py-1 px-3"
                  >
                    <Unlock size={13} />
                    <span>Hide</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="text-vault-400 hover:text-danger p-1 rounded hover:bg-vault-100 dark:hover:bg-vault-800 transition-colors"
                  title="Delete item"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>

            {isDecrypted && (
              <div className="mt-3.5 p-3.5 rounded bg-white dark:bg-vault-900 border border-vault-200 dark:border-vault-700 animate-slide-up">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-vault-100 dark:border-vault-800">
                  <span className="text-[11px] font-mono text-safe uppercase tracking-wider flex items-center gap-1">
                    <Unlock size={12} /> Decrypted in browser
                  </span>
                  <span className="text-[11px] text-vault-400 font-mono">
                    IV: {item.iv.slice(0, 8)}...
                  </span>
                </div>
                <pre className="text-xs text-vault-900 dark:text-vault-100 whitespace-pre-wrap font-mono select-all overflow-x-auto">
                  {decryptedItems[item.id]}
                </pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
