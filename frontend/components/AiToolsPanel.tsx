'use client'

import { useEffect, useMemo, useState } from 'react'
import { aiApi } from '@/lib/api'
import { analyzePassword, crackTime, SCORE_LABELS } from '@/lib/passwordStrength'
import { Sparkles, ShieldCheck, Key, AlertTriangle, CheckCircle, Eye, EyeOff, Lock } from './Icons'

type Finding = { level: 'critical' | 'warning' | 'info' | 'good'; title: string; detail: string }
type AdvisorResult = { score: number; findings: Finding[]; summary: string; source: 'ai' | 'offline' }

const LEVEL_STYLES: Record<Finding['level'], string> = {
  critical: 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-danger',
  warning: 'border-yellow-300 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 text-warn',
  info: 'border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300',
  good: 'border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-950/20 text-safe',
}

const BAR_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-600']

function SourceBadge({ source }: { source?: 'ai' | 'offline' }) {
  if (!source) return null
  return (
    <span className="gv-badge text-[10px] font-mono border border-vault-200 dark:border-vault-700 bg-vault-100 dark:bg-vault-800 text-vault-500">
      {source === 'ai' ? 'Gemini AI' : 'Offline rules'}
    </span>
  )
}

function SecurityAdvisor() {
  const [result, setResult] = useState<AdvisorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      setResult(await aiApi.advisor())
    } catch (e: any) {
      setError(e.message || 'Could not analyse your vault')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = !result ? '' : result.score >= 80 ? 'text-safe' : result.score >= 50 ? 'text-warn' : 'text-danger'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-vault-500 dark:text-vault-400 max-w-lg">
          Reviews your legacy setup using only anonymous counts (number of items, contacts, thresholds and days since check-in).
          Titles, emails and encrypted data are never sent to the AI.
        </p>
        <button onClick={run} disabled={loading} className="gv-btn-primary text-xs py-1.5 px-3 self-start">
          <Sparkles size={14} />
          <span>{loading ? 'Analysing…' : result ? 'Re-run analysis' : 'Analyse my vault'}</span>
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {result && (
        <div className="grid md:grid-cols-[160px_1fr] gap-4">
          <div className="gv-card p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] uppercase tracking-wide text-vault-500">Legacy health</p>
            <p className={`text-4xl font-bold font-mono ${scoreColor}`}>{result.score}</p>
            <p className="text-[11px] text-vault-400">out of 100</p>
            <div className="mt-2"><SourceBadge source={result.source} /></div>
          </div>
          <div className="space-y-2">
            {result.findings.map((f, i) => (
              <div key={i} className={`border rounded-lg p-3 text-xs ${LEVEL_STYLES[f.level]}`}>
                <p className="font-semibold flex items-center gap-1.5">
                  {f.level === 'good' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                  {f.title}
                </p>
                <p className="mt-0.5 text-vault-600 dark:text-vault-300">{f.detail}</p>
              </div>
            ))}
            {result.source === 'ai' && result.summary && (
              <div className="border border-vault-200 dark:border-vault-700 rounded-lg p-3 text-xs bg-vault-50 dark:bg-vault-850">
                <p className="font-semibold text-vault-800 dark:text-vault-100 flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-accent-500" /> AI recommendations
                </p>
                <p className="whitespace-pre-wrap text-vault-600 dark:text-vault-300 leading-relaxed">
                  {result.summary.replace(/\*\*(.+?)\*\*/g, '$1')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordChecker() {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const features = useMemo(() => (pw ? analyzePassword(pw) : null), [pw])
  const featureKey = features ? JSON.stringify(features) : ''
  // Tips are stored with the feature set they belong to, so stale tips are never shown
  const [tipState, setTipState] = useState<{ key: string; tips: string[]; source?: 'ai' | 'offline' }>({ key: '', tips: [] })
  const loading = Boolean(features) && tipState.key !== featureKey
  const tips = loading ? [] : tipState.tips
  const source = loading ? undefined : tipState.source

  // Debounced tip request: ONLY the derived features are sent, never the password
  useEffect(() => {
    if (!features) return
    const key = JSON.stringify(features)
    const t = setTimeout(async () => {
      try {
        const res = await aiApi.passwordTips(features)
        setTipState({ key, tips: res.tips, source: res.source })
      } catch {
        setTipState({ key, tips: ['Could not load tips right now.'] })
      }
    }, 900)
    return () => clearTimeout(t)
  }, [features])

  const checks = features
    ? [
        ['12+ characters', features.length >= 12],
        ['Lowercase letters', features.hasLower],
        ['Uppercase letters', features.hasUpper],
        ['Numbers', features.hasDigit],
        ['Symbols', features.hasSymbol],
        ['Not a common password', !features.isCommon],
        ['No sequences (1234, abcd)', !features.hasSequence],
        ['No years / dates', !features.hasYear],
      ]
    : []

  return (
    <div className="space-y-4">
      <p className="text-xs text-vault-500 dark:text-vault-400">
        Your password is analysed <strong>locally in your browser</strong>. Only anonymous features (length, character types) are sent to the AI coach for tips.
      </p>
      <div className="relative max-w-md">
        <input
          type={show ? 'text' : 'password'}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Type a password to test…"
          autoComplete="off"
          spellCheck={false}
          className="gv-input font-mono pr-10"
          aria-label="Password to check"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-vault-400 p-1" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {features && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-vault-800 dark:text-vault-100">{SCORE_LABELS[features.score]}</span>
                <span className="font-mono text-vault-500">~{features.entropyBits} bits</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded ${i <= features.score ? BAR_COLORS[features.score] : 'bg-vault-200 dark:bg-vault-700'}`} />
                ))}
              </div>
              <p className="text-[11px] text-vault-500 mt-1.5">
                Estimated time to crack offline: <span className="font-mono font-semibold">{crackTime(features.entropyBits)}</span>
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-1 text-[11px]">
              {checks.map(([label, ok]) => (
                <li key={label as string} className={`flex items-center gap-1 ${ok ? 'text-safe' : 'text-vault-400'}`}>
                  {ok ? <CheckCircle size={11} /> : <AlertTriangle size={11} />} {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-vault-200 dark:border-vault-700 rounded-lg p-3 text-xs bg-vault-50 dark:bg-vault-850">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-semibold text-vault-800 dark:text-vault-100 flex items-center gap-1.5">
                <Sparkles size={13} className="text-accent-500" /> AI password coach
              </p>
              <SourceBadge source={source} />
            </div>
            {loading ? (
              <p className="text-vault-400 animate-pulse">Getting tips…</p>
            ) : (
              <ul className="space-y-1 text-vault-600 dark:text-vault-300 list-disc pl-4">
                {tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AiToolsPanel() {
  const [tab, setTab] = useState<'advisor' | 'password'>('advisor')
  return (
    <div className="gv-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="gv-section-title">
            <Sparkles size={18} className="text-accent-600 dark:text-accent-400" />
            <span>AI Security Tools</span>
          </h2>
          <p className="gv-section-subtitle flex items-center gap-1">
            <Lock size={11} /> Privacy-first: your secrets never leave your browser.
          </p>
        </div>
        <div className="flex rounded-lg border border-vault-200 dark:border-vault-700 p-0.5 text-xs self-start">
          <button
            onClick={() => setTab('advisor')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${tab === 'advisor' ? 'bg-accent-600 text-white' : 'text-vault-600 dark:text-vault-300'}`}
          >
            <ShieldCheck size={13} /> Security Advisor
          </button>
          <button
            onClick={() => setTab('password')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${tab === 'password' ? 'bg-accent-600 text-white' : 'text-vault-600 dark:text-vault-300'}`}
          >
            <Key size={13} /> Password Checker
          </button>
        </div>
      </div>
      <div className={tab === 'advisor' ? '' : 'hidden'}><SecurityAdvisor /></div>
      <div className={tab === 'password' ? '' : 'hidden'}><PasswordChecker /></div>
    </div>
  )
}
