import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, MessageCircleQuestion, Sparkles, User } from 'lucide-react'
import type { ChatMessage, FinancialInput } from '@shared/finance'
import Panel from './Panel'
import { ApiError, askFinWise } from '../services/api'
import { EXAMPLE_QUESTIONS } from '../data/demo'

interface Props {
  input: FinancialInput
  messages: ChatMessage[]
  onMessages: (m: ChatMessage[]) => void
  compact?: boolean
}

/** Minimal, safe markdown: **bold**, bullet lists and paragraphs (rendered as React nodes, never HTML). */
function RichText({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
  const blocks = text.split(/\n{2,}/)
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter(Boolean)
        if (lines.length && lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>
              ))}
            </ul>
          )
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l.replace(/^#+\s*/, ''))}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export default function AskAI({ input, messages, onMessages, compact = false }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastMode, setLastMode] = useState<'ai' | 'demo' | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const ask = async (q: string) => {
    const question = q.trim()
    if (!question || busy) return
    setError('')
    setText('')
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }]
    onMessages(next)
    setBusy(true)
    try {
      const res = await askFinWise(input, question, messages)
      setLastMode(res.mode)
      onMessages([...next, { role: 'assistant', content: res.answer }])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'FinWise AI couldn’t answer right now. Please try again.')
      onMessages(messages)
      setText(question)
    } finally {
      setBusy(false)
    }
  }

  const examples = EXAMPLE_QUESTIONS.map((q) => (input.currency === 'INR' ? q : q.replace('₹5,000', '5,000')))

  return (
    <Panel
      title="Ask FinWise AI"
      subtitle="Ask anything about your budget — answers use your numbers from this session."
      icon={MessageCircleQuestion}
      badge={lastMode === 'demo' ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Demo Mode</span> : null}
    >
      <div ref={scroller} className={`-mx-1 space-y-4 overflow-y-auto px-1 ${compact ? 'max-h-80' : 'h-[min(52vh,460px)]'}`} aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-3 font-semibold">How can I help with your money today?</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Try one of these questions, or type your own.</p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {examples.map((q) => (
                <button key={q} onClick={() => ask(q)} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-left text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex animate-fade-up gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-brand-600 text-white'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' ? 'rounded-tr-md bg-brand-600 text-white' : 'rounded-tl-md border border-slate-100 bg-slate-50 text-slate-700'
              }`}
            >
              {msg.role === 'user' ? msg.content : <RichText text={msg.content} />}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-100 bg-slate-50 px-4 py-3.5" aria-label="FinWise AI is typing">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-500" style={{ animationDelay: `${d * 180}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {messages.length > 0 && !busy && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {examples
            .filter((q) => !messages.some((m) => m.content === q))
            .map((q) => (
              <button key={q} onClick={() => ask(q)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700">
                {q}
              </button>
            ))}
        </div>
      )}

      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(text)
        }}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-4 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Ask about your spending, savings or goal…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          aria-label="Your question"
        />
        <button type="submit" disabled={!text.trim() || busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40" aria-label="Send">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-slate-400">AI answers are educational estimates, not professional financial advice.</p>
    </Panel>
  )
}
