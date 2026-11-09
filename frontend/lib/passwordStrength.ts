/**
 * Local password analysis. Runs entirely in the browser.
 * Only the derived `features` object (no password) is ever sent to the server for AI tips.
 */

const COMMON = [
  'password', '123456', '12345678', '123456789', 'qwerty', 'abc123', 'letmein', 'welcome',
  'iloveyou', 'admin', 'monkey', 'dragon', 'football', 'baseball', 'master', 'sunshine',
  'princess', 'shadow', 'superman', 'trustno1', 'passw0rd', 'qwerty123', '111111', '000000',
  '1q2w3e4r', 'zaq12wsx', 'asdfgh', 'login', 'secret', 'india123', 'pass@123', 'admin@123',
]

const WORDS = ['pass', 'word', 'love', 'admin', 'user', 'qwer', 'asdf', 'hello', 'test', 'welcome', 'secret', 'login']

export interface PasswordFeatures {
  length: number
  hasLower: boolean
  hasUpper: boolean
  hasDigit: boolean
  hasSymbol: boolean
  isCommon: boolean
  hasSequence: boolean
  hasRepeat: boolean
  hasYear: boolean
  looksLikeWord: boolean
  entropyBits: number
  score: 0 | 1 | 2 | 3 | 4
}

const LEET: Record<string, string> = { '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't' }

function hasSequence(pw: string) {
  const s = pw.toLowerCase()
  for (let i = 0; i < s.length - 3; i++) {
    const a = s.charCodeAt(i)
    if (s.charCodeAt(i + 1) === a + 1 && s.charCodeAt(i + 2) === a + 2 && s.charCodeAt(i + 3) === a + 3) return true
    if (s.charCodeAt(i + 1) === a - 1 && s.charCodeAt(i + 2) === a - 2 && s.charCodeAt(i + 3) === a - 3) return true
  }
  return /qwert|asdfg|zxcvb/.test(s)
}

export function analyzePassword(pw: string): PasswordFeatures {
  const lower = pw.toLowerCase()
  const deLeet = lower.replace(/[@4310!$57]/g, (c) => LEET[c] || c)
  const f = {
    length: pw.length,
    hasLower: /[a-z]/.test(pw),
    hasUpper: /[A-Z]/.test(pw),
    hasDigit: /\d/.test(pw),
    hasSymbol: /[^A-Za-z0-9]/.test(pw),
    isCommon: COMMON.includes(lower) || COMMON.includes(deLeet),
    hasSequence: hasSequence(pw),
    hasRepeat: /(.)\1\1/.test(pw),
    hasYear: /(19|20)\d{2}/.test(pw),
    looksLikeWord: WORDS.some((w) => deLeet.includes(w)),
  }

  const pool = (f.hasLower ? 26 : 0) + (f.hasUpper ? 26 : 0) + (f.hasDigit ? 10 : 0) + (f.hasSymbol ? 33 : 0)
  let entropy = pw.length * Math.log2(Math.max(pool, 1))
  if (f.isCommon) entropy = Math.min(entropy, 10)
  if (f.hasSequence) entropy *= 0.75
  if (f.hasRepeat) entropy *= 0.85
  if (f.hasYear) entropy -= 6
  if (f.looksLikeWord) entropy *= 0.8
  entropy = Math.max(0, Math.round(entropy))

  const score = (entropy < 28 ? 0 : entropy < 40 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4) as PasswordFeatures['score']
  return { ...f, entropyBits: entropy, score }
}

/** Rough offline-attack crack time (10 billion guesses / second). */
export function crackTime(entropyBits: number) {
  const seconds = Math.pow(2, entropyBits) / 2 / 1e10
  if (seconds < 1) return 'instantly'
  const units: [number, string][] = [
    [60, 'seconds'], [60, 'minutes'], [24, 'hours'], [365, 'days'], [100, 'years'], [10000, 'centuries'],
  ]
  let v = seconds
  for (const [size, name] of units) {
    if (v < size) return `${Math.round(v)} ${name}`
    v /= size
  }
  return 'millions of years'
}

export const SCORE_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
