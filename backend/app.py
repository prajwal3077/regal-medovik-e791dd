"""FinWise AI — Flask REST API.

Frontend -> Flask API -> Gemini API. Nothing is stored: every request is processed
in memory and discarded.
"""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

import gemini_service  # noqa: E402  (needs env loaded first)
from finance import fallback_advice, fallback_chat, sanitize_text, validate_input  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("finwise")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024  # reject oversized payloads
CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")}})


@app.after_request
def no_store(resp):
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/api/health")
def health():
    return jsonify(status="ok", ai_configured=gemini_service.is_configured(), model=gemini_service.model_name(), backend="flask")


@app.post("/api/financial-advice")
def financial_advice():
    body = request.get_json(silent=True)
    data, errors = validate_input(body)
    if data is None:
        return jsonify(error="Please check your inputs.", details=errors), 422

    try:
        return jsonify(gemini_service.get_financial_advice(data))
    except gemini_service.GeminiUnavailable as exc:
        log.warning("financial-advice: using Demo Mode (%s)", exc)
        notice = None if not gemini_service.is_configured() else "AI service unavailable — showing Demo Mode insights."
        return jsonify({**fallback_advice(data), **({"notice": notice} if notice else {})})


@app.post("/api/chat")
def chat():
    body = request.get_json(silent=True) or {}
    question = sanitize_text(body.get("question"), 500)
    if not question:
        return jsonify(error="Please enter a question."), 422
    data, errors = validate_input(body.get("context"))
    if data is None:
        return jsonify(error="Financial context is missing or invalid.", details=errors), 422

    try:
        return jsonify(answer=gemini_service.answer_question(data, question, body.get("history")), mode="ai")
    except gemini_service.GeminiUnavailable as exc:
        log.warning("chat: using Demo Mode (%s)", exc)
        return jsonify(answer=fallback_chat(data, question), mode="demo")


@app.errorhandler(413)
def too_large(_):
    return jsonify(error="Request is too large."), 413


@app.errorhandler(404)
def not_found(_):
    return jsonify(error="Not found."), 404


@app.errorhandler(500)
def server_error(_):
    return jsonify(error="Something went wrong on our side. Please try again."), 500


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    mode = "Gemini AI" if gemini_service.is_configured() else "Demo Mode (no GEMINI_API_KEY)"
    log.info("FinWise AI API running on http://localhost:%s — %s", port, mode)
    app.run(host="127.0.0.1", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
