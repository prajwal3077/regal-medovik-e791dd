import { ArrowDownRight, ArrowUpRight, PiggyBank, Receipt, Scale, Wallet } from 'lucide-react'
import type { Metrics } from '@shared/finance'

interface Props {
  m: Metrics
  savings: number
  money: (v: number) => string
}

export default function SummaryCards({ m, savings, money }: Props) {
  const rate = m.totalIncome ? (savings / m.totalIncome) * 100 : 0
  const cards = [
    { label: 'Monthly Income', value: money(m.totalIncome), icon: Wallet, tone: 'bg-brand-50 text-brand-600', foot: 'Salary + other income', trend: null },
    {
      label: 'Total Expenses',
      value: money(m.totalExpenses),
      icon: Receipt,
      tone: 'bg-rose-50 text-rose-600',
      foot: `${m.expenseRatio.toFixed(0)}% of income`,
      trend: m.expenseRatio > 80 ? 'down' : null,
    },
    {
      label: 'Available Balance',
      value: money(m.available),
      icon: Scale,
      tone: m.available >= 0 ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600',
      foot: m.available >= 0 ? 'Left after expenses' : 'Spending exceeds income',
      trend: m.available >= 0 ? 'up' : 'down',
    },
    { label: 'Suggested Savings', value: money(savings), icon: PiggyBank, tone: 'bg-emerald-50 text-emerald-600', foot: `${rate.toFixed(0)}% savings rate`, trend: rate >= 20 ? 'up' : null },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone, foot, trend }, i) => (
        <div key={label} className="card animate-fade-up p-4 sm:p-5" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
            <div className={`grid h-8 w-8 place-items-center rounded-lg sm:h-9 sm:w-9 ${tone}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="tabular mt-3 text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
            {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />}
            {foot}
          </p>
        </div>
      ))}
    </div>
  )
}
