import type { Config } from '@netlify/functions'
import { generate, json } from '../lib/gemini.mts'
import { buildContext, fallbackChat, sanitizeText, validateInput } from '../../shared/finance'

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const question = sanitizeText(body?.question, 500)
  if (!question) return json({ error: 'Please enter a question.' }, 422)
  const { data, errors } = validateInput(body?.context)
  if (!data) return json({ error: 'Financial context is missing or invalid.', details: errors }, 422)

  const history = Array.isArray(body?.history)
    ? body.history
        .slice(-6)
        .map((m: any) => `${m?.role === 'assistant' ? 'FinWise AI' : 'User'}: ${sanitizeText(m?.content, 600)}`)
        .join('\n')
    : ''

  const prompt = `You are FinWise AI, a friendly personal finance assistant for educational budgeting.
Answer the user's question using their finances below. Be specific with their numbers, concise (under 140 words),
use short paragraphs or a brief bulleted list, and label any projections as estimates. Never guarantee outcomes and
do not recommend specific investment products. Use **bold** sparingly for key figures.

User finances:
${buildContext(data)}

${history ? `Recent conversation:\n${history}\n` : ''}User question: ${question}`

  try {
    const answer = await generate(prompt, false)
    return json({ answer: answer.trim().slice(0, 3000), mode: 'ai' })
  } catch (err) {
    console.error('chat: falling back to demo mode:', err instanceof Error ? err.message : err)
    return json({ answer: fallbackChat(data, question), mode: 'demo' })
  }
}

export const config: Config = { path: '/api/chat' }
