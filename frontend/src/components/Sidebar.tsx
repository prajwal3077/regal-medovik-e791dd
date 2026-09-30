import { Bot, LayoutDashboard, PiggyBank, Settings, Wallet, type LucideIcon } from 'lucide-react'
import Logo from './Logo'
import type { Tab } from '../pages/Dashboard'

export const NAV: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'savings', label: 'Savings', icon: PiggyBank },
  { id: 'advisor', label: 'AI Advisor', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface Props {
  tab: Tab
  onTab: (t: Tab) => void
  mode: 'ai' | 'demo'
  goal: string
  progress: number
}

export default function Sidebar({ tab, onTab, mode, goal, progress }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white px-4 py-6 lg:flex">
        <Logo className="px-2" />
        <nav className="mt-10 space-y-1" aria-label="Main">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" /> {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-slate-200/80 p-4">
            <p className="eyebrow">Your goal</p>
            <p className="mt-1 truncate text-sm font-semibold">{goal}</p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="tabular mt-1.5 text-xs text-slate-500">{progress.toFixed(0)}% complete</p>
          </div>
          <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
            <span className={`h-2 w-2 rounded-full ${mode === 'ai' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {mode === 'ai' ? 'Gemini AI connected' : 'Running in Demo Mode'}
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Main">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${tab === id ? 'text-brand-600' : 'text-slate-500'}`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
