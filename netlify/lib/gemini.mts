import { GoogleGenAI } from '@google/genai'

export const GEMINI_MODEL = 'gemini-2.5-flash'
const TIMEOUT_MS = 20_000

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

/** Calls Gemini and returns the raw text. Throws on missing key, timeout or API error. */
export async function generate(prompt: string, json: boolean): Promise<string> {
  if (!geminiConfigured()) throw new Error('GEMINI_API_KEY is not configured')
  // Zero-config: on Netlify the AI Gateway injects GEMINI_API_KEY and GOOGLE_GEMINI_BASE_URL.
  const ai = new GoogleGenAI({})
  const call = ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.4,
      maxOutputTokens: json ? 2048 : 700,
      thinkingConfig: { thinkingBudget: 0 },
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  })
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), TIMEOUT_MS))
  const res = await Promise.race([call, timeout])
  const text = res.text
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
