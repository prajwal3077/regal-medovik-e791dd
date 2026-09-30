import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: React.ReactNode
  badge?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export default function Panel({ title, subtitle, icon: Icon, action, badge, className = '', children }: Props) {
  return (
    <section className={`card animate-fade-up p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}
          <div>
            <h2 className="flex flex-wrap items-center gap-2 text-base font-bold tracking-tight">
              {title} {badge}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function EstimateBadge({ label = 'Estimate' }: { label?: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
}

export function AiBadge({ mode }: { mode: 'ai' | 'demo' }) {
  return mode === 'ai' ? (
    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">Gemini</span>
  ) : (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Demo Mode</span>
  )
}
