"""Gemini integration for FinWise AI.

The API key is read from the GEMINI_API_KEY environment variable only — it is never
sent to the browser. If the key is missing or Gemini fails, callers fall back to
Demo Mode responses from finance.py.
"""
from __future__ import annotations

import json
import logging
import os
import re

from finance import build_context, fallback_advice, sanitize_text

log = logging.getLogger("finwise.gemini")

ADVICE_PROMPT = """You are FinWise AI, a friendly, careful personal finance assistant for educational budgeting.
Analyse the user's monthly finances below and respond ONLY with JSON matching this exact shape:
{{
  "budget_plan": {{
    "headline": string (one sentence recommending a needs/wants/savings split),
    "recommended_savings": number (monthly amount, must not exceed the available balance),
    "needs_target_pct": number, "wants_target_pct": number, "savings_target_pct": number (sum to 100),
    "notes": string[] (2-3 short observations about the budget)
  }},
  "saving_suggestions": [ 3 to 5 items of {{
    "title": string (max 6 words),
    "explanation": string (1-2 sentences referencing the user's actual numbers),
    "estimated_monthly_impact": number (conservative realistic estimate in the user's currency),
    "priority": "high" | "medium" | "low"
  }} ],
  "monthly_summary": {{
    "overview": string, "biggest_category": string, "savings_progress": string,
    "positive": string, "improve": string, "next_focus": string
  }},
  "insights": string[] (2-3 short tips suited to their risk preference)
}}
Rules: use plain language; never promise or guarantee outcomes; describe savings as estimates; do not recommend
specific stocks, funds or products; keep each string under 45 words; use the user's currency.

User finances:
{context}"""

CHAT_PROMPT = """You are FinWise AI, a friendly personal finance assistant for educational budgeting.
Answer the user's question using their finances below. Be specific with their numbers, concise (under 140 words),
use short paragraphs or a brief bulleted list, and label any projections as estimates. Never guarantee outcomes and
do not recommend specific investment products. Use **bold** sparingly for key figures.

User finances:
{context}

{history}User question: {question}"""


class GeminiUnavailable(Exception):
    pass


def is_configured() -> bool:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return bool(key) and key != "your_key_here"


def model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _generate(prompt: str, as_json: bool) -> str:
    if not is_configured():
        raise GeminiUnavailable("GEMINI_API_KEY is not configured")
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        config = types.GenerateContentConfig(
            temperature=0.4,
            max_output_tokens=2048 if as_json else 700,
            response_mime_type="application/json" if as_json else None,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        res = client.models.generate_content(model=model_name(), contents=prompt, config=config)
        if not res.text:
            raise GeminiUnavailable("Empty response from Gemini")
        return res.text
    except GeminiUnavailable:
        raise
    except Exception as exc:  # network, quota, auth, SDK errors
        raise GeminiUnavailable(str(exc)) from exc


def _strings(v, default):
    if isinstance(v, list) and v:
        return [sanitize_text(x, 300) for x in v if isinstance(x, str)][:4] or default
    return default


def _normalise(raw: dict, data: dict) -> dict:
    """Merge the model output over the deterministic fallback so the shape is always complete."""
    base = fallback_advice(data)
    s = lambda v, d: sanitize_text(v, 400) if isinstance(v, str) and v.strip() else d  # noqa: E731
    n = lambda v, d: v if isinstance(v, (int, float)) and v >= 0 else d  # noqa: E731
    bp, ms = raw.get("budget_plan") or {}, raw.get("monthly_summary") or {}
    if isinstance(ms, str):  # tolerate a plain-text summary
        ms = {"overview": ms}

    suggestions = []
    for item in (raw.get("saving_suggestions") or [])[:5]:
        if isinstance(item, dict) and isinstance(item.get("title"), str):
            suggestions.append({
                "title": sanitize_text(item["title"], 80),
                "explanation": sanitize_text(item.get("explanation"), 400),
                "estimated_monthly_impact": round(n(item.get("estimated_monthly_impact"), 0)),
                "priority": item.get("priority") if item.get("priority") in ("high", "medium", "low") else "medium",
            })

    bb, bs = base["budget_plan"], base["monthly_summary"]
    return {
        "mode": "ai",
        "budget_plan": {
            "headline": s(bp.get("headline"), bb["headline"]),
            "recommended_savings": min(n(bp.get("recommended_savings"), bb["recommended_savings"]), max(0, bb["recommended_savings"] * 1.5)),
            "needs_target_pct": n(bp.get("needs_target_pct"), 50),
            "wants_target_pct": n(bp.get("wants_target_pct"), 30),
            "savings_target_pct": n(bp.get("savings_target_pct"), 20),
            "notes": _strings(bp.get("notes"), bb["notes"]),
        },
        "saving_suggestions": suggestions if len(suggestions) >= 3 else base["saving_suggestions"],
        "monthly_summary": {k: s(ms.get(k), bs[k]) for k in bs},
        "insights": _strings(raw.get("insights"), base["insights"]),
    }


def get_financial_advice(data: dict) -> dict:
    text = _generate(ADVICE_PROMPT.format(context=build_context(data)), as_json=True)
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    try:
        raw = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GeminiUnavailable(f"Gemini returned invalid JSON: {exc}") from exc
    return _normalise(raw if isinstance(raw, dict) else {}, data)


def answer_question(data: dict, question: str, history: list) -> str:
    lines = []
    for m in (history or [])[-6:]:
        if isinstance(m, dict):
            who = "FinWise AI" if m.get("role") == "assistant" else "User"
            lines.append(f"{who}: {sanitize_text(m.get('content'), 600)}")
    hist = f"Recent conversation:\n" + "\n".join(lines) + "\n\n" if lines else ""
    prompt = CHAT_PROMPT.format(context=build_context(data), history=hist, question=question)
    return _generate(prompt, as_json=False).strip()[:3000]
