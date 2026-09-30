"""Finance engine: validation, metrics and Demo Mode fallback advice.

Mirrors shared/finance.ts so the Flask API and the Netlify Function behave the same.
All figures are estimates derived from the user's inputs.
"""
from __future__ import annotations

import math
import re
from datetime import date

MAX_AMOUNT = 1_000_000_000
CURRENCIES = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "AED": "AED ", "SGD": "S$"}
RISKS = {"conservative", "balanced", "aggressive"}


def _num(v) -> float:
    try:
        n = float(v)
        return n if math.isfinite(n) else 0.0
    except (TypeError, ValueError):
        return 0.0


def round100(v: float) -> int:
    return int(round(v / 100.0) * 100)


def sanitize_text(value, max_len: int = 200) -> str:
    s = str(value if value is not None else "")
    s = re.sub(r"[<>]", "", s)
    s = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", " ", s)
    return s.strip()[:max_len]


def _group(n: int) -> str:
    """Indian digit grouping: 150000 -> 1,50,000."""
    s = str(abs(n))
    if len(s) <= 3:
        return s
    head, tail = s[:-3], s[-3:]
    head = re.sub(r"(\d)(?=(\d{2})+$)", r"\1,", head)
    return f"{head},{tail}"


def fmt(value: float, currency: str = "INR") -> str:
    n = int(round(value))
    sign = "-" if n < 0 else ""
    body = _group(n) if currency == "INR" else f"{abs(n):,}"
    return f"{sign}{CURRENCIES.get(currency, currency + ' ')}{body}"


def validate_input(raw) -> tuple[dict | None, list[str]]:
    errors: list[str] = []
    if not isinstance(raw, dict):
        return None, ["Request body must be a JSON object."]

    def amount(v, label, required=False):
        n = _num(v)
        if required and n <= 0:
            errors.append(f"{label} must be greater than zero.")
        if n < 0:
            errors.append(f"{label} cannot be negative.")
        if n > MAX_AMOUNT:
            errors.append(f"{label} is unrealistically large.")
        return max(0.0, min(n, MAX_AMOUNT))

    raw_exp = raw.get("expenses") or []
    if isinstance(raw_exp, dict):
        raw_exp = [{"name": k, "amount": v} for k, v in raw_exp.items()]
    if not isinstance(raw_exp, list):
        raw_exp = []
    if len(raw_exp) > 40:
        errors.append("Too many expense items (max 40).")

    expenses = []
    for i, e in enumerate(raw_exp[:40]):
        e = e if isinstance(e, dict) else {}
        name = sanitize_text(e.get("name"), 60) or f"Expense {i + 1}"
        expenses.append({
            "id": sanitize_text(e.get("id", f"e{i}"), 40),
            "name": name,
            "amount": amount(e.get("amount"), name),
            "type": "need" if e.get("type") == "need" else "want",
        })

    target_date = str(raw.get("targetDate") or "")
    data = {
        "income": amount(raw.get("income"), "Monthly income", required=True),
        "otherIncome": amount(raw.get("otherIncome"), "Other income"),
        "currency": raw.get("currency") if raw.get("currency") in CURRENCIES else "INR",
        "expenses": expenses,
        "financialGoal": sanitize_text(raw.get("financialGoal"), 120) or "General savings",
        "targetAmount": amount(raw.get("targetAmount"), "Target amount"),
        "targetDate": target_date if re.fullmatch(r"\d{4}-\d{2}-\d{2}", target_date) else "",
        "currentSavings": amount(raw.get("currentSavings"), "Current savings"),
        "riskPreference": raw.get("riskPreference") if raw.get("riskPreference") in RISKS else "balanced",
        "notes": sanitize_text(raw.get("notes"), 500),
    }
    return (None, errors) if errors else (data, [])


def months_to_reach(remaining: float, monthly: float):
    if remaining <= 0:
        return 0
    if monthly <= 0:
        return None
    return math.ceil(remaining / monthly)


