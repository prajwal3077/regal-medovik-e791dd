import { ArrowRight, BarChart3, Lightbulb, Lock, PiggyBank, PlayCircle, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react'
import Logo from '../components/Logo'
import Disclaimer from '../components/Disclaimer'

interface Props {
  onStart: () => void
  onDemo: () => void
}

const FEATURES = [
  {
    icon: Wallet,
    title: 'AI Budget Planning',
    text: 'See exactly how your income splits across needs, wants and savings — with a plan tailored to your numbers.',
  },
  {
    icon: Lightbulb,
    title: 'Smart Saving Suggestions',
    text: 'Get 3–5 personalised, prioritised ideas with an estimated monthly impact for each one.',
  },
  {
    icon: BarChart3,
    title: 'Monthly Financial Insights',
    text: 'A plain-language summary of your financial health, biggest costs and what to focus on next month.',
  },
]

const STEPS = [
  { n: '01', title: 'Share your numbers', text: 'Income, monthly expenses and the goal you are saving for.' },
  { n: '02', title: 'AI analyses your month', text: 'Gemini reviews your spending patterns and builds a plan.' },
  { n: '03', title: 'Act with confidence', text: 'Explore your dashboard, test what-if scenarios and ask questions.' },
]

export default function Landing({ onStart, onDemo }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={onDemo} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:text-ink sm:block">
              Try Demo
            </button>
            <button onClick={onStart} className="btn-primary px-4 py-2">
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
              backgroundSize: '28px 28px',
              maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <Sparkles className="h-3.5 w-3.5" /> Powered by Google Gemini
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
                Your AI-Powered <span className="text-brand-600">Personal Finance</span> Advisor
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                Understand your spending, build a smarter budget, and reach your financial goals.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={onStart} className="btn-primary px-6 py-3.5 text-[15px]">
                  Create My Financial Plan <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={onDemo} className="btn-secondary px-6 py-3.5 text-[15px]">
                  <PlayCircle className="h-4 w-4 text-brand-600" /> Try Demo
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4" /> No sign-up, nothing stored
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> Plan in under a minute
                </span>
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-100 bg-slate-50/70 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow text-brand-600">What you get</p>
            <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight">A clear financial picture, and a plan to improve it</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-10 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="border-t-2 border-brand-600 pt-5">
                  <span className="text-sm font-bold text-brand-600">{s.n}</span>
                  <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-white sm:flex-row">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">See it in action in 10 seconds</h2>
                <p className="mt-1.5 text-slate-300">Load a realistic sample profile and explore the full dashboard.</p>
              </div>
              <button onClick={onDemo} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-50">
                <PlayCircle className="h-4 w-4 text-brand-600" /> Try Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto max-w-6xl space-y-6 px-5">
          <Disclaimer />
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <Logo />
            <p>© {new Date().getFullYear()} FinWise AI · For educational and personal planning use.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function HeroPreview() {
  const bars = [
    { label: 'Needs', pct: 56, color: 'bg-brand-600' },
    { label: 'Wants', pct: 16, color: 'bg-amber-400' },
    { label: 'Savings', pct: 22, color: 'bg-emerald-500' },
  ]
  return (
    <div className="relative animate-fade-up [animation-delay:120ms]" aria-hidden>
      <div className="card relative p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Available balance</p>
            <p className="tabular mt-1 text-3xl font-bold tracking-tight">₹15,000</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" /> 22% savings rate
          </span>
        </div>
        <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100">
          {bars.map((b) => (
            <div key={b.label} className={b.color} style={{ width: `${b.pct}%` }} />
          ))}
        </div>
        <div className="mt-3 flex gap-5 text-xs text-slate-500">
          {bars.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${b.color}`} /> {b.label} {b.pct}%
            </span>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="text-xs text-slate-500">Monthly income</p>
            <p className="tabular mt-0.5 font-bold">₹55,000</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="text-xs text-slate-500">Total expenses</p>
            <p className="tabular mt-0.5 font-bold">₹40,000</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-slate-100 p-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <PiggyBank className="h-4 w-4 text-emerald-600" /> Emergency fund
            </span>
            <span className="tabular text-slate-500">27%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 w-[27%] rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="card absolute -bottom-8 -left-4 hidden w-72 p-4 sm:block lg:-left-10">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Set a monthly food budget</p>
            <p className="mt-0.5 text-xs text-slate-500">Est. impact ~₹1,400/month</p>
          </div>
        </div>
      </div>
    </div>
  )
}
