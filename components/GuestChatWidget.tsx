'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react'

type Role = 'user' | 'assistant'
type ChatMessage = { id: string; role: Role; content: string }

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function GuestChatWidget() {
  const suggested = useMemo(
    () => [
      'What time is check-in and check-out?',
      'Is the pool heated?',
      'Is this place pet friendly?',
      'How many guests can the property accommodate?',
      'What entertainment is available for kids?',
      'What are the house rules?',
      'How far is it to the beach?',
    ],
    []
  )

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content:
        'Hi! Ask me anything about the property (amenities, policies, bedrooms, nearby, etc.). If I don’t have the info, I’ll point you to the enquiry form.',
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string>('')

  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    if (!open) return
    // Focus input when opened.
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return
    scrollToBottom()
  }, [open, messages.length])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }

      // Minimal focus trap inside the panel.
      if (e.key === 'Tab') {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null

        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const clearChat = () => {
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        content:
          'Chat cleared. Ask me anything about the property (amenities, policies, bedrooms, nearby, etc.).',
      },
    ])
    setError('')
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    setError('')
    setInput('')

    const nextMessages: ChatMessage[] = [...messages, { id: uid(), role: 'user', content: trimmed }]
    setMessages(nextMessages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const retryAfter = res.headers.get('retry-after')
        const body = await res.json().catch(() => null)
        const msg =
          res.status === 429
            ? `Too many requests. Please try again in ${retryAfter ?? 'a moment'} seconds.`
            : body?.error || 'Something went wrong. Please try again.'
        throw new Error(msg)
      }

      const data = (await res.json()) as { reply?: string }
      const reply = (data.reply || '').trim()
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: reply || 'Sorry — I couldn’t generate a response.' },
      ])
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSending(false)
      setTimeout(() => {
        scrollToBottom()
        inputRef.current?.focus()
      }, 0)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-luxury-gold text-white px-4 py-3 shadow-xl hover:shadow-2xl transition-shadow"
          aria-label="Open chat"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-semibold">Chat</span>
        </button>
      ) : (
        <div
          ref={panelRef}
          className="w-[92vw] max-w-sm md:max-w-md h-[70vh] md:h-[560px] bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="false"
          aria-label="Guest chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-luxury-dark truncate">Ask about the property</div>
              <div className="text-xs text-gray-600 truncate">Property-only answers</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 size={18} className="text-gray-700" />
              </button>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Close chat"
                title="Close"
              >
                <X size={18} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-luxury-gold text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-700 rounded-2xl rounded-bl-md px-3 py-2 text-sm inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Thinking…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Suggested */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {suggested.slice(0, 4).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full border bg-white hover:border-luxury-gold hover:text-luxury-gold transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form
            className="p-4 pt-3 border-t bg-white"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question…"
                rows={2}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSending || input.trim().length === 0}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-luxury-gold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Do not share personal or payment information. For bookings, use the enquiry form.
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

