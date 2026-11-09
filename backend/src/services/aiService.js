/**
 * GhostVault AI Service
 *
 * Talks to Google Gemini over its REST API. The API key is read ONLY from the
 * server environment (GEMINI_API_KEY) and is never returned to clients or logged.
 *
 * Privacy rules enforced here:
 *  - Vault secrets (encrypted payloads, IVs, master passwords) are NEVER sent to the AI.
 *  - The Security Advisor only sends anonymous counts/metadata (no titles, no emails).
 *  - The Password Checker only sends derived features (length, character classes),
 *    never the password itself.
 *  - The Legacy Letter Writer only sends text the user explicitly chooses to share.
 *
 * Every feature has an offline fallback so the app keeps working without a key.
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 20000;

export function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

export function isAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
}

/**
 * Low-level Gemini call. Returns plain text. Throws a sanitized error on failure.
 * @param {{ system: string, messages: {role: 'user'|'assistant', content: string}[], temperature?: number, maxTokens?: number }} opts
 */
export async function generateText({ system, messages, temperature = 0.6, maxTokens = 1024 }) {
  if (!isAiConfigured()) {
    const err = new Error('AI is not configured');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(getModel())}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Key goes in a header (not the URL) so it never shows up in access logs
        'x-goog-api-key': process.env.GEMINI_API_KEY.trim()
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      // Do not forward upstream error bodies (could contain request details)
      console.error(`[AI] Gemini request failed with status ${response.status}`);
      const err = new Error('AI provider request failed');
      err.code = 'AI_UPSTREAM_ERROR';
      throw err;
    }

    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('')
      .trim();

    if (!text) {
      const err = new Error('AI returned an empty response');
      err.code = 'AI_EMPTY';
      throw err;
    }
    return text;
  } catch (error) {
    if (error.name === 'AbortError') {
      const err = new Error('AI request timed out');
      err.code = 'AI_TIMEOUT';
      throw err;
    }
    if (error.code) throw error;
    console.error('[AI] Gemini request error:', error.message);
    const err = new Error('AI provider request failed');
    err.code = 'AI_UPSTREAM_ERROR';
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. Chat assistant
// ---------------------------------------------------------------------------

export const CHAT_SYSTEM_PROMPT = `You are "Ghost", the friendly built-in assistant for GhostVault.

About GhostVault:
- GhostVault is an encrypted digital legacy and emergency access manager with a dead man's switch.
- Users store sensitive items (notes, passwords/credentials, document references, personal letters).
- Everything is encrypted in the browser with AES-256-GCM. The key is derived from the user's master password with PBKDF2 (100,000 iterations). The server only ever stores ciphertext (zero-knowledge).
- Dead man's switch: the user checks in (dashboard button or email link). If they stay inactive longer than an item's release threshold (e.g. 7, 30, 90 days, configurable 1-365), that item is released to the trusted contacts assigned to it.
- Trusted contacts: people (name + email) who receive emergency access links. Each item can be assigned to specific contacts.
- Daily background jobs send check-in reminders and trigger releases.
- AI tools: this chat assistant, an AI Legacy Letter Writer (helps draft messages for loved ones), an AI Security Advisor (reviews vault setup using only anonymous metadata), and a Password Strength Checker (analyses passwords locally in the browser).
- If a user forgets their master password, encrypted data CANNOT be recovered by anyone, including GhostVault.

Rules:
- Be concise (under 150 words unless asked for detail), warm and practical. Use short bullet points when listing steps.
- NEVER ask the user to share passwords, master passwords, seed phrases, PINs or other secrets in the chat. If they share one, tell them to change it and not to paste secrets into chat.
- You cannot see or access the user's vault contents.
- For legal questions (wills, estates) give general information and suggest consulting a qualified professional.
- Stay on topics related to GhostVault, digital legacy planning, password hygiene and online security. Politely decline unrelated requests.`;

const FAQ = [
  {
    keys: ['what is', 'about', 'ghostvault', 'what does', 'purpose', 'problem'],
    answer:
      'GhostVault is an encrypted digital legacy manager. You store important secrets (passwords, instructions, personal letters). If you stop checking in for a period you choose, a dead man\'s switch automatically releases those items to people you trust, so your family is never locked out of your digital life.'
  },
  {
    keys: ['encrypt', 'secure', 'safe', 'aes', 'zero', 'privacy', 'see my'],
    answer:
      'Your data is encrypted in your browser with AES-256-GCM before it leaves your device. The key is derived from your master password (PBKDF2, 100k iterations). The server only stores ciphertext, so not even GhostVault can read your vault.'
  },
  {
    keys: ['dead man', 'switch', 'inactive', 'release', 'trigger', 'threshold', 'tier'],
    answer:
      'Each vault item has a release threshold in days (1-365). If you don\'t check in for longer than that, the item is released to the trusted contacts assigned to it. Check in anytime to reset the timer.'
  },
  {
    keys: ['check in', 'check-in', 'checkin', 'reminder', 'timer'],
    answer:
      'Click "Check In" on your dashboard (or the link in a reminder email) to prove you\'re active. This resets the dead man\'s switch timer for all your items.'
  },
  {
    keys: ['contact', 'family', 'beneficiary', 'trusted', 'who gets'],
    answer:
      'Add trusted contacts (name and email) on the dashboard, then assign them to vault items when you create them. Only assigned contacts receive that item if it is released.'
  },
  {
    keys: ['forgot', 'lost', 'recover', 'reset'],
    answer:
      'Because GhostVault is zero-knowledge, a forgotten master password cannot be recovered. Your encrypted items stay unreadable. Store a hint (not the password!) somewhere safe.'
  },
  {
    keys: ['password', 'strong', 'weak', 'strength'],
    answer:
      'Use the Password Strength Checker on your dashboard. It analyses passwords locally in your browser. Aim for 14+ characters, mixed character types, or a passphrase of 4+ random words, and never reuse passwords.'
  },
  {
    keys: ['letter', 'message', 'write', 'loved', 'goodbye'],
    answer:
      'When adding a Note, click "AI Letter Writer" to get help drafting a heartfelt message for a loved one. You review it, then it is encrypted before saving.'
  },
  {
    keys: ['add', 'create', 'store', 'new item', 'save'],
    answer:
      'On the dashboard click "Add Item", choose a category (note, password or document), set a release threshold, assign contacts, then click "Encrypt & Store".'
  }
];

/** Offline keyword-based answer used when Gemini is unavailable. */
export function fallbackChatAnswer(question = '') {
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    const score = entry.keys.filter((k) => q.includes(k)).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  if (best) return best.answer;
  return 'I can help with GhostVault features: encryption, the dead man\'s switch, check-ins, trusted contacts, release thresholds, password safety and writing legacy letters. What would you like to know?';
}

export async function chat(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  try {
    const reply = await generateText({
      system: CHAT_SYSTEM_PROMPT,
      messages,
      temperature: 0.5,
      maxTokens: 800
    });
    return { reply, source: 'ai' };
  } catch (error) {
    return { reply: fallbackChatAnswer(lastUser?.content), source: 'offline' };
  }
}

// ---------------------------------------------------------------------------
// 2. Legacy letter writer
// ---------------------------------------------------------------------------

const TONES = {
  heartfelt: 'warm, heartfelt and loving',
  practical: 'clear, calm and practical (focus on instructions)',
  uplifting: 'hopeful, uplifting and gentle',
  formal: 'respectful and formal'
};

export function buildLetterPrompt({ draft, recipientName, relationship, tone }) {
  return `Write a personal legacy letter that will be delivered to a loved one only if the author can no longer reach them.

Recipient name: ${recipientName || '(not given)'}
Relationship to author: ${relationship || '(not given)'}
Tone: ${TONES[tone] || TONES.heartfelt}

Author's notes / rough draft (use these ideas, keep the author's voice, do not invent major facts):
"""
${draft}
"""

Requirements:
- 120-300 words, first person, plain text, no markdown, no title.
- Do NOT include any passwords, PINs or account numbers even if present in the notes; replace them with "[stored separately in my vault]".
- End with a warm sign-off line without a name placeholder.`;
}

export function fallbackLetter({ draft, recipientName, tone }) {
  const greeting = recipientName ? `Dear ${recipientName},` : 'Dear loved one,';
  const opening =
    tone === 'practical'
      ? 'If you are reading this, I have prepared a few things to make the coming days easier for you.'
      : 'If you are reading this, I could not be there to tell you these things myself, so I wrote them down for you.';
  const closing =
    tone === 'formal'
      ? 'With respect and gratitude,'
      : tone === 'practical'
      ? 'Take your time, lean on each other, and know that I planned this with care.\n\nWith love,'
      : 'Please remember how much you mean to me. I am always with you.\n\nWith all my love,';
  return `${greeting}\n\n${opening}\n\n${draft.trim()}\n\n${closing}`;
}

export async function writeLetter(input) {
  try {
    const letter = await generateText({
      system:
        'You help people write meaningful legacy letters for their loved ones. You are compassionate, never morbid, and you never include secrets such as passwords.',
      messages: [{ role: 'user', content: buildLetterPrompt(input) }],
      temperature: 0.8,
      maxTokens: 1200
    });
    return { letter, source: 'ai' };
  } catch (error) {
    return { letter: fallbackLetter(input), source: 'offline' };
  }
}

// ---------------------------------------------------------------------------
// 3. Security advisor (metadata only)
// ---------------------------------------------------------------------------

/**
 * Pure rule engine. Input is anonymous metadata only.
 * @param {{ itemCount:number, contactCount:number, itemsWithoutContacts:number, contactsWithoutItems:number,
 *           releaseTiers:number[], daysSinceCheckin:number, typeCounts:Record<string,number> }} m
 */
export function analyzeVaultMetadata(m) {
  const findings = [];
  let score = 100;

  if (m.itemCount === 0) {
    findings.push({ level: 'warning', title: 'Your vault is empty', detail: 'Add at least one item (e.g. instructions for your family) so the dead man\'s switch has something to protect.' });
    score -= 30;
  }
  if (m.contactCount === 0) {
    findings.push({ level: 'critical', title: 'No trusted contacts', detail: 'If the switch triggers, nobody will receive your items. Add at least one trusted contact.' });
    score -= 30;
  } else if (m.contactCount === 1) {
    findings.push({ level: 'info', title: 'Single point of failure', detail: 'Only one trusted contact is set. Consider adding a backup person in case their email changes.' });
    score -= 5;
  }
  if (m.itemsWithoutContacts > 0) {
    findings.push({ level: 'warning', title: `${m.itemsWithoutContacts} item(s) have no recipient`, detail: 'These items will never be released to anyone. Assign trusted contacts to them.' });
    score -= Math.min(25, m.itemsWithoutContacts * 8);
  }
  if (m.contactsWithoutItems > 0) {
    findings.push({ level: 'info', title: `${m.contactsWithoutItems} contact(s) receive nothing`, detail: 'Assign items to these contacts or remove them to keep your setup clean.' });
    score -= 3;
  }
  const minTier = m.releaseTiers.length ? Math.min(...m.releaseTiers) : null;
  if (minTier !== null && minTier < 7) {
    findings.push({ level: 'warning', title: `Very short release threshold (${minTier} day${minTier === 1 ? '' : 's'})`, detail: 'A vacation or hospital stay could trigger an accidental release. 14-30 days is safer for most items.' });
    score -= 10;
  }
  if (minTier !== null && m.daysSinceCheckin >= Math.max(1, minTier - 2)) {
    findings.push({ level: 'critical', title: 'Check in soon', detail: `You last checked in ${m.daysSinceCheckin} day(s) ago and your shortest threshold is ${minTier} days.` });
    score -= 20;
  } else if (m.daysSinceCheckin > 14) {
    findings.push({ level: 'info', title: 'Regular check-ins', detail: `It has been ${m.daysSinceCheckin} days since your last check-in. A weekly habit keeps the switch healthy.` });
    score -= 5;
  }
  if (m.itemCount > 0 && !m.typeCounts.note) {
    findings.push({ level: 'info', title: 'Add instructions or a personal note', detail: 'Credentials alone can be confusing. A note explaining what to do first helps your loved ones a lot.' });
    score -= 5;
  }
  if (findings.length === 0) {
    findings.push({ level: 'good', title: 'Your legacy setup looks healthy', detail: 'Items are assigned, contacts are set and your check-ins are up to date.' });
  }

  return { score: Math.max(0, Math.min(100, score)), findings };
}

export async function adviseOnVault(metadata) {
  const analysis = analyzeVaultMetadata(metadata);
  let summary = null;
  let source = 'offline';
  try {
    summary = await generateText({
      system:
        'You are a digital legacy security advisor inside the GhostVault app. You only receive anonymous counts, never secrets. Give a friendly, specific summary in 3-5 short bullet points starting with "- ". Plain text, no markdown headings, under 120 words.',
      messages: [
        {
          role: 'user',
          content: `Vault metadata: ${JSON.stringify(metadata)}\nRule-based findings: ${JSON.stringify(analysis.findings)}\nHealth score: ${analysis.score}/100\nGive prioritized, actionable advice.`
        }
      ],
      temperature: 0.4,
      maxTokens: 600
    });
    source = 'ai';
  } catch {
    summary = analysis.findings.map((f) => `- ${f.title}: ${f.detail}`).join('\n');
  }
  return { ...analysis, summary, source, metadata };
}

// ---------------------------------------------------------------------------
// 4. Password tips (features only, never the password)
// ---------------------------------------------------------------------------

export function fallbackPasswordTips(f) {
  const tips = [];
  if (f.length < 12) tips.push(`Make it longer: ${f.length} characters is short. Aim for at least 14.`);
  const classes = [f.hasLower, f.hasUpper, f.hasDigit, f.hasSymbol].filter(Boolean).length;
  if (classes < 3) tips.push('Mix uppercase, lowercase, numbers and symbols.');
  if (f.isCommon) tips.push('This is a very common password. Attackers try it first. Pick something unique.');
  if (f.hasSequence) tips.push('Avoid sequences like "1234" or "abcd".');
  if (f.hasRepeat) tips.push('Avoid repeated characters like "aaa" or "111".');
  if (f.hasYear) tips.push('Avoid years and dates. They are easy to guess.');
  if (f.looksLikeWord) tips.push('Dictionary words with simple substitutions (p@ssw0rd) are cracked quickly.');
  if (tips.length === 0) tips.push('Great password! Make sure it is unique to this account and stored in your vault.');
  tips.push('Tip: a passphrase of 4+ random words (e.g. "copper-lantern-river-maple") is long, strong and memorable.');
  return tips;
}

export async function passwordTips(features) {
  try {
    const text = await generateText({
      system:
        'You are a password security coach. You receive ONLY anonymous features of a password, never the password. Reply with 2-4 short, specific tips, one per line, each starting with "- ". Plain text, under 90 words.',
      messages: [{ role: 'user', content: `Password features: ${JSON.stringify(features)}` }],
      temperature: 0.4,
      maxTokens: 400
    });
    const tips = text
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
    return { tips: tips.length ? tips : fallbackPasswordTips(features), source: 'ai' };
  } catch {
    return { tips: fallbackPasswordTips(features), source: 'offline' };
  }
}
