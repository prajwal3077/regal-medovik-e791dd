import { ArrowRightCircle, Crown, FileText, PiggyBank, ThumbsUp, TrendingUp } from 'lucide-react'
import type { AdviceResponse } from '@shared/finance'
import Panel, { AiBadge } from './Panel'

export default function MonthlySummary({ advice }: { advice: AdviceResponse }) {
  const s = advice.monthly_summary
  const rows = [
    { icon: Crown, label: 'Biggest spending category', text: s.biggest_category, tone: 'text-brand-600 bg-brand-50' },
    { icon: PiggyBank, label: 'Savings progress', text: s.savings_progress, tone: 'text-emerald-600 bg-emerald-50' },
    { icon: ThumbsUp, label: 'What’s going well', text: s.positive, tone: 'text-sky-600 bg-sky-50' },
    { icon: TrendingUp, label: 'Area to improve', text: s.improve, tone: 'text-amber-600 bg-amber-50' },
  ]
  return (
    <Panel title="AI Monthly Summary" subtitle={new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} icon={FileText} badge={<AiBadge mode={advice.mode} />}>
      <p className="text-[15px] leading-relaxed text-slate-700">{s.overview}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, text, tone }) => (
          <div key={label} className="flex gap-3 rounded-2xl border border-slate-100 p-4">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3 rounded-2xl bg-ink p-4 text-white">
        <ArrowRightCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next month’s focus</p>
          <p className="mt-1 text-sm leading-relaxed">{s.next_focus}</p>
        </div>
      </div>
    </Panel>
  )
}
