import { useState } from 'react'
import { FlaskConical, RotateCcw, Rocket } from 'lucide-react'
import { monthsToReach, type FinancialInput, type Metrics } from '@shared/finance'
import Panel, { EstimateBadge } from './Panel'
import ProjectionChart from '../charts/ProjectionChart'
import { etaLabel } from './GoalProgress'

interface Props {
  input: FinancialInput
  m: Metrics
  savings: number
  money: (v: number) => string
  axis: (v: number) => string
}

function Slider({ label, value, onChange, max, step, money, hint }: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
  step: number
  money: (v: number) => string
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <input
          type="number"
          min={0}
          step={step}
          value={Math.round(value)}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="input tabular w-32 py-1.5 text-right"
          aria-label={label}
        />
      </div>
      <input type="range" min={0} max={Math.max(max, value)} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="mt-3 w-full" aria-label={`${label} slider`} />
      <div className="mt-0.5 flex justify-between text-[11px] text-slate-400">
        <span>{money(0)}</span>
        {hint && <span className="text-slate-500">{hint}</span>}
        <span>{money(Math.max(max, value))}</span>
      </div>
    </div>
  )
}

export default function WhatIf({ input, m, savings, money, axis }: Props) {
  const [income, setIncome] = useState(m.totalIncome)
  const [expenses, setExpenses] = useState(m.totalExpenses)
  const [save, setSave] = useState(savings)

  const reset = () => {
    setIncome(m.totalIncome)
    setExpenses(m.totalExpenses)
    setSave(savings)
  }

  const available = income - expenses
  const rate = income > 0 ? (save / income) * 100 : 0
  const baseMonths = monthsToReach(m.remainingToGoal, savings)
  const newMonths = monthsToReach(m.remainingToGoal, save)
  const overspend = save > available
  const step = income >= 100000 ? 1000 : 500

  let verdict: { text: string; tone: string }
  if (m.remainingToGoal <= 0) verdict = { text: 'You have already reached your goal.', tone: 'bg-emerald-50 text-emerald-800' }
  else if (newMonths === null) verdict = { text: 'With no monthly savings, the goal can’t be reached. Try increasing savings.', tone: 'bg-rose-50 text-rose-800' }
  else if (baseMonths === null) verdict = { text: `You could reach your goal in approximately ${newMonths} months.`, tone: 'bg-emerald-50 text-emerald-800' }
  else if (newMonths < baseMonths)
    verdict = { text: `You could reach your goal approximately ${baseMonths - newMonths} month${baseMonths - newMonths === 1 ? '' : 's'} earlier.`, tone: 'bg-emerald-50 text-emerald-800' }
  else if (newMonths > baseMonths)
    verdict = { text: `This would delay your goal by approximately ${newMonths - baseMonths} month${newMonths - baseMonths === 1 ? '' : 's'}.`, tone: 'bg-amber-50 text-amber-800' }
  else verdict = { text: 'Your goal timeline stays about the same.', tone: 'bg-slate-100 text-slate-700' }

  return (
    <Panel
      title="What If?"
      subtitle="Adjust the numbers and see how your plan changes instantly."
      icon={FlaskConical}
      badge={<EstimateBadge label="Estimates" />}
      action={
        <button onClick={reset} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Slider label="Monthly income" value={income} onChange={setIncome} max={Math.round(m.totalIncome * 2)} step={step} money={money} hint={`Now ${money(m.totalIncome)}`} />
          <Slider label="Monthly expenses" value={expenses} onChange={setExpenses} max={Math.round(Math.max(m.totalExpenses * 1.6, 1000))} step={step} money={money} hint={`Now ${money(m.totalExpenses)}`} />
          <Slider label="Monthly savings" value={save} onChange={setSave} max={Math.round(Math.max(available, savings * 2, 1000))} step={step} money={money} hint={`Now ${money(savings)}`} />
          {overspend && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              Savings exceed your available balance by {money(save - available)} — this scenario isn’t sustainable without cutting expenses.
            </p>
          )}
        </div>

        <div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="New available balance" value={money(available)} delta={available - m.available} money={money} />
            <Stat label="New savings rate" value={`${rate.toFixed(0)}%`} delta={rate - (m.totalIncome ? (savings / m.totalIncome) * 100 : 0)} pct />
            <Stat label="Est. time to goal" value={newMonths === null ? '—' : `${newMonths} mo`} sub={etaLabel(newMonths)} />
          </div>
          <div className={`mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold ${verdict.tone}`}>
            <Rocket className="h-4 w-4 shrink-0" /> {verdict.text}
          </div>
          <div className="mt-5">
            <ProjectionChart start={input.currentSavings} target={input.targetAmount} current={savings} scenario={save} format={money} formatAxis={axis} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Estimates assume a constant monthly amount and exclude interest, inflation and unexpected costs.
          </p>
        </div>
      </div>
    </Panel>
  )
}

function Stat({ label, value, delta, money, pct, sub }: { label: string; value: string; delta?: number; money?: (v: number) => string; pct?: boolean; sub?: string }) {
  const show = delta !== undefined && Math.abs(delta) >= (pct ? 0.5 : 1)
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
      <p className="text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">{label}</p>
      <p className="tabular mt-1.5 text-base font-bold tracking-tight sm:text-xl">{value}</p>
      {show ? (
        <p className={`tabular mt-0.5 text-xs font-semibold ${delta! > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {delta! > 0 ? '+' : '−'}
          {pct ? `${Math.abs(delta!).toFixed(0)} pts` : money?.(Math.abs(delta!))}
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-slate-400">{sub ?? 'No change'}</p>
      )}
    </div>
  )
}
