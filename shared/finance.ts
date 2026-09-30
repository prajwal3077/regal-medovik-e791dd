// Shared finance engine used by the React frontend and the Netlify Function.
// The Python backend (backend/finance.py) mirrors this logic for local Flask use.

export type ExpenseType = 'need' | 'want'
export type RiskPreference = 'conservative' | 'balanced' | 'aggressive'
export type Priority = 'high' | 'medium' | 'low'

export interface ExpenseItem {
  id: string
  name: string
  amount: number
  type: ExpenseType
}

export interface FinancialInput {
  income: number
  otherIncome: number
  currency: string
  expenses: ExpenseItem[]
  financialGoal: string
  targetAmount: number
  targetDate: string
  currentSavings: number
  riskPreference: RiskPreference
  notes: string
}

export interface SavingSuggestion {
  title: string
  explanation: string
  estimated_monthly_impact: number
  priority: Priority
}

export interface MonthlySummary {
  overview: string
  biggest_category: string
  savings_progress: string
  positive: string
  improve: string
  next_focus: string
}

export interface BudgetPlanAdvice {
  headline: string
  recommended_savings: number
  needs_target_pct: number
  wants_target_pct: number
  savings_target_pct: number
  notes: string[]
}

export interface AdviceResponse {
  mode: 'ai' | 'demo'
  budget_plan: BudgetPlanAdvice
  saving_suggestions: SavingSuggestion[]
  monthly_summary: MonthlySummary
  insights: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED', locale: 'en-AE' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG' },
]

