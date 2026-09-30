# AGENTS.md — FinWise AI

## What this is
An AI personal finance advisor MVP: landing page → 4-section input form → dashboard (Dashboard / Budget / Savings / AI Advisor / Settings tabs). Gemini generates the budget plan text, saving suggestions, monthly summary, insights and chat answers. Everything must keep working without an AI key ("Demo Mode").

## Architecture
- `frontend/` — Vite + React 18 + TS + Tailwind v4 (`@tailwindcss/vite`, theme tokens in `src/index.css`) + Recharts 2 + lucide-react. Single-route SPA; screen/tab state lives in `App.tsx` (no router). No persistence by design — financial data stays in React state.
- `shared/finance.ts` — the single source of truth for types, metric calculations (`computeMetrics`), validation/sanitisation (`validateInput`), Gemini context (`buildContext`) and rule-based fallback advice (`fallbackAdvice`, `fallbackChat`). Imported by the frontend via the `@shared` alias and by Netlify Functions via relative path.
- `backend/` — Flask API for local use (the user explicitly asked for Flask). `finance.py` is a Python port of `shared/finance.ts`; **keep both in sync** when changing calculations, prompts or fallback text. `gemini_service.py` holds prompts and normalisation.
- `netlify/functions/` — serverless mirror of the Flask endpoints (`/api/financial-advice`, `/api/chat`, `/api/health`) for the deployed site. Uses `@google/genai` with a zero-config constructor (Netlify AI Gateway injects `GEMINI_API_KEY`/base URL). Shared helper in `netlify/lib/gemini.mts`. Prompts are duplicated from `backend/gemini_service.py`.

## Key decisions
- Numbers (totals, percentages, months-to-goal) are always computed in code, never trusted from the model. AI output is merged over the deterministic fallback (`normalise`) so the UI always gets a complete shape; recommended savings is clamped to the available balance in the dashboard.
- Fallback layers: no key / Gemini error → backend returns `mode: "demo"`; backend unreachable → `frontend/src/services/api.ts` computes the fallback locally.
- Model: `gemini-2.5-flash` with `thinkingBudget: 0` and a 20s timeout for fast responses. Check the netlify-ai-gateway skill's model list before changing it.
- Build: root `npm run build` installs and builds `frontend/`, publishing `frontend/dist`. Root `package.json` only holds function dependencies.

## Conventions
- Tailwind utility classes plus a few component classes (`card`, `input`, `label`, `btn-primary`, `btn-secondary`, `eyebrow`) in `index.css`. Brand colour = indigo (`brand-*`). Needs = indigo, wants = amber, savings = emerald (see `src/charts/theme.ts`).
- Always label projections/impacts as estimates and keep the disclaimer (`components/Disclaimer.tsx`) visible.
- Never expose API keys to the frontend; never persist financial data.
