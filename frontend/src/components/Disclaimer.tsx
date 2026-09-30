import { ShieldAlert } from 'lucide-react'

export const DISCLAIMER =
  'FinWise AI provides estimates and educational financial insights. It does not provide professional financial, investment, tax, or legal advice, and its recommendations do not guarantee financial outcomes.'

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 text-amber-900 ${compact ? 'p-3 text-xs' : 'p-4 text-sm'}`}
      role="note"
    >
      <ShieldAlert className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} mt-0.5 shrink-0 text-amber-600`} />
      <p className="leading-relaxed">{DISCLAIMER}</p>
    </div>
  )
}