export function formatMoney(value: number, currency = 'INR', compact = false): string {
  const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? 'en-US'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: compact && Math.abs(value) >= 1000 ? 1 : 0,
      notation: compact ? 'compact' : 'standard',
    }).format(Math.round(value))
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`
  }
}

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

const round100 = (v: number) => Math.round(v / 100) * 100

export interface Metrics {
  totalIncome: number
  totalExpenses: number
  needsTotal: number
  wantsTotal: number
  available: number
  recommendedSavings: number
  savingsRate: number
  needsPct: number
  wantsPct: number
  savingsPct: number
  expenseRatio: number
  biggest: ExpenseItem | null
  remainingToGoal: number
  goalProgress: number
  monthsToGoal: number | null
  monthsUntilTarget: number | null
  requiredMonthly: number | null
}

export function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + (to.getDate() >= from.getDate() ? 0 : -1)
}

export function monthsToReach(remaining: number, monthly: number): number | null {
  if (remaining <= 0) return 0
  if (monthly <= 0) return null
  return Math.ceil(remaining / monthly)
}

export function computeMetrics(input: FinancialInput, savingsOverride?: number): Metrics {
  const totalIncome = num(input.income) + num(input.otherIncome)
  const expenses = input.expenses.filter((e) => num(e.amount) > 0)
  const needsTotal = expenses.filter((e) => e.type === 'need').reduce((s, e) => s + num(e.amount), 0)
  const wantsTotal = expenses.filter((e) => e.type === 'want').reduce((s, e) => s + num(e.amount), 0)
  const totalExpenses = needsTotal + wantsTotal
  const available = totalIncome - totalExpenses

  // Recommend saving the larger of 20% of income or 80% of the surplus, never more than the surplus.
  const recommendedSavings =
    savingsOverride !== undefined
      ? Math.max(0, savingsOverride)
      : available > 0
        ? Math.min(available, round100(Math.max(totalIncome * 0.2, available * 0.8)))
        : 0

  const pct = (v: number) => (totalIncome > 0 ? (v / totalIncome) * 100 : 0)
  const biggest = expenses.reduce<ExpenseItem | null>((b, e) => (!b || num(e.amount) > num(b.amount) ? e : b), null)

  const remainingToGoal = Math.max(0, num(input.targetAmount) - num(input.currentSavings))
  const goalProgress = num(input.targetAmount) > 0 ? Math.min(100, (num(input.currentSavings) / num(input.targetAmount)) * 100) : 0

  let monthsUntilTarget: number | null = null
  let requiredMonthly: number | null = null
  if (input.targetDate) {
    const d = new Date(input.targetDate)
    if (!isNaN(d.getTime())) {
      monthsUntilTarget = Math.max(0, monthsBetween(new Date(), d))
      requiredMonthly = monthsUntilTarget > 0 ? Math.ceil(remainingToGoal / monthsUntilTarget) : remainingToGoal
    }
  }

  return {
    totalIncome,
    totalExpenses,
    needsTotal,
    wantsTotal,
    available,
    recommendedSavings,
    savingsRate: pct(recommendedSavings),
    needsPct: pct(needsTotal),
    wantsPct: pct(wantsTotal),
    savingsPct: pct(recommendedSavings),
    expenseRatio: pct(totalExpenses),
    biggest,
    remainingToGoal,
    goalProgress,
    monthsToGoal: monthsToReach(remainingToGoal, recommendedSavings),
    monthsUntilTarget,
    requiredMonthly,
  }
}

export function sanitizeText(value: unknown, max = 200): string {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max)
}

const MAX_AMOUNT = 1_000_000_000

/** Validates and normalises an untrusted payload. Returns errors instead of throwing. */
export function validateInput(raw: any): { data?: FinancialInput; errors: string[] } {
  const errors: string[] = []
  if (!raw || typeof raw !== 'object') return { errors: ['Request body must be a JSON object.'] }

  const amount = (v: unknown, label: string, required = false) => {
    const n = num(v)
    if (required && n <= 0) errors.push(`${label} must be greater than zero.`)
    if (n < 0) errors.push(`${label} cannot be negative.`)
    if (n > MAX_AMOUNT) errors.push(`${label} is unrealistically large.`)
    return Math.max(0, Math.min(n, MAX_AMOUNT))
  }

  const rawExpenses: any[] = Array.isArray(raw.expenses)
    ? raw.expenses
    : raw.expenses && typeof raw.expenses === 'object'
      ? Object.entries(raw.expenses).map(([name, amount]) => ({ name, amount }))
      : []
  if (rawExpenses.length > 40) errors.push('Too many expense items (max 40).')

  const expenses: ExpenseItem[] = rawExpenses.slice(0, 40).map((e, i) => ({
    id: sanitizeText(e?.id ?? `e${i}`, 40),
    name: sanitizeText(e?.name, 60) || `Expense ${i + 1}`,
    amount: amount(e?.amount, sanitizeText(e?.name, 60) || 'Expense'),
    type: e?.type === 'need' ? 'need' : 'want',
  }))

  const risk = ['conservative', 'balanced', 'aggressive'].includes(raw.riskPreference) ? raw.riskPreference : 'balanced'
  const currency = CURRENCIES.some((c) => c.code === raw.currency) ? raw.currency : 'INR'

  const data: FinancialInput = {
    income: amount(raw.income, 'Monthly income', true),
    otherIncome: amount(raw.otherIncome, 'Other income'),
    currency,
    expenses,
    financialGoal: sanitizeText(raw.financialGoal, 120) || 'General savings',
    targetAmount: amount(raw.targetAmount, 'Target amount'),
    targetDate: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.targetDate ?? '')) ? raw.targetDate : '',
    currentSavings: amount(raw.currentSavings, 'Current savings'),
    riskPreference: risk,
    notes: sanitizeText(raw.notes, 500),
  }
  return errors.length ? { errors } : { data, errors }
}

/** Compact, human-readable context handed to Gemini. */
export function buildContext(input: FinancialInput): string {
  const m = computeMetrics(input)
  const f = (v: number) => formatMoney(v, input.currency)
  const lines = [
    `Currency: ${input.currency}`,
    `Monthly income: ${f(input.income)}; other income: ${f(input.otherIncome)}; total: ${f(m.totalIncome)}`,
    `Expenses (total ${f(m.totalExpenses)}, ${m.expenseRatio.toFixed(0)}% of income):`,
    ...input.expenses.filter((e) => e.amount > 0).map((e) => `  - ${e.name} (${e.type}): ${f(e.amount)}`),
    `Needs: ${f(m.needsTotal)} (${m.needsPct.toFixed(0)}%), Wants: ${f(m.wantsTotal)} (${m.wantsPct.toFixed(0)}%)`,
    `Available balance after expenses: ${f(m.available)}`,
    `Calculated recommended monthly savings: ${f(m.recommendedSavings)} (${m.savingsRate.toFixed(0)}% of income)`,
    `Goal: ${input.financialGoal}; target ${f(input.targetAmount)}; current savings ${f(input.currentSavings)}; remaining ${f(m.remainingToGoal)}`,
    input.targetDate ? `Target date: ${input.targetDate} (${m.monthsUntilTarget} months away; needs ~${f(m.requiredMonthly ?? 0)}/month)` : 'No target date.',
    m.monthsToGoal !== null ? `At recommended savings, goal reached in ~${m.monthsToGoal} months.` : 'Goal not reachable at current surplus.',
    `Risk preference: ${input.riskPreference}`,
    input.notes ? `User notes: ${input.notes}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

