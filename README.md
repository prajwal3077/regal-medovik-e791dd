# FinWise AI – Personal Finance Advisor

FinWise AI is an AI-powered personal finance assistant. Enter your income, monthly expenses, savings and a financial goal, and it uses Google's Gemini API to generate:

1. **A personalised budget plan** (needs vs wants vs savings)
2. **AI saving suggestions** with estimated monthly impact and priority
3. **A monthly financial summary** in plain language

It also includes a **What If?** simulator, an **Ask FinWise AI** chat, and a one-click **Demo Mode**.

> FinWise AI provides estimates and educational financial insights. It does not provide professional financial, investment, tax, or legal advice, and its recommendations do not guarantee financial outcomes.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide icons |
| Backend (local) | Python Flask REST API + `google-genai` SDK |
| Backend (deployed) | Netlify Functions mirroring the Flask API, using Gemini via Netlify AI Gateway |
| AI | Google Gemini (`gemini-2.5-flash` by default) |

Architecture: **Frontend → API (`/api/*`) → Gemini**. The Gemini API key lives only in the backend environment and is never shipped to the browser.

## Project structure

```
frontend/            React + TypeScript app
  src/
    pages/           Landing, PlanForm (4-section input form), Dashboard
    components/      Sidebar, SummaryCards, BudgetPlan, SavingSuggestions, MonthlySummary,
                     WhatIf, AskAI, GoalProgress, SettingsPanel, Disclaimer, …
    charts/          Recharts visualisations (donut, income vs expenses, cash flow, projection)
    services/api.ts  Calls the backend (with local Demo Mode fallback)
    data/demo.ts     Demo profile and default categories
backend/
  app.py             Flask API (routes, validation, error handling)
  gemini_service.py  Gemini prompts, calls and response normalisation
  finance.py         Metrics, validation/sanitisation and Demo Mode fallback advice
  requirements.txt
  .env.example
shared/finance.ts    TypeScript finance engine shared by the frontend and Netlify Functions
netlify/functions/   Serverless mirror of the Flask API for the deployed site
```

## Running locally

### 1. Install dependencies

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend (in a second terminal)
cd frontend
npm install
```

### 2. Configure `GEMINI_API_KEY`

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set your key (get one at https://aistudio.google.com/app/apikey):

```
GEMINI_API_KEY=your_key_here
```

The key is read only by the Flask server. Do **not** put it in any frontend file or `VITE_*` variable. If you leave it empty, the app runs in Demo Mode.

### 3. Start Flask

```bash
cd backend
source .venv/bin/activate
python app.py                      # http://127.0.0.1:5000
```

Check it's up: `curl http://127.0.0.1:5000/api/health`

### 4. Start the frontend

```bash
cd frontend
npm run dev                        # http://localhost:5173
```

Vite proxies `/api/*` to Flask on port 5000 (override with `VITE_API_PROXY=http://host:port`).

### 5. Use Demo Mode

- On the landing page click **Try Demo** — a realistic sample profile (₹50,000 salary + ₹5,000 other income, ₹40,000 expenses, ₹40,000 saved towards a ₹1,50,000 emergency fund) is loaded and analysed straight away.
- On the form, **Fill demo data** populates every field so you can tweak values before generating.
- If `GEMINI_API_KEY` is not set, Gemini errors, or the backend isn't running at all, FinWise AI automatically falls back to realistic rule-based insights and shows a "Demo Mode" badge. The whole UI stays functional.

Suggested demo flow: **Landing → Try Demo → Dashboard → Budget → Savings (suggestions + What If?) → AI Advisor (chat)**.

## API

### `POST /api/financial-advice`

```json
{
  "income": 50000,
  "otherIncome": 5000,
  "currency": "INR",
  "expenses": [{ "name": "Food", "amount": 7000, "type": "need" }],
  "financialGoal": "Build an emergency fund",
  "targetAmount": 150000,
  "targetDate": "2027-09-30",
  "currentSavings": 40000,
  "riskPreference": "balanced",
  "notes": ""
}
```

`expenses` may also be an object map (`{ "Food": 7000 }`). Returns:

```json
{
  "mode": "ai | demo",
  "budget_plan": { "headline": "", "recommended_savings": 0, "needs_target_pct": 50, "wants_target_pct": 30, "savings_target_pct": 20, "notes": [] },
  "saving_suggestions": [{ "title": "", "explanation": "", "estimated_monthly_impact": 0, "priority": "high" }],
  "monthly_summary": { "overview": "", "biggest_category": "", "savings_progress": "", "positive": "", "improve": "", "next_focus": "" },
  "insights": []
}
```

Invalid input returns `422` with a `details` list. Gemini failures never surface as errors — the response falls back to Demo Mode.

### `POST /api/chat`

`{ "question": "Where am I spending too much?", "context": <same payload as above>, "history": [{ "role": "user", "content": "…" }] }` → `{ "answer": "…", "mode": "ai | demo" }`

### `GET /api/health`

`{ "status": "ok", "ai_configured": true, "model": "gemini-2.5-flash" }`

## Deploying on Netlify

The site deploys as a static React build plus Netlify Functions (`netlify/functions/`) that implement the same three endpoints. On Netlify, Gemini credentials are injected automatically by Netlify AI Gateway, so no key needs to be configured. You can run the full Netlify setup locally with `netlify dev`.

## Security & privacy

- API keys live only in server environment variables; `.env` is git-ignored.
- All inputs are validated and sanitised server-side (types, ranges, lengths, max 40 expenses, 64 KB request limit).
- Financial data is kept only in browser memory for the session; the backend processes requests in memory and stores nothing.
