import { CalendarClock, Target } from 'lucide-react'
import type { FinancialInput, Metrics } from '@shared/finance'
import Panel, { EstimateBadge } from './Panel'

interface Props {
  input: FinancialInput
  m: Metrics
  savings: number
  money: (v: number) => string
}

export function etaLabel(months: number | null): string {
  if (months === null) return 'Not reachable yet'
  if (months === 0) return 'Reached'
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export default function GoalProgress({ input, m, savings, money }: Props) {
  const months = m.remainingToGoal <= 0 ? 0 : savings > 0 ? Math.ceil(m.remainingToGoal / savings) : null
  const onTrack = m.monthsUntilTarget === null || months === null ? null : months <= m.monthsUntilTarget

  return (
    <Panel title="Savings goal" subtitle={input.financialGoal} icon={Target} badge={<EstimateBadge />}>
      <div className="flex items-end justify-between gap-3">
        <p className="tabular text-2xl font-bold tracking-tight">
          {money(input.currentSavings)} <span className="text-base font-medium text-slate-400">/ {money(input.targetAmount)}</span>
        </p>
        <span className="tabular text-sm font-semibold text-emerald-600">{m.goalProgress.toFixed(0)}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(m.goalProgress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${m.goalProgress}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Remaining</p>
          <p className="tabular font-semibold">{money(m.remainingToGoal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Est. time</p>
          <p className="tabular font-semibold">{months === null ? '—' : months === 0 ? 'Done' : `${months} mo`}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Est. reach</p>
          <p className="font-semibold">{etaLabel(months)}</p>
        </div>
      </div>
      {onTrack !== null && (
        <p className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${onTrack ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          <CalendarClock className="h-4 w-4 shrink-0" />
          {onTrack
            ? `On track for your target date (${m.monthsUntilTarget} months away).`
            : `You'd need about ${money(m.requiredMonthly ?? 0)}/month to hit your target date.`}
        </p>
      )}
    </Panel>
  )
}
