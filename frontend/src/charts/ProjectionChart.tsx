import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, tooltipStyle } from './theme'

interface Props {
  start: number
  target: number
  current: number
  scenario: number
  format: (v: number) => string
  formatAxis: (v: number) => string
}

/** Projected savings balance over time for the current plan vs the what-if scenario. */
export default function ProjectionChart({ start, target, current, scenario, format, formatAxis }: Props) {
  const remaining = Math.max(0, target - start)
  const slowest = Math.min(current, scenario) > 0 ? remaining / Math.min(current, scenario) : 24
  const months = Math.min(60, Math.max(6, Math.ceil(slowest) + 2))
  const data = Array.from({ length: months + 1 }, (_, i) => ({
    month: i === 0 ? 'Now' : `M${i}`,
    current: start + current * i,
    scenario: start + scenario * i,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gScenario" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.savings} stopOpacity={0.25} />
            <stop offset="100%" stopColor={COLORS.savings} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 11 }} interval="preserveStartEnd" minTickGap={20} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 11 }} tickFormatter={formatAxis} width={56} />
        <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [format(v), n === 'current' ? 'Current plan' : 'What-if']} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) => <span className="text-slate-600">{v === 'current' ? 'Current plan' : 'What-if scenario'}</span>}
        />
        {target > 0 && <ReferenceLine y={target} stroke="#0f172a" strokeDasharray="4 4" label={{ value: 'Goal', position: 'insideTopLeft', fill: '#0f172a', fontSize: 11 }} />}
        <Area type="monotone" dataKey="current" stroke={COLORS.needs} strokeWidth={2} fill="transparent" strokeDasharray="5 4" dot={false} />
        <Area type="monotone" dataKey="scenario" stroke={COLORS.savings} strokeWidth={2.5} fill="url(#gScenario)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