// ---------------------------------------------------------------------------
// Demo-mode fallback: realistic, rule-based advice used when Gemini is not
// configured or fails. Every number here is an estimate derived from inputs.
// ---------------------------------------------------------------------------

const lc = (s: string) => s.toLowerCase()
const find = (input: FinancialInput, ...keys: string[]) =>
  input.expenses.find((e) => keys.some((k) => lc(e.name).includes(k)) && e.amount > 0)

export function fallbackAdvice(input: FinancialInput): AdviceResponse {
  const m = computeMetrics(input)
  const f = (v: number) => formatMoney(v, input.currency)
  const suggestions: SavingSuggestion[] = []

  const food = find(input, 'food', 'grocer', 'dining')
  if (food && food.amount / m.totalIncome > 0.1) {
    suggestions.push({
      title: 'Set a monthly food budget',
      explanation: `Food is ${f(food.amount)} a month (${((food.amount / m.totalIncome) * 100).toFixed(0)}% of income). Planning weekly meals and limiting food delivery to once or twice a week could bring this down.`,
      estimated_monthly_impact: round100(food.amount * 0.2),
      priority: 'high',
    })
  }
  const shopping = find(input, 'shop', 'cloth')
  if (shopping) {
    suggestions.push({
      title: 'Try a 48-hour rule for shopping',
      explanation: `Shopping takes ${f(shopping.amount)} a month. Waiting 48 hours before non-essential purchases cuts down on impulse spending.`,
      estimated_monthly_impact: round100(shopping.amount * 0.3),
      priority: m.wantsPct > 20 ? 'high' : 'medium',
    })
  }
  const ent = find(input, 'entertain', 'subscri', 'stream', 'movie')
  if (ent) {
    suggestions.push({
      title: 'Audit subscriptions and outings',
      explanation: `Entertainment is ${f(ent.amount)} a month. Cancelling subscriptions you rarely use and switching some outings to free options usually trims this without much sacrifice.`,
      estimated_monthly_impact: round100(ent.amount * 0.25),
      priority: 'medium',
    })
  }
  const transport = find(input, 'transport', 'fuel', 'commute', 'travel')
  if (transport && transport.amount / m.totalIncome > 0.06) {
    suggestions.push({
      title: 'Optimise your commute',
      explanation: `Transportation costs ${f(transport.amount)}. Carpooling, a monthly transit pass, or combining errands could lower fuel and ride-hailing costs.`,
      estimated_monthly_impact: round100(transport.amount * 0.15),
      priority: 'low',
    })
  }
  const utilities = find(input, 'utilit', 'electric', 'internet', 'phone')
  if (utilities && suggestions.length < 5) {
    suggestions.push({
      title: 'Review utility and mobile plans',
      explanation: `Utilities come to ${f(utilities.amount)}. Comparing internet and mobile plans once a year and cutting standby power use often saves a little every month.`,
      estimated_monthly_impact: round100(utilities.amount * 0.1),
      priority: 'low',
    })
  }
  suggestions.unshift({
    title: 'Automate savings on payday',
    explanation: `Set up an automatic transfer of ${f(m.recommendedSavings)} to a separate savings account on the day your salary arrives, so you save before you spend.`,
    estimated_monthly_impact: m.recommendedSavings,
    priority: 'high',
  })

  const needsOk = m.needsPct <= 55
  const wantsOk = m.wantsPct <= 30
  const health =
    m.available <= 0
      ? 'Your expenses are currently higher than your income, so the first step is to close that gap.'
      : m.savingsRate >= 20
        ? 'Your finances are in good shape: you can comfortably save a healthy share of your income.'
        : 'Your finances are stable, with some room to build a stronger savings habit.'

  const monthsText =
    m.monthsToGoal === null
      ? 'At your current surplus the goal is not reachable yet — reducing expenses is the priority.'
      : m.monthsToGoal === 0
        ? 'You have already reached your target — congratulations!'
        : `At ${f(m.recommendedSavings)}/month you could reach it in about ${m.monthsToGoal} months (estimate).`

  return {
    mode: 'demo',
    budget_plan: {
      headline: `Your plan: ${Math.round(m.needsPct)}% needs, ${Math.round(m.wantsPct)}% wants and ${Math.round(m.savingsRate)}% savings, with ${Math.round(Math.max(0, 100 - m.needsPct - m.wantsPct - m.savingsRate))}% kept as a buffer.`,
      recommended_savings: m.recommendedSavings,
      needs_target_pct: 50,
      wants_target_pct: 30,
      savings_target_pct: 20,
      notes: [
        needsOk
          ? `Your needs are ${m.needsPct.toFixed(0)}% of income — within the common 50–55% guideline.`
          : `Your needs are ${m.needsPct.toFixed(0)}% of income — above the usual 50% guideline, so fixed costs deserve a review.`,
        wantsOk
          ? `Discretionary spending is ${m.wantsPct.toFixed(0)}% of income, which is reasonable.`
          : `Discretionary spending is ${m.wantsPct.toFixed(0)}% of income — trimming it is the fastest way to save more.`,
        m.available > 0
          ? `After saving ${f(m.recommendedSavings)}, you keep a buffer of ${f(m.available - m.recommendedSavings)} for irregular costs.`
          : 'Consider pausing non-essential spending until income covers all expenses.',
      ],
    },
    saving_suggestions: suggestions.slice(0, 5),
    monthly_summary: {
      overview: `${health} You spend ${f(m.totalExpenses)} of your ${f(m.totalIncome)} monthly income (${m.expenseRatio.toFixed(0)}%), leaving ${f(m.available)}.`,
      biggest_category: m.biggest
        ? `${m.biggest.name} is your biggest expense at ${f(m.biggest.amount)} (${((m.biggest.amount / m.totalIncome) * 100).toFixed(0)}% of income).`
        : 'No expenses were entered.',
      savings_progress: `You have saved ${f(input.currentSavings)} of ${f(input.targetAmount)} for "${input.financialGoal}" (${m.goalProgress.toFixed(0)}%). ${monthsText}`,
      positive:
        m.available > 0
          ? `You run a monthly surplus of ${f(m.available)}, which gives you real flexibility to reach your goal.`
          : 'You have a clear picture of your spending now — the essential first step.',
      improve: wantsOk
        ? `Keep an eye on ${m.biggest?.name ?? 'your largest category'}; small cuts there have the biggest effect.`
        : `Wants make up ${m.wantsPct.toFixed(0)}% of income. Bringing shopping and entertainment down would speed up your goal.`,
      next_focus: `Automate ${f(m.recommendedSavings)} in savings and track ${food ? 'food' : 'discretionary'} spending weekly next month.`,
    },
    insights: [
      `Your savings rate at the recommended level would be ${m.savingsRate.toFixed(0)}% of income.`,
      m.requiredMonthly !== null && m.monthsUntilTarget
        ? `To hit your goal by the target date you need about ${f(m.requiredMonthly)}/month (estimate).`
        : `Adding a target date helps you see the monthly amount needed.`,
      input.riskPreference === 'conservative'
        ? 'With a conservative profile, keep your emergency fund in a high-interest savings account or short-term deposits.'
        : input.riskPreference === 'aggressive'
          ? 'Even with an aggressive profile, keep 3–6 months of expenses in safe, liquid savings before investing.'
          : 'A balanced approach: keep your emergency fund liquid, and consider diversified options only after it is complete.',
    ],
  }
}