def compute_metrics(d: dict) -> dict:
    total_income = d["income"] + d["otherIncome"]
    exps = [e for e in d["expenses"] if e["amount"] > 0]
    needs = sum(e["amount"] for e in exps if e["type"] == "need")
    wants = sum(e["amount"] for e in exps if e["type"] == "want")
    total_exp = needs + wants
    available = total_income - total_exp
    rec = min(available, round100(max(total_income * 0.2, available * 0.8))) if available > 0 else 0
    pct = (lambda v: v / total_income * 100) if total_income > 0 else (lambda v: 0)
    biggest = max(exps, key=lambda e: e["amount"]) if exps else None
    remaining = max(0.0, d["targetAmount"] - d["currentSavings"])
    progress = min(100.0, d["currentSavings"] / d["targetAmount"] * 100) if d["targetAmount"] > 0 else 0

    months_until = required = None
    if d["targetDate"]:
        try:
            t, today = date.fromisoformat(d["targetDate"]), date.today()
            months_until = max(0, (t.year - today.year) * 12 + (t.month - today.month) - (0 if t.day >= today.day else 1))
            required = math.ceil(remaining / months_until) if months_until > 0 else remaining
        except ValueError:
            pass

    return {
        "totalIncome": total_income, "totalExpenses": total_exp, "needsTotal": needs, "wantsTotal": wants,
        "available": available, "recommendedSavings": rec, "savingsRate": pct(rec), "needsPct": pct(needs),
        "wantsPct": pct(wants), "expenseRatio": pct(total_exp), "biggest": biggest, "remainingToGoal": remaining,
        "goalProgress": progress, "monthsToGoal": months_to_reach(remaining, rec),
        "monthsUntilTarget": months_until, "requiredMonthly": required,
    }


def build_context(d: dict) -> str:
    m = compute_metrics(d)
    f = lambda v: fmt(v, d["currency"])  # noqa: E731
    lines = [
        f"Currency: {d['currency']}",
        f"Monthly income: {f(d['income'])}; other income: {f(d['otherIncome'])}; total: {f(m['totalIncome'])}",
        f"Expenses (total {f(m['totalExpenses'])}, {m['expenseRatio']:.0f}% of income):",
        *[f"  - {e['name']} ({e['type']}): {f(e['amount'])}" for e in d["expenses"] if e["amount"] > 0],
        f"Needs: {f(m['needsTotal'])} ({m['needsPct']:.0f}%), Wants: {f(m['wantsTotal'])} ({m['wantsPct']:.0f}%)",
        f"Available balance after expenses: {f(m['available'])}",
        f"Calculated recommended monthly savings: {f(m['recommendedSavings'])} ({m['savingsRate']:.0f}% of income)",
        f"Goal: {d['financialGoal']}; target {f(d['targetAmount'])}; current savings {f(d['currentSavings'])}; remaining {f(m['remainingToGoal'])}",
        f"Target date: {d['targetDate']} ({m['monthsUntilTarget']} months away)" if d["targetDate"] else "No target date.",
        f"At recommended savings, goal reached in ~{m['monthsToGoal']} months." if m["monthsToGoal"] is not None else "Goal not reachable at current surplus.",
        f"Risk preference: {d['riskPreference']}",
        f"User notes: {d['notes']}" if d["notes"] else "",
    ]
    return "\n".join(line for line in lines if line)


def _find(d, *keys):
    for e in d["expenses"]:
        if e["amount"] > 0 and any(k in e["name"].lower() for k in keys):
            return e
    return None


