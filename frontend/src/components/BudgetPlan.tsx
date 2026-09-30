import { CheckCircle2, PieChart as PieIcon, Wallet } from 'lucide-react'
import type { AdviceResponse, FinancialInput, Metrics } from '@shared/finance'
import Panel, { AiBadge } from './Panel'
import DonutChart from '../charts/DonutChart'
import { COLORS } from '../charts/theme'

interface Props {
  input: FinancialInput
  m: Metrics
  advice: AdviceResponse
  savings: number
  money: (v: number) => string
}

function Group({ title, color, total, pct, target, items, money }: {
  title: string
  color: string
  total: number
  pct: number
  target?: number
  items: { name: string; amount: number }[]
  money: (v: number) => string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {title}
        </p>
        <p className="tabular text-sm font-bold">{money(total)}</p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <div className="h-1.5 flex-1 rounded-full bg-slate-200/70">
          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
        </div>
        <span className="tabular">
          {pct.toFixed(0)}%{target !== undefined && <span className="text-slate-400"> / {target}% target</span>}
        </span>
      </div>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {items.map((i) => (
            <li key={i.name} className="flex justify-between text-sm">
              <span className="text-slate-600">{i.name}</span>
              <span className="tabular font-medium">{money(i.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function BudgetPlan({ input, m, advice, savings, money }: Props) {
  const bp = advice.budget_plan
  const pick = (t: 'need' | 'want') => input.expenses.filter((e) => e.type === t && e.amount > 0).map((e) => ({ name: e.name, amount: e.amount }))
  const buffer = Math.max(0, m.available - savings)
  const savingsPct = m.totalIncome ? (savings / m.totalIncome) * 100 : 0

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <Panel title="My Budget Plan" subtitle={bp.headline} icon={Wallet} badge={<AiBadge mode={advice.mode} />}>
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 text-white">
          <div>
            <p className="text-xs font-medium text-brand-100">Total monthly income</p>
            <p className="tabular text-2xl font-bold">{money(m.totalIncome)}</p>
          </div>
          <div className="text-right text-xs text-brand-100">
            <p>Salary {money(input.income)}</p>
            <p>Other {money(input.otherIncome)}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Group title="Needs" color={COLORS.needs} total={m.needsTotal} pct={m.needsPct} target={bp.needs_target_pct} items={pick('need')} money={money} />
          <Group title="Wants" color={COLORS.wants} total={m.wantsTotal} pct={m.wantsPct} target={bp.wants_target_pct} items={pick('want')} money={money} />
          <div className="md:col-span-2">
            <Group
              title="Savings (recommended)"
              color={COLORS.savings}
              total={savings}
              pct={savingsPct}
              target={bp.savings_target_pct}
              items={[
                { name: 'Recommended monthly savings', amount: savings },
                { name: 'Flexible buffer after saving', amount: buffer },
              ]}
              money={money}
            />
          </div>
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel title="Needs vs Wants vs Savings" subtitle="How each month's income is allocated" icon={PieIcon}>
          <DonutChart
            data={[
              { name: 'Needs', value: m.needsTotal, color: COLORS.needs },
              { name: 'Wants', value: m.wantsTotal, color: COLORS.wants },
              { name: 'Savings', value: savings, color: COLORS.savings },
              { name: 'Buffer', value: buffer, color: COLORS.buffer },
            ]}
            format={money}
            centerLabel="Income"
            centerValue={money(m.totalIncome)}
          />
        </Panel>
        <Panel title="Plan notes" subtitle="What stands out in your budget">
          <ul className="space-y-3">
            {bp.notes.map((n) => (
              <li key={n} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {n}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
