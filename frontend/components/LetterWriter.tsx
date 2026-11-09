'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'
import { Sparkles, AlertTriangle } from './Icons'

interface Props {
  initialDraft: string
  onUse: (letter: string) => void
  onClose: () => void
}

/**
 * AI Legacy Letter Writer.
 * The user's rough notes are sent to the AI ONLY after they click "Write with AI"
 * (explicit opt-in shown in the UI). The final letter is still encrypted client-side
 * before it is stored in the vault.
 */
export default function LetterWriter({ initialDraft, onUse, onClose }: Props) {
  const [draft, setDraft] = useState(initialDraft)
  const [recipientName, setRecipientName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [tone, setTone] = useState('heartfelt')
  const [letter, setLetter] = useState('')
  const [source, setSource] = useState<'ai' | 'offline' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await aiApi.letter({ draft, recipientName, relationship, tone })
      setLetter(res.letter)
      setSource(res.source)
    } catch (e: any) {
      setError(e.message || 'Could not generate letter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-accent-200 dark:border-accent-800 rounded-lg p-4 space-y-3 bg-accent-50/50 dark:bg-accent-900/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-vault-800 dark:text-vault-100 flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent-600" /> AI Legacy Letter Writer
        </p>
        <button type="button" onClick={onClose} className="text-[11px] text-vault-500 hover:underline">Close</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={100} placeholder="Recipient name (e.g. Riya)" className="gv-input text-xs" />
        <input value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={100} placeholder="Relationship (e.g. daughter)" className="gv-input text-xs" />
      </div>
      <select value={tone} onChange={(e) => setTone(e.target.value)} className="gv-input text-xs">
        <option value="heartfelt">Heartfelt &amp; loving</option>
        <option value="practical">Practical instructions</option>
        <option value="uplifting">Hopeful &amp; uplifting</option>
        <option value="formal">Respectful &amp; formal</option>
      </select>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={4000}
        rows={3}
        placeholder="Jot down rough points: memories, what you want them to know, what to do first…"
        className="gv-input text-xs"
      />
      <p className="text-[11px] text-warn flex items-start gap-1">
        <AlertTriangle size={12} className="mt-px shrink-0" />
        These notes are sent to the AI to draft your letter. Do not include passwords or account numbers. The final letter is encrypted before saving.
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
      <button type="button" onClick={generate} disabled={loading || draft.trim().length < 10} className="gv-btn-primary text-xs py-1.5 px-3">
        <Sparkles size={13} />
        <span>{loading ? 'Writing…' : letter ? 'Rewrite' : 'Write with AI'}</span>
      </button>

      {letter && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-vault-600 dark:text-vault-300">Preview (you can edit after inserting)</p>
            <span className="text-[10px] font-mono text-vault-400">{source === 'ai' ? 'Gemini AI' : 'Offline template'}</span>
          </div>
          <div className="whitespace-pre-wrap text-xs bg-white dark:bg-vault-900 border border-vault-200 dark:border-vault-700 rounded-lg p-3 max-h-56 overflow-y-auto leading-relaxed">
            {letter}
          </div>
          <button type="button" onClick={() => onUse(letter)} className="gv-btn-secondary text-xs py-1.5 px-3">
            Use this letter
          </button>
        </div>
      )}
    </div>
  )
}