def fallback_advice(d: dict) -> dict:
    m = compute_metrics(d)
    f = lambda v: fmt(v, d["currency"])  # noqa: E731
    inc = m["totalIncome"] or 1
    s = []

    food = _find(d, "food", "grocer", "dining")
    if food and food["amount"] / inc > 0.1:
        s.append({"title": "Set a monthly food budget",
                  "explanation": f"Food is {f(food['amount'])} a month ({food['amount'] / inc * 100:.0f}% of income). Planning weekly meals and limiting food delivery to once or twice a week could bring this down.",
                  "estimated_monthly_impact": round100(food["amount"] * 0.2), "priority": "high"})
    shop = _find(d, "shop", "cloth")
    if shop:
        s.append({"title": "Try a 48-hour rule for shopping",
                  "explanation": f"Shopping takes {f(shop['amount'])} a month. Waiting 48 hours before non-essential purchases cuts down on impulse spending.",
                  "estimated_monthly_impact": round100(shop["amount"] * 0.3), "priority": "high" if m["wantsPct"] > 20 else "medium"})
    ent = _find(d, "entertain", "subscri", "stream", "movie")
    if ent:
        s.append({"title": "Audit subscriptions and outings",
                  "explanation": f"Entertainment is {f(ent['amount'])} a month. Cancelling subscriptions you rarely use and switching some outings to free options usually trims this without much sacrifice.",
                  "estimated_monthly_impact": round100(ent["amount"] * 0.25), "priority": "medium"})
    tr = _find(d, "transport", "fuel", "commute", "travel")
    if tr and tr["amount"] / inc > 0.06:
        s.append({"title": "Optimise your commute",
                  "explanation": f"Transportation costs {f(tr['amount'])}. Carpooling, a monthly transit pass, or combining errands could lower fuel and ride-hailing costs.",
                  "estimated_monthly_impact": round100(tr["amount"] * 0.15), "priority": "low"})
    ut = _find(d, "utilit", "electric", "internet", "phone")
    if ut and len(s) < 5:
        s.append({"title": "Review utility and mobile plans",
                  "explanation": f"Utilities come to {f(ut['amount'])}. Comparing internet and mobile plans once a year and cutting standby power use often saves a little every month.",
                  "estimated_monthly_impact": round100(ut["amount"] * 0.1), "priority": "low"})
    s.insert(0, {"title": "Automate savings on payday",
                 "explanation": f"Set up an automatic transfer of {f(m['recommendedSavings'])} to a separate savings account on the day your salary arrives, so you save before you spend.",
                 "estimated_monthly_impact": m["recommendedSavings"], "priority": "high"})

    needs_ok, wants_ok = m["needsPct"] <= 55, m["wantsPct"] <= 30
    if m["available"] <= 0:
        health = "Your expenses are currently higher than your income, so the first step is to close that gap."
    elif m["savingsRate"] >= 20:
        health = "Your finances are in good shape: you can comfortably save a healthy share of your income."
    else:
        health = "Your finances are stable, with some room to build a stronger savings habit."

    if m["monthsToGoal"] is None:
        months_text = "At your current surplus the goal is not reachable yet — reducing expenses is the priority."
    elif m["monthsToGoal"] == 0:
        months_text = "You have already reached your target — congratulations!"
    else:
        months_text = f"At {f(m['recommendedSavings'])}/month you could reach it in about {m['monthsToGoal']} months (estimate)."

    b = m["biggest"]
    risk_tip = {
        "conservative": "With a conservative profile, keep your emergency fund in a high-interest savings account or short-term deposits.",
        "aggressive": "Even with an aggressive profile, keep 3–6 months of expenses in safe, liquid savings before investing.",
    }.get(d["riskPreference"], "A balanced approach: keep your emergency fund liquid, and consider diversified options only after it is complete.")

    return {
        "mode": "demo",
        "budget_plan": {
            "headline": f"Your plan: {round(m['needsPct'])}% needs, {round(m['wantsPct'])}% wants and {round(m['savingsRate'])}% savings, with {round(max(0, 100 - m['needsPct'] - m['wantsPct'] - m['savingsRate']))}% kept as a buffer.",
            "recommended_savings": m["recommendedSavings"],
            "needs_target_pct": 50, "wants_target_pct": 30, "savings_target_pct": 20,
            "notes": [
                f"Your needs are {m['needsPct']:.0f}% of income — within the common 50–55% guideline." if needs_ok
                else f"Your needs are {m['needsPct']:.0f}% of income — above the usual 50% guideline, so fixed costs deserve a review.",
                f"Discretionary spending is {m['wantsPct']:.0f}% of income, which is reasonable." if wants_ok
                else f"Discretionary spending is {m['wantsPct']:.0f}% of income — trimming it is the fastest way to save more.",
                f"After saving {f(m['recommendedSavings'])}, you keep a buffer of {f(m['available'] - m['recommendedSavings'])} for irregular costs."
                if m["available"] > 0 else "Consider pausing non-essential spending until income covers all expenses.",
            ],
        },
        "saving_suggestions": s[:5],
        "monthly_summary": {
            "overview": f"{health} You spend {f(m['totalExpenses'])} of your {f(m['totalIncome'])} monthly income ({m['expenseRatio']:.0f}%), leaving {f(m['available'])}.",
            "biggest_category": f"{b['name']} is your biggest expense at {f(b['amount'])} ({b['amount'] / inc * 100:.0f}% of income)." if b else "No expenses were entered.",
            "savings_progress": f"You have saved {f(d['currentSavings'])} of {f(d['targetAmount'])} for \"{d['financialGoal']}\" ({m['goalProgress']:.0f}%). {months_text}",
            "positive": f"You run a monthly surplus of {f(m['available'])}, which gives you real flexibility to reach your goal." if m["available"] > 0
            else "You have a clear picture of your spending now — the essential first step.",
            "improve": f"Keep an eye on {b['name'] if b else 'your largest category'}; small cuts there have the biggest effect." if wants_ok
            else f"Wants make up {m['wantsPct']:.0f}% of income. Bringing shopping and entertainment down would speed up your goal.",
            "next_focus": f"Automate {f(m['recommendedSavings'])} in savings and track {'food' if food else 'discretionary'} spending weekly next month.",
        },
        "insights": [
            f"Your savings rate at the recommended level would be {m['savingsRate']:.0f}% of income.",
            f"To hit your goal by the target date you need about {f(m['requiredMonthly'])}/month (estimate)."
            if m["requiredMonthly"] is not None and m["monthsUntilTarget"] else "Adding a target date helps you see the monthly amount needed.",
            risk_tip,
        ],
    }


