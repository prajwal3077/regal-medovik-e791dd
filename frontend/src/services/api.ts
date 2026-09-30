import {
  fallbackAdvice,
  fallbackChat,
  type AdviceResponse,
  type ChatMessage,
  type FinancialInput,
} from '@shared/finance'

// All AI calls go through our own backend (Flask locally, Netlify Functions in production).
// The Gemini API key lives only on the server.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  details: string[]
  constructor(message: string, details: string[] = []) {
    super(message)
    this.details = details
  }
}

export type AdviceResult = AdviceResponse & { notice?: string }

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  if (!isJson) throw new TypeError('Backend unreachable')
  const data = await res.json()
  if (res.status === 422 || res.status === 400) throw new ApiError(data.error ?? 'Please check your inputs.', data.details)
  if (!res.ok) throw new TypeError(data.error ?? `Request failed (${res.status})`)
  return data as T
}

export async function getFinancialAdvice(input: FinancialInput): Promise<AdviceResult> {
  try {
    return await post<AdviceResult>('/api/financial-advice', input)
  } catch (err) {
    if (err instanceof ApiError) throw err
    // Backend not running or network issue: keep the demo working with local estimates.
    console.warn('FinWise API unavailable, using local Demo Mode:', err)
    return { ...fallbackAdvice(input), notice: 'Backend unreachable — showing Demo Mode insights.' }
  }
}

export async function askFinWise(
  input: FinancialInput,
  question: string,
  history: ChatMessage[],
): Promise<{ answer: string; mode: 'ai' | 'demo' }> {
  try {
    return await post('/api/chat', { question, context: input, history: history.slice(-6) })
  } catch (err) {
    if (err instanceof ApiError) throw err
    return { answer: fallbackChat(input, question), mode: 'demo' }
  }
}

export async function getHealth(): Promise<{ ai_configured: boolean; model: string; backend: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.headers.get('content-type')?.includes('application/json')) return null
    return await res.json()
  } catch {
    return null
  }
}
