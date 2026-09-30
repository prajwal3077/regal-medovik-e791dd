import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, tooltipStyle } from './theme'

interface Props {
  income: number
  needs: number
  wants: number
  format: (v: number) => string
  formatAxis: (v: number) => string
}

export default function IncomeExpenseChart({ income, needs, wants, format, formatAxis }: Props) {
  const data = [
    { name: 'Income', value: income, color: COLORS.income },
    { name: 'Needs', value: needs, color: '#818cf8' },
    { name: 'Wants', value: wants, color: COLORS.wants },
    { name: 'Total expenses', value: needs + wants, color: COLORS.expenses },
  ]
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 12 }} tickFormatter={formatAxis} width={56} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f8fafc' }} formatter={(v: number) => [format(v), 'Amount']} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
