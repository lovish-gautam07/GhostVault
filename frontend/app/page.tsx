import Link from 'next/link'
import { ShieldLock, Shield, Clock, Users, ArrowRight, Lock, Key, ShieldCheck } from '@/components/Icons'

export default function Home() {
  return (
    <div className="min-h-screen bg-vault-50 dark:bg-vault-950 text-vault-900 dark:text-vault-100 flex flex-col">
      {/* Header / Nav */}
      <header className="border-b border-vault-200 dark:border-vault-800 bg-white/50 dark:bg-vault-900/50 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldLock size={20} className="text-accent-600 dark:text-accent-400" />
            <span className="font-bold text-sm tracking-tight">GhostVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-vault-600 dark:text-vault-300 hover:text-vault-900 dark:hover:text-white px-3 py-1.5 rounded transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-semibold bg-accent-600 text-white hover:bg-accent-700 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Create Vault
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vault-100 dark:bg-vault-850 border border-vault-200 dark:border-vault-700 text-xs font-mono text-vault-600 dark:text-vault-300 mb-8">
          <Shield size={12} className="text-accent-600 dark:text-accent-400" />
          <span>Zero-Knowledge Architecture · AES-256-GCM + PBKDF2</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-vault-950 dark:text-vault-50 mb-6 text-balance max-w-3xl mx-auto">
          Cryptographic digital legacy and automated emergency access.
        </h1>

        <p className="text-base sm:text-lg text-vault-600 dark:text-vault-300 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
          Store credentials, recovery keys, and vital instructions. If you stop checking in, your encrypted payloads are safely transferred to verified emergency contacts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto gv-btn-primary px-7 py-3 text-sm font-semibold shadow-card-hover"
          >
            <span>Initialize Your Vault</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto gv-btn-secondary px-7 py-3 text-sm font-medium"
          >
            <span>Sign In to Existing Vault</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-vault-200 dark:border-vault-800 text-left">
          <div className="p-3">
            <div className="font-mono text-xs text-vault-400">ENCRYPTION</div>
            <div className="font-semibold text-xs text-vault-900 dark:text-vault-100 mt-0.5">AES-256-GCM</div>
          </div>
          <div className="p-3">
            <div className="font-mono text-xs text-vault-400">KEY DERIVATION</div>
            <div className="font-semibold text-xs text-vault-900 dark:text-vault-100 mt-0.5">PBKDF2 / 100k rounds</div>
          </div>
          <div className="p-3">
            <div className="font-mono text-xs text-vault-400">KNOWLEDGE MODEL</div>
            <div className="font-semibold text-xs text-vault-900 dark:text-vault-100 mt-0.5">Zero-Knowledge Client</div>
          </div>
          <div className="p-3">
            <div className="font-mono text-xs text-vault-400">DISPATCH TRIGGER</div>
            <div className="font-semibold text-xs text-vault-900 dark:text-vault-100 mt-0.5">Dead Man's Switch</div>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-vault-100/60 dark:bg-vault-900/60 border-y border-vault-200 dark:border-vault-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-vault-900 dark:text-vault-100">
              Security by Construction
            </h2>
            <p className="text-xs text-vault-500 dark:text-vault-400 mt-1 max-w-md mx-auto">
              Engineered with modern cryptographic primitives and verifiable security boundaries.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="gv-card p-6 bg-white dark:bg-vault-850">
              <div className="w-10 h-10 rounded-lg bg-vault-100 dark:bg-vault-800 flex items-center justify-center text-accent-600 dark:text-accent-400 mb-4">
                <Lock size={20} />
              </div>
              <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 mb-2">
                Client-Side Encryption
              </h3>
              <p className="text-xs text-vault-600 dark:text-vault-400 leading-relaxed">
                All data is encrypted in your browser using the native Web Crypto API before transmission. The backend stores only ciphertext and random IVs.
              </p>
            </div>

            <div className="gv-card p-6 bg-white dark:bg-vault-850">
              <div className="w-10 h-10 rounded-lg bg-vault-100 dark:bg-vault-800 flex items-center justify-center text-accent-600 dark:text-accent-400 mb-4">
                <Clock size={20} />
              </div>
              <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 mb-2">
                Dead Man's Switch
              </h3>
              <p className="text-xs text-vault-600 dark:text-vault-400 leading-relaxed">
                Configurable inactivity timers monitor user activity. Check in via one click to reset your timers and prevent accidental asset releases.
              </p>
            </div>

            <div className="gv-card p-6 bg-white dark:bg-vault-850">
              <div className="w-10 h-10 rounded-lg bg-vault-100 dark:bg-vault-800 flex items-center justify-center text-accent-600 dark:text-accent-400 mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 mb-2">
                Tiered Contact Releases
              </h3>
              <p className="text-xs text-vault-600 dark:text-vault-400 leading-relaxed">
                Assign specific items to individual emergency contacts with distinct inactivity thresholds (e.g. 30 days vs 90 days).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — 3 Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold tracking-tight text-vault-900 dark:text-vault-100">
            How GhostVault Works
          </h2>
          <p className="text-xs text-vault-500 dark:text-vault-400 mt-1">
            Three simple steps to secure your digital legacy.
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-lg bg-accent-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              01
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 mb-1">
                Store Encrypted Records
              </h3>
              <p className="text-xs text-vault-600 dark:text-vault-400 leading-relaxed">
                Add passwords, master recovery phrases, bank details, or estate instructions. Your browser derives a 256-bit AES key using PBKDF2 from your master password and encrypts everything before it leaves your machine.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-lg bg-accent-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              02
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 mb-1">
                Assign Emergency Contacts & Tiers
              </h3>
              <p className="text-xs text-vault-600 dark:text-vault-400 leading-relaxed">
                Designate trusted beneficiaries and specify how many days of inactivity must elapse before each item is released. Different assets can have different release windows.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-lg bg-accent-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              03
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-semibold text-vault-900 dark:text-vault-100 mb-1">
                Check In Periodically or Release Triggers
              </h3>
              <p className="text-xs text-vault-600 dark:text-vault-400 leading-relaxed">
                Log in or hit "Check In" to reset your countdown. If you miss your check-in window and grace periods expire, automated background workers notify your trusted contacts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-vault-200 dark:border-vault-800 text-center bg-white dark:bg-vault-900">
        <div className="max-w-2xl mx-auto space-y-4">
          <ShieldCheck size={28} className="mx-auto text-accent-600 dark:text-accent-400" />
          <h2 className="text-2xl font-bold tracking-tight text-vault-900 dark:text-vault-100">
            Secure your digital legacy today.
          </h2>
          <p className="text-xs text-vault-500 dark:text-vault-400 max-w-md mx-auto">
            Zero telemetry. No cloud unencrypted keys. End-to-end client-side privacy.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="gv-btn-primary px-6 py-2.5 text-xs font-semibold"
            >
              <span>Create Free Account</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vault-200 dark:border-vault-800 py-6 text-center text-xs text-vault-400 font-mono">
        GhostVault · Encrypted Digital Legacy Manager · AES-256-GCM
      </footer>
    </div>
  )
}
