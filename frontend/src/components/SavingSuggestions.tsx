import { Lightbulb, TrendingDown } from 'lucide-react'
import type { AdviceResponse, Priority } from '@shared/finance'
import Panel, { AiBadge } from './Panel'

const PRIORITY: Record<Priority, { label: string; cls: string; dot: string }> = {
  high: { label: 'High priority', cls: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  medium: { label: 'Medium priority', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  low: { label: 'Low priority', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

interface Props {
  advice: AdviceResponse
  money: (v: number) => string
  limit?: number
  onMore?: () => void
}

export default function SavingSuggestions({ advice, money, limit, onMore }: Props) {
  const list = limit ? advice.saving_suggestions.slice(0, limit) : advice.saving_suggestions
  return (
    <Panel
      title="AI Saving Suggestions"
      subtitle="Personalised ideas ranked by priority. Impacts are estimates, not guarantees."
      icon={Lightbulb}
      badge={<AiBadge mode={advice.mode} />}
      action={
        onMore && (
          <button onClick={onMore} className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </button>
        )
      }
    >
      <ul className={`grid gap-3 ${limit ? '' : 'md:grid-cols-2'}`}>
        {list.map((s, i) => {
          const p = PRIORITY[s.priority]
          return (
            <li key={s.title + i} className="group rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/30">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-snug">{s.title}</h3>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} /> {p.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.explanation}</p>
              {s.estimated_monthly_impact > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingDown className="h-3.5 w-3.5" /> Potential: ~{money(s.estimated_monthly_impact)}/month
                  <span className="font-normal text-emerald-600">(est.)</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
