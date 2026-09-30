export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#4f46e5" />
        <path d="M9 21l5-5 3 3 6-7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="23" cy="12" r="1.8" fill="#a5b4fc" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-ink">
        FinWise<span className="text-brand-600"> AI</span>
      </span>
    </div>
  )
}
