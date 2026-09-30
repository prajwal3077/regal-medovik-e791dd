import type { Config } from '@netlify/functions'
import { GEMINI_MODEL, geminiConfigured, json } from '../lib/gemini.mts'

export default async () => json({ status: 'ok', ai_configured: geminiConfigured(), model: GEMINI_MODEL, backend: 'netlify' })

export const config: Config = { path: '/api/health' }
