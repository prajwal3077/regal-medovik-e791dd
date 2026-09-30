import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, tooltipStyle } from './theme'

interface Props {
  income: number
  needs: number
  wants: number
  savings: number
  format: (v: number) => string
  formatAxis: (v: number) => string
}

/** Waterfall: income flows down through needs, wants and savings to what is left over. */
export default function CashFlowChart({ income, needs, wants, savings, format, formatAxis }: Props) {
  const left = income - needs - wants - savings
  const steps = [
    { name: 'Income', base: 0, value: income, color: COLORS.income, sign: '' },
    { name: 'Needs', base: Math.max(0, income - needs), value: Math.min(needs, income), color: '#818cf8', sign: '−' },
    { name: 'Wants', base: Math.max(0, income - needs - wants), value: Math.max(0, Math.min(wants, income - needs)), color: COLORS.wants, sign: '−' },
    { name: 'Savings', base: Math.max(0, left), value: Math.max(0, Math.min(savings, income - needs - wants)), color: COLORS.savings, sign: '−' },
    { name: 'Left over', base: 0, value: Math.max(0, left), color: COLORS.buffer, sign: '' },
  ]
  const labels: Record<string, number> = { Income: income, Needs: needs, Wants: wants, Savings: savings, 'Left over': left }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={steps} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 12 }} tickFormatter={formatAxis} width={56} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: '#f8fafc' }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as (typeof steps)[number] | undefined
            if (!active || !p) return null
            return (
              <div style={tooltipStyle.contentStyle} className="bg-white">
                <p className="font-semibold text-ink">{p.name}</p>
                <p className="tabular text-slate-600">
                  {p.sign}
                  {format(Math.abs(labels[p.name]))}
                </p>
              </div>
            )
          }}
        />
        <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="value" stackId="w" radius={[6, 6, 6, 6]} maxBarSize={56}>
          {steps.map((s) => (
            <Cell key={s.name} fill={s.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
