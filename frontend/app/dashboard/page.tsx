'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CheckInCard from '@/components/CheckInCard'
import ContactsList from '@/components/ContactsList'
import VaultItemList from '@/components/VaultItemList'
import AddVaultItemModal from '@/components/AddVaultItemModal'
import { vaultApi, contactApi, checkinApi } from '@/lib/api'
import { Shield, Plus, ShieldLock } from '@/components/Icons'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vaultItems, setVaultItems] = useState([])
  const [contacts, setContacts] = useState([])
  const [checkinStatus, setCheckinStatus] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [vaultRes, contactsRes, statusRes] = await Promise.all([
        vaultApi.list(),
        contactApi.list(),
        checkinApi.getStatus(),
      ])

      setVaultItems(vaultRes.items || [])
      setContacts(contactsRes.contacts || [])
      setCheckinStatus(statusRes)
    } catch (err: any) {
      console.error('Failed to load dashboard:', err)
      if (err.message?.includes('token') || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vault-50 dark:bg-vault-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <ShieldLock size={32} className="mx-auto text-accent-600 animate-pulse" />
            <p className="text-xs font-mono text-vault-500">Decrypting session & syncing vault state...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vault-50 dark:bg-vault-950 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vault-200 dark:border-vault-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-vault-900 dark:text-vault-100">
              Vault Overview
            </h1>
            <p className="text-xs text-vault-500 dark:text-vault-400 mt-1">
              Zero-knowledge legacy manager. Cryptographic operations run in your browser.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="gv-badge bg-vault-100 dark:bg-vault-800 text-vault-600 dark:text-vault-300 font-mono text-xs border border-vault-200 dark:border-vault-700">
              <Shield size={12} className="text-accent-500" />
              Client-Side AES-256
            </span>
          </div>
        </div>

        {/* Dead Man's Switch */}
        <CheckInCard status={checkinStatus} onCheckInSuccess={loadDashboardData} />

        {/* Trusted Contacts */}
        <ContactsList contacts={contacts} onRefresh={loadDashboardData} />

        {/* Vault Items List */}
        <div className="gv-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="gv-section-title">
                <ShieldLock size={18} className="text-accent-600 dark:text-accent-400" />
                <span>Encrypted Vault Items ({vaultItems.length})</span>
              </h2>
              <p className="gv-section-subtitle">
                Payloads are encrypted with your master key prior to transmission.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="gv-btn-primary text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>Add Item</span>
            </button>
          </div>

          <VaultItemList items={vaultItems} onRefresh={loadDashboardData} />
        </div>
      </main>

      <footer className="border-t border-vault-200 dark:border-vault-800 py-6 text-center text-xs text-vault-400 font-mono">
        GhostVault · Zero-Knowledge Cryptographic Legacy Manager
      </footer>

      {/* Add Vault Item Modal */}
      <AddVaultItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadDashboardData}
        contacts={contacts}
      />
    </div>
  )
}
