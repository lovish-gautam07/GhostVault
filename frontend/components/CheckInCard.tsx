'use client'

import { useState } from 'react'
import { checkinApi } from '@/lib/api'
import { Clock, ShieldCheck, AlertTriangle } from './Icons'

interface CheckInStatus {
  lastCheckinAt: string
  daysSinceLastCheckin: number
  nextReleaseTier: number | null
  daysUntilRelease: number | null
  isAtRisk: boolean
}

interface Props {
  status: CheckInStatus | null
  onCheckInSuccess: () => void
}

export default function CheckInCard({ status, onCheckInSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleCheckIn = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      await checkinApi.checkin()
      setSuccessAnimation(true)
      setFeedback({
        type: 'success',
        text: 'Check-in recorded. Dead man\'s switch timer has been reset.',
      })
      setTimeout(() => setSuccessAnimation(false), 800)
      onCheckInSuccess()
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Check-in failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const isAtRisk = status?.isAtRisk ?? false
  const daysSince = status?.daysSinceLastCheckin ?? 0
  const daysRemaining = status?.daysUntilRelease

  const formattedDate = status?.lastCheckinAt
    ? new Date(status.lastCheckinAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No record yet'

  return (
    <div
      className={`gv-card p-6 transition-all duration-300 ${
        isAtRisk
          ? 'border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20'
          : 'border-vault-200 dark:border-vault-700'
      } ${successAnimation ? 'animate-check-pulse' : ''}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isAtRisk
                  ? 'bg-red-100 dark:bg-red-900/40 text-danger'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-safe'
              }`}
            >
              {isAtRisk ? <AlertTriangle size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-vault-900 dark:text-vault-100">
                  Dead Man's Switch
                </h2>
                {isAtRisk ? (
                  <span className="gv-badge bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    At Risk of Release
                  </span>
                ) : (
                  <span className="gv-badge bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active & Safe
                  </span>
                )}
              </div>
              <p className="text-xs text-vault-500 dark:text-vault-400">
                Last check-in recorded:{' '}
                <span className="font-mono text-vault-700 dark:text-vault-200">{formattedDate}</span>
                {status && (
                  <span className="ml-1 text-vault-400">
                    ({daysSince} {daysSince === 1 ? 'day' : 'days'} ago)
                  </span>
                )}
              </p>
            </div>
          </div>

          {daysRemaining !== null && daysRemaining !== undefined && (
            <div className="flex items-center gap-4 pt-1 text-xs">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-vault-500">Next threshold:</span>
                <span
                  className={`font-semibold ${
                    daysRemaining <= 5
                      ? 'text-danger font-bold'
                      : daysRemaining <= 15
                      ? 'text-warn'
                      : 'text-vault-700 dark:text-vault-200'
                  }`}
                >
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
                {status?.nextReleaseTier && (
                  <span className="text-vault-400 font-normal">
                    (Tier: {status.nextReleaseTier}d)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="gv-btn-primary bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-500/40 w-full sm:w-auto px-6 py-2.5 text-sm"
          >
            <ShieldCheck size={16} />
            <span>{loading ? 'Confirming...' : 'I am Alive — Check In'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  )
}
