import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Flag,
  Gauge,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { CURRENCIES, computeMetrics, formatMoney, type FinancialInput, type ExpenseItem, type RiskPreference } from '@shared/finance'
import Logo from '../components/Logo'
import Disclaimer from '../components/Disclaimer'
import { GOALS, demoInput } from '../data/demo'

interface Props {
  initial: FinancialInput
  error: { message: string; details: string[] } | null
  onSubmit: (data: FinancialInput) => void
  onBack: () => void
  hasPlan: boolean
}

const RISKS: { id: RiskPreference; label: string; text: string }[] = [
  { id: 'conservative', label: 'Conservative', text: 'Safety first, steady progress' },
  { id: 'balanced', label: 'Balanced', text: 'A mix of safety and growth' },
  { id: 'aggressive', label: 'Aggressive', text: 'Comfortable with more risk' },
]

function Section({ n, icon: Icon, title, hint, children }: { n: number; icon: typeof Banknote; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="card animate-fade-up p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Step {n} of 4</p>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MoneyInput({
  id,
  value,
  onChange,
  symbol,
  placeholder = '0',
  invalid,
}: {
  id?: string
  value: number
  onChange: (v: number) => void
  symbol: string
  placeholder?: string
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">{symbol}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value ? value : ''}
        placeholder={placeholder}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className={`input tabular ${symbol.length > 1 ? 'pl-12' : 'pl-8'} ${invalid ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
      />
    </div>
  )
}

export default function PlanForm({ initial, error, onSubmit, onBack, hasPlan }: Props) {
  const [form, setForm] = useState<FinancialInput>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customGoal, setCustomGoal] = useState(!GOALS.includes(initial.financialGoal))

  const set = <K extends keyof FinancialInput>(key: K, value: FinancialInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const setExpense = (id: string, patch: Partial<ExpenseItem>) =>
    setForm((f) => ({ ...f, expenses: f.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const addExpense = () =>
    setForm((f) => ({ ...f, expenses: [...f.expenses, { id: `custom-${Date.now()}`, name: '', amount: 0, type: 'want' }] }))
  const removeExpense = (id: string) => setForm((f) => ({ ...f, expenses: f.expenses.filter((e) => e.id !== id) }))

  const symbol = CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? form.currency
  const m = useMemo(() => computeMetrics(form), [form])
  const money = (v: number) => formatMoney(v, form.currency)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.income || form.income <= 0) e.income = 'Please enter your monthly income.'
    form.expenses.forEach((x) => {
      if (x.id.startsWith('custom') && x.amount > 0 && !x.name.trim()) e[`exp-${x.id}`] = 'Name this expense.'
    })
    if (m.totalExpenses <= 0) e.expenses = 'Add at least one monthly expense.'
    if (form.targetAmount > 0 && form.targetAmount < form.currentSavings) e.targetAmount = 'Your target is already below your current savings.'
    if (form.targetDate && new Date(form.targetDate) <= new Date()) e.targetDate = 'Choose a date in the future.'
    if (!form.financialGoal.trim()) e.goal = 'Tell us what you are saving for.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onSubmit({
      ...form,
      expenses: form.expenses.map((x) => ({ ...x, name: x.name.trim() || 'Other' })),
      financialGoal: form.financialGoal.trim(),
      notes: form.notes.trim(),
    })
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {hasPlan ? 'Back to dashboard' : 'Back'}
          </button>
          <Logo />
          <button
            type="button"
            onClick={() => {
              setForm(demoInput())
              setCustomGoal(false)
              setErrors({})
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            <Wand2 className="h-4 w-4" /> <span className="hidden sm:inline">Fill demo data</span>
          </button>
        </div>
      </header>

      <form onSubmit={submit} noValidate className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create your financial plan</h1>
            <p className="mt-1.5 text-slate-500">Four quick sections. Your data stays in this browser session and is never stored.</p>
          </div>

          {error && (
            <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{error.message}</p>
                {error.details.length > 0 && (
                  <ul className="mt-1 list-disc pl-4">
                    {error.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <Section n={1} icon={Banknote} title="Income" hint="What comes in each month, after tax.">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_160px]">
              <div data-invalid={!!errors.income}>
                <label htmlFor="income" className="label">
                  Monthly income <span className="text-rose-500">*</span>
                </label>
                <MoneyInput id="income" value={form.income} onChange={(v) => set('income', v)} symbol={symbol} placeholder="50000" invalid={!!errors.income} />
                {errors.income && <p className="mt-1.5 text-xs text-rose-600">{errors.income}</p>}
              </div>
              <div>
                <label htmlFor="other" className="label">
                  Other monthly income
                </label>
                <MoneyInput id="other" value={form.otherIncome} onChange={(v) => set('otherIncome', v)} symbol={symbol} placeholder="Freelance, rent…" />
              </div>
              <div>
                <label htmlFor="currency" className="label">
                  Currency
                </label>
                <select id="currency" value={form.currency} onChange={(e) => set('currency', e.target.value)} className="input">
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          <Section n={2} icon={Receipt} title="Monthly expenses" hint="Approximate amounts are fine. Tag each one as a need or a want.">
            <div className="space-y-2.5" data-invalid={!!errors.expenses}>
              {form.expenses.map((x) => {
                const custom = x.id.startsWith('custom')
                const errKey = `exp-${x.id}`
                return (
                  <div key={x.id} className="grid grid-cols-[1fr_auto] items-center gap-2.5 sm:grid-cols-[1fr_180px_auto]" data-invalid={!!errors[errKey]}>
                    {custom ? (
                      <input
                        value={x.name}
                        onChange={(e) => setExpense(x.id, { name: e.target.value })}
                        placeholder="Expense name"
                        maxLength={60}
                        aria-label="Expense name"
                        className={`input col-span-2 sm:col-span-1 ${errors[errKey] ? 'border-rose-300' : ''}`}
                      />
                    ) : (
                      <label htmlFor={`exp-${x.id}`} className="col-span-2 text-sm font-medium text-slate-700 sm:col-span-1">
                        {x.name}
                      </label>
                    )}
                    <MoneyInput id={`exp-${x.id}`} value={x.amount} onChange={(v) => setExpense(x.id, { amount: v })} symbol={symbol} />
                    <div className="flex items-center gap-1.5">
                      <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold" role="radiogroup" aria-label={`${x.name || 'Expense'} type`}>
                        {(['need', 'want'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={x.type === t}
                            onClick={() => setExpense(x.id, { type: t })}
                            className={`rounded-md px-2.5 py-1.5 capitalize transition ${
                              x.type === t ? (t === 'need' ? 'bg-white text-brand-700 shadow-sm' : 'bg-white text-amber-700 shadow-sm') : 'text-slate-500'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      {custom && (
                        <button type="button" onClick={() => removeExpense(x.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove expense">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {errors.expenses && <p className="mt-2 text-xs text-rose-600">{errors.expenses}</p>}
            <button
              type="button"
              onClick={addExpense}
              disabled={form.expenses.length >= 40}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          </Section>

          <Section n={3} icon={Flag} title="Financial goal" hint="What are you saving towards?">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2" data-invalid={!!errors.goal}>
                <label htmlFor="goal" className="label">
                  Primary financial goal
                </label>
                <select
                  id="goal"
                  value={customGoal ? '__custom' : form.financialGoal}
                  onChange={(e) => {
                    if (e.target.value === '__custom') {
                      setCustomGoal(true)
                      set('financialGoal', '')
                    } else {
                      setCustomGoal(false)
                      set('financialGoal', e.target.value)
                    }
                  }}
                  className="input"
                >
                  {GOALS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                  <option value="__custom">Something else…</option>
                </select>
                {customGoal && (
                  <input
                    value={form.financialGoal}
                    onChange={(e) => set('financialGoal', e.target.value)}
                    placeholder="e.g. Wedding fund"
                    maxLength={120}
                    className="input mt-2.5"
                    autoFocus
                  />
                )}
                {errors.goal && <p className="mt-1.5 text-xs text-rose-600">{errors.goal}</p>}
              </div>
              <div data-invalid={!!errors.targetAmount}>
                <label htmlFor="target" className="label">
                  Target amount
                </label>
                <MoneyInput id="target" value={form.targetAmount} onChange={(v) => set('targetAmount', v)} symbol={symbol} placeholder="150000" invalid={!!errors.targetAmount} />
                {errors.targetAmount && <p className="mt-1.5 text-xs text-rose-600">{errors.targetAmount}</p>}
              </div>
              <div data-invalid={!!errors.targetDate}>
                <label htmlFor="date" className="label">
                  Target date
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.targetDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set('targetDate', e.target.value)}
                  className={`input ${errors.targetDate ? 'border-rose-300' : ''}`}
                />
                {errors.targetDate && <p className="mt-1.5 text-xs text-rose-600">{errors.targetDate}</p>}
              </div>
              <div>
                <label htmlFor="savings" className="label">
                  Current savings
                </label>
                <MoneyInput id="savings" value={form.currentSavings} onChange={(v) => set('currentSavings', v)} symbol={symbol} placeholder="40000" />
              </div>
            </div>
          </Section>

          <Section n={4} icon={Gauge} title="Preferences" hint="Helps FinWise AI tailor the tone of its advice.">
            <p className="label">Risk preference</p>
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
              {RISKS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={form.riskPreference === r.id}
                  onClick={() => set('riskPreference', r.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.riskPreference === r.id ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.text}</p>
                </button>
              ))}
            </div>
            <label htmlFor="notes" className="label mt-5">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything else FinWise AI should know? e.g. irregular income, upcoming expenses…"
              className="input resize-none"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{form.notes.length}/500</p>
          </Section>

          <div className="lg:hidden">
            <SubmitButton />
          </div>
        </div>

        {/* Live summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="eyebrow">Live snapshot</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Total income" value={money(m.totalIncome)} />
              <Row label="Total expenses" value={money(m.totalExpenses)} />
              <div className="border-t border-slate-100 pt-3">
                <Row label="Available balance" value={money(m.available)} strong tone={m.available < 0 ? 'text-rose-600' : 'text-emerald-600'} />
              </div>
            </dl>
            {m.totalIncome > 0 && (
              <div className="mt-5">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-brand-600 transition-all" style={{ width: `${Math.min(100, m.needsPct)}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${Math.min(100 - Math.min(100, m.needsPct), m.wantsPct)}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Needs {m.needsPct.toFixed(0)}%</span>
                  <span>Wants {m.wantsPct.toFixed(0)}%</span>
                  <span>Free {Math.max(0, 100 - m.expenseRatio).toFixed(0)}%</span>
                </div>
              </div>
            )}
            <div className="mt-6 hidden lg:block">
              <SubmitButton />
            </div>
          </div>
          <div className="mt-4">
            <Disclaimer compact />
          </div>
        </aside>
      </form>
    </div>
  )
}

function SubmitButton() {
  return (
    <button type="submit" className="btn-primary w-full py-3.5 text-[15px]">
      <Sparkles className="h-4 w-4" /> Generate My Financial Plan
    </button>
  )
}

function Row({ label, value, strong, tone = '' }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular ${strong ? `text-base font-bold ${tone}` : 'font-semibold'}`}>{value}</dd>
    </div>
  )
}
