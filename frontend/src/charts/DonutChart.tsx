import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { tooltipStyle } from './theme'

export interface Slice {
  name: string
  value: number
  color: string
}

interface Props {
  data: Slice[]
  format: (v: number) => string
  centerLabel: string
  centerValue: string
  height?: number
}

/** Donut with a centred total and a legend listing each slice's value and share. */
export default function DonutChart({ data, format, centerLabel, centerValue, height = 220 }: Props) {
  const slices = data.filter((d) => d.value > 0)
  const total = slices.reduce((s, d) => s + d.value, 0)
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="relative mx-auto w-full max-w-[220px]" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {slices.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: number) => format(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-slate-500">{centerLabel}</p>
            <p className="tabular text-lg font-bold">{centerValue}</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {slices.map((d) => (
          <li key={d.name} className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-slate-600">{d.name}</span>
            <span className="tabular font-semibold">{format(d.value)}</span>
            <span className="tabular w-10 text-right text-xs text-slate-400">{total ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
