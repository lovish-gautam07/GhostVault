'use client'

import { useEffect, useRef, useState } from 'react'
import { aiApi, type ChatMessage } from '@/lib/api'
import { MessageCircle, X, Send, Sparkles, Lock } from './Icons'

const SUGGESTIONS = [
  'What is GhostVault?',
  'How does the dead man\'s switch work?',
  'Is my data really encrypted?',
  'How do I add a trusted contact?',
]

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    "Hi, I'm Ghost, your GhostVault assistant. Ask me about encryption, the dead man's switch, check-ins or planning your digital legacy.",
}

// Light cleanup so model markdown reads well as plain text
function tidy(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\s*[*]\s+/gm, '• ').replace(/^#+\s*/gm, '')
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  const send = async (text: string) => {
    const content = text.trim().slice(0, 1000)
    if (!content || loading) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      // Send only the recent conversation (welcome message excluded)
      const history = next.filter((m) => m !== WELCOME).slice(-10)
      const res = await aiApi.chat(history)
      setOffline(res.source === 'offline')
      setMessages([...next, { role: 'assistant', content: res.reply }])
    } catch (err: any) {
      setMessages([
        ...next,
        { role: 'assistant', content: err?.message?.includes('Too many') ? err.message : 'Sorry, I could not reach the server. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 h-[32rem] max-h-[75vh] flex flex-col bg-white dark:bg-vault-900 border border-vault-200 dark:border-vault-700 rounded-xl shadow-modal animate-slide-up"
          role="dialog"
          aria-label="GhostVault AI assistant"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-vault-200 dark:border-vault-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-600 text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-vault-900 dark:text-vault-100">Ghost · AI Assistant</p>
                <p className="text-[11px] text-vault-500">{offline ? 'Offline help mode' : 'Powered by Gemini'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-vault-400 hover:text-vault-600 dark:hover:text-vault-200 p-1 rounded" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-accent-600 text-white'
                      : 'bg-vault-100 dark:bg-vault-800 text-vault-800 dark:text-vault-100'
                  }`}
                >
                  {m.role === 'assistant' ? tidy(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-vault-100 dark:bg-vault-800 rounded-lg px-3 py-2 text-xs text-vault-500 animate-pulse">Ghost is thinking…</div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-accent-300 dark:border-accent-700 text-accent-700 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="border-t border-vault-200 dark:border-vault-700 p-3"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about GhostVault…"
                maxLength={1000}
                className="gv-input text-xs flex-1"
                aria-label="Message"
              />
              <button type="submit" disabled={loading || !input.trim()} className="gv-btn-primary px-3 py-2" aria-label="Send">
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-vault-400 mt-1.5 flex items-center gap-1">
              <Lock size={10} /> Never paste passwords or secrets into chat.
            </p>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 sm:right-6 z-40 w-12 h-12 rounded-full bg-accent-600 hover:bg-accent-700 text-white shadow-modal flex items-center justify-center transition-transform hover:scale-105"
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