def fallback_chat(d: dict, question: str) -> str:
    m = compute_metrics(d)
    f = lambda v: fmt(v, d["currency"])  # noqa: E731
    q = question.lower()
    inc = m["totalIncome"] or 1
    by_amount = sorted([e for e in d["expenses"] if e["amount"] > 0], key=lambda e: -e["amount"])
    wants = [e for e in by_amount if e["type"] == "want"]

    if re.search(r"how long|when|reach|goal|months", q):
        if m["remainingToGoal"] <= 0:
            return f"You've already reached your {f(d['targetAmount'])} target for \"{d['financialGoal']}\". Nice work!"
        if m["monthsToGoal"] is None:
            return (f"Right now your expenses use up your whole income, so there's no surplus to put towards \"{d['financialGoal']}\". "
                    f"Freeing up even {f(3000)} a month would put the goal within reach in about {months_to_reach(m['remainingToGoal'], 3000)} months (estimate).")
        faster = months_to_reach(m["remainingToGoal"], m["recommendedSavings"] + 2000)
        extra = f" Adding {f(2000)} more per month would cut that to roughly {faster} months." if faster is not None and faster < m["monthsToGoal"] else ""
        return (f"You need {f(m['remainingToGoal'])} more for \"{d['financialGoal']}\". Saving {f(m['recommendedSavings'])} a month, "
                f"you'd get there in about **{m['monthsToGoal']} months** (estimate).{extra}")
    if re.search(r"too much|overspend|spending|where", q):
        top = ", ".join(f"{e['name']} ({f(e['amount'])}, {e['amount'] / inc * 100:.0f}%)" for e in by_amount[:3])
        flex = f"**{wants[0]['name']}** at {f(wants[0]['amount'])}" if wants else "nothing stands out"
        return (f"Your top expenses are {top}. Among flexible categories, {flex} is the easiest to trim. "
                f"Overall, wants take {m['wantsPct']:.0f}% of income — a common guideline is around 30%.")
    if re.search(r"afford|enough|sustainable|manage", q):
        if m["available"] > 0:
            return (f"Yes — your expenses ({f(m['totalExpenses'])}) are {m['expenseRatio']:.0f}% of your income ({f(m['totalIncome'])}), "
                    f"leaving {f(m['available'])} a month. That's a comfortable margin, as long as you also keep an emergency buffer for irregular costs.")
        names = " and ".join(e["name"] for e in wants[:2]) or "discretionary items"
        return f"Not quite — your expenses exceed your income by {f(-m['available'])} a month. Start with the largest flexible categories: {names}."
    if re.search(r"save|saving|more", q):
        match = re.search(r"(\d[\d,]*)", q)
        target = int(match.group(1).replace(",", "")) if match else 5000
        ideas = [f"trim {e['name']} by ~{f(round100(e['amount'] * 0.3))}" for e in wants[:3]]
        possible = sum(round100(e["amount"] * 0.3) for e in wants[:3])
        covered = "That would cover it." if possible >= target else f"Combined with automating part of your {f(m['available'])} surplus, you can close the rest of the gap."
        together = f" — together about {f(possible)}" if ideas else ""
        return f"To save {f(target)} more each month you could {', '.join(ideas) or 'review your largest expenses'}{together}. {covered} These are estimates, not guarantees."
    return (f"Here's a quick snapshot: income {f(m['totalIncome'])}, expenses {f(m['totalExpenses'])}, surplus {f(m['available'])}. "
            f"I'd suggest saving about {f(m['recommendedSavings'])} a month towards \"{d['financialGoal']}\". "
            "Try asking where you're overspending, or how long your goal will take.")