export function fallbackChat(input: FinancialInput, question: string): string {
  const m = computeMetrics(input)
  const f = (v: number) => formatMoney(v, input.currency)
  const q = lc(question)
  const byAmount = [...input.expenses].filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount)
  const wants = byAmount.filter((e) => e.type === 'want')

  if (/(how long|when|reach|goal|months)/.test(q)) {
    if (m.remainingToGoal <= 0) return `You've already reached your ${f(input.targetAmount)} target for "${input.financialGoal}". Nice work!`
    const faster = monthsToReach(m.remainingToGoal, m.recommendedSavings + 2000)
    return m.monthsToGoal === null
      ? `Right now your expenses use up your whole income, so there's no surplus to put towards "${input.financialGoal}". Freeing up even ${f(3000)} a month would put the goal within reach in about ${monthsToReach(m.remainingToGoal, 3000)} months (estimate).`
      : `You need ${f(m.remainingToGoal)} more for "${input.financialGoal}". Saving ${f(m.recommendedSavings)} a month, you'd get there in about **${m.monthsToGoal} months** (estimate).${faster !== null && m.monthsToGoal !== null && faster < m.monthsToGoal ? ` Adding ${f(2000)} more per month would cut that to roughly ${faster} months.` : ''}`
  }
  if (/(too much|overspend|spending|where)/.test(q)) {
    const top = byAmount.slice(0, 3).map((e) => `${e.name} (${f(e.amount)}, ${((e.amount / m.totalIncome) * 100).toFixed(0)}%)`)
    return `Your top expenses are ${top.join(', ')}. Among flexible categories, ${wants[0] ? `**${wants[0].name}** at ${f(wants[0].amount)}` : 'nothing stands out'} is the easiest to trim. Overall, wants take ${m.wantsPct.toFixed(0)}% of income — a common guideline is around 30%.`
  }
  if (/(afford|enough|sustainable|manage)/.test(q)) {
    return m.available > 0
      ? `Yes — your expenses (${f(m.totalExpenses)}) are ${m.expenseRatio.toFixed(0)}% of your income (${f(m.totalIncome)}), leaving ${f(m.available)} a month. That's a comfortable margin, as long as you also keep an emergency buffer for irregular costs.`
      : `Not quite — your expenses exceed your income by ${f(-m.available)} a month. Start with the largest flexible categories: ${wants.slice(0, 2).map((e) => e.name).join(' and ') || 'discretionary items'}.`
  }
  if (/(save|saving|more)/.test(q)) {
    const amt = q.match(/(\d[\d,]*)/)?.[1]?.replace(/,/g, '')
    const target = amt ? parseInt(amt, 10) : 5000
    const ideas = wants.slice(0, 3).map((e) => `trim ${e.name} by ~${f(round100(e.amount * 0.3))}`)
    const possible = wants.slice(0, 3).reduce((s, e) => s + round100(e.amount * 0.3), 0)
    return `To save ${f(target)} more each month you could ${ideas.join(', ') || 'review your largest expenses'}${ideas.length ? ` — together about ${f(possible)}` : ''}. ${possible >= target ? 'That would cover it.' : `Combined with automating part of your ${f(m.available)} surplus, you can close the rest of the gap.`} These are estimates, not guarantees.`
  }
  return `Here's a quick snapshot: income ${f(m.totalIncome)}, expenses ${f(m.totalExpenses)}, surplus ${f(m.available)}. I'd suggest saving about ${f(m.recommendedSavings)} a month towards "${input.financialGoal}". Try asking where you're overspending, or how long your goal will take.`
}
