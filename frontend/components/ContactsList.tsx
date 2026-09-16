'use client'

import { useState } from 'react'
import { contactApi } from '@/lib/api'
import { Users, UserPlus, Trash, Mail } from './Icons'

export interface Contact {
  id: string
  name: string
  email: string
  createdAt: string
}

interface Props {
  contacts: Contact[]
  onRefresh: () => void
}

export default function ContactsList({ contacts, onRefresh }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await contactApi.create({ name, email })
      setName('')
      setEmail('')
      setShowAddForm(false)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Failed to add contact')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (id: string, contactName: string) => {
    if (!confirm(`Remove "${contactName}" from trusted emergency contacts?`)) return

    try {
      await contactApi.delete(id)
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact')
    }
  }

  return (
    <div className="gv-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="gv-section-title">
            <Users size={18} className="text-accent-600 dark:text-accent-400" />
            <span>Trusted Emergency Contacts ({contacts.length})</span>
          </h2>
          <p className="gv-section-subtitle">
            Recipients who will receive designated vault items if the dead man's switch triggers.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gv-btn-secondary text-xs py-1.5 px-3"
        >
          <UserPlus size={14} />
          <span>{showAddForm ? 'Cancel' : 'Add Contact'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddContact} className="mb-6 p-4 rounded-lg bg-vault-50 dark:bg-vault-850 border border-vault-200 dark:border-vault-700 space-y-3 animate-slide-up">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-vault-500">New Emergency Contact</h3>
          {error && (
            <p className="text-xs text-danger bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900">
              {error}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-vault-700 dark:text-vault-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="gv-input"
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
                placeholder="eleanor@example.com"
                className="gv-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="gv-btn-secondary text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gv-btn-primary text-xs py-1.5 px-4"
            >
              {loading ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-vault-200 dark:border-vault-800 rounded-lg">
          <Mail size={24} className="mx-auto text-vault-300 dark:text-vault-600 mb-2" />
          <p className="text-sm font-medium text-vault-700 dark:text-vault-300">No emergency contacts configured</p>
          <p className="text-xs text-vault-500 dark:text-vault-400 mt-1 max-w-sm mx-auto">
            Add trusted contacts so your encrypted assets can be transferred in the event of prolonged inactivity.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-vault-100 dark:divide-vault-800">
          {contacts.map((contact) => (
            <div key={contact.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-vault-900 dark:text-vault-100 truncate">{contact.name}</p>
                </div>
                <p className="text-xs text-vault-500 dark:text-vault-400 font-mono truncate">{contact.email}</p>
              </div>
              <button
                onClick={() => handleDeleteContact(contact.id, contact.name)}
                className="text-vault-400 hover:text-danger p-1.5 rounded hover:bg-vault-100 dark:hover:bg-vault-800 transition-colors"
                title="Remove contact"
              >
                <Trash size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
