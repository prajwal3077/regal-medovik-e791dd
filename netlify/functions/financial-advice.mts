import type { Config } from '@netlify/functions'
import { generate, json } from '../lib/gemini.mts'
import {
  buildContext,
  fallbackAdvice,
  sanitizeText,
  validateInput,
  type AdviceResponse,
  type FinancialInput,
  type Priority,
} from '../../shared/finance'

const PROMPT = (context: string) => `You are FinWise AI, a friendly, careful personal finance assistant for educational budgeting.
Analyse the user's monthly finances below and respond ONLY with JSON matching this exact shape:
{
  "budget_plan": {
    "headline": string (one sentence recommending a needs/wants/savings split),
    "recommended_savings": number (monthly amount, must not exceed the available balance),
    "needs_target_pct": number, "wants_target_pct": number, "savings_target_pct": number (sum to 100),
    "notes": string[] (2-3 short observations about the budget)
  },
  "saving_suggestions": [ 3 to 5 items of {
    "title": string (max 6 words),
    "explanation": string (1-2 sentences referencing the user's actual numbers),
    "estimated_monthly_impact": number (conservative realistic estimate in the user's currency),
    "priority": "high" | "medium" | "low"
  } ],
  "monthly_summary": {
    "overview": string (overall financial health, 1-2 sentences),
    "biggest_category": string, "savings_progress": string,
    "positive": string, "improve": string, "next_focus": string
  },
  "insights": string[] (2-3 short tips suited to their risk preference)
}
Rules: use plain language; never promise or guarantee outcomes; describe savings as estimates; do not recommend specific stocks, funds or products; keep each string under 45 words; use the user's currency.

User finances:
${context}`

const PRIORITIES: Priority[] = ['high', 'medium', 'low']

/** Merge the model output over the deterministic fallback so the UI always gets a complete, safe shape. */
function normalise(raw: any, input: FinancialInput): AdviceResponse {
  const base = fallbackAdvice(input)
  const str = (v: unknown, d: string, max = 400) => (typeof v === 'string' && v.trim() ? sanitizeText(v, max) : d)
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d)
  const bp = raw?.budget_plan ?? {}
  const ms = raw?.monthly_summary ?? {}
  const suggestions = Array.isArray(raw?.saving_suggestions)
    ? raw.saving_suggestions
        .filter((s: any) => s && typeof s.title === 'string')
        .slice(0, 5)
        .map((s: any) => ({
          title: sanitizeText(s.title, 80),
          explanation: sanitizeText(s.explanation, 400),
          estimated_monthly_impact: Math.round(n(s.estimated_monthly_impact, 0)),
          priority: PRIORITIES.includes(s.priority) ? s.priority : 'medium',
        }))
    : []
  const strings = (v: unknown, d: string[]) =>
    Array.isArray(v) && v.length ? v.filter((x) => typeof x === 'string').slice(0, 4).map((x) => sanitizeText(x, 300)) : d

  return {
    mode: 'ai',
    budget_plan: {
      headline: str(bp.headline, base.budget_plan.headline),
      recommended_savings: Math.min(n(bp.recommended_savings, base.budget_plan.recommended_savings), Math.max(0, base.budget_plan.recommended_savings * 1.5)),
      needs_target_pct: n(bp.needs_target_pct, 50),
      wants_target_pct: n(bp.wants_target_pct, 30),
      savings_target_pct: n(bp.savings_target_pct, 20),
      notes: strings(bp.notes, base.budget_plan.notes),
    },
    saving_suggestions: suggestions.length >= 3 ? suggestions : base.saving_suggestions,
    monthly_summary: {
      overview: str(ms.overview, base.monthly_summary.overview),
      biggest_category: str(ms.biggest_category, base.monthly_summary.biggest_category),
      savings_progress: str(ms.savings_progress, base.monthly_summary.savings_progress),
      positive: str(ms.positive, base.monthly_summary.positive),
      improve: str(ms.improve, base.monthly_summary.improve),
      next_focus: str(ms.next_focus, base.monthly_summary.next_focus),
    },
    insights: strings(raw?.insights, base.insights),
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const { data, errors } = validateInput(body)
  if (!data) return json({ error: 'Please check your inputs.', details: errors }, 422)

  try {
    const text = await generate(PROMPT(buildContext(data)), true)
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''))
    return json(normalise(parsed, data))
  } catch (err) {
    console.error('financial-advice: falling back to demo mode:', err instanceof Error ? err.message : err)
    return json({ ...fallbackAdvice(data), notice: 'AI service unavailable — showing Demo Mode insights.' })
  }
}

export const config: Config = { path: '/api/financial-advice' }
