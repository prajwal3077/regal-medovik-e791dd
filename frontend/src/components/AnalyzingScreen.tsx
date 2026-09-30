import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import Logo from './Logo'

const STEPS = ['Reading your income and expenses', 'Building your budget plan', 'Finding saving opportunities', 'Writing your monthly summary']

export default function AnalyzingScreen() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <Logo className="mb-12" />
      <div className="relative mb-8 grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-100 [animation-duration:2s]" />
        <span className="absolute inset-2 rounded-full bg-brand-50" />
        <Sparkles className="relative h-8 w-8 text-brand-600" />
      </div>
      <h1 className="text-center text-xl font-bold tracking-tight sm:text-2xl" aria-live="polite">
        FinWise AI is analyzing your finances...
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">This usually takes a few seconds.</p>

      <ul className="mt-10 w-full max-w-sm space-y-3">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 text-sm transition ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>
            <span
              className={`grid h-6 w-6 place-items-center rounded-full border transition ${
                i < step ? 'border-emerald-500 bg-emerald-500 text-white' : i === step ? 'border-brand-500' : 'border-slate-200'
              }`}
            >
              {i < step ? (
                <Check className="h-3.5 w-3.5" />
              ) : i === step ? (
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand-600" />
              ) : null}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
