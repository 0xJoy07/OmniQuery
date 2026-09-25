"""
OmniQuery Flask Backend
Wraps the existing web_pipeline, youtube_pipeline, and doc_pipeline
functions as HTTP endpoints.
"""

import atexit
import os
import sys
import tempfile

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Load env vars ────────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Ensure feature package is importable ─────────────────────
# Go up one level from flask/ to server/python/ where the feature package lives
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from feature.web.web_main import web_pipeline
from feature.vid.yt_main import youtube_pipeline
from feature.doc.doc_main import doc_pipeline

# ── Flask app ────────────────────────────────────────────────
app = Flask(__name__)

# ── CORS ─────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000"
).split(",")

CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# ── Global error handler ────────────────────────────────────
@app.errorhandler(Exception)
def global_exception_handler(exc):
    """Always return JSON errors, never HTML."""
    return jsonify({"error": str(exc)}), 500


# ── Endpoints ────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/query/web", methods=["POST"])
def query_web():
    """Query a website URL."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    url = (data.get("url") or "").strip()
    question = (data.get("question") or "").strip()
    history = data.get("history") or []

    if not url:
        return jsonify({"error": "URL is required"}), 400
    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        answer = web_pipeline(url, question, history)
    except Exception as e:
        return jsonify({"error": f"Web pipeline error: {e}"}), 500

    return jsonify({"answer": answer, "source": "web"})


@app.route("/api/query/youtube", methods=["POST"])
def query_youtube():
    """Query a YouTube video by URL."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    url = (data.get("url") or "").strip()
    question = (data.get("question") or "").strip()
    history = data.get("history") or []

    if not url:
        return jsonify({"error": "YouTube URL is required"}), 400
    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        answer = youtube_pipeline(url, question, history)
    except Exception as e:
        return jsonify({"error": f"YouTube pipeline error: {e}"}), 500

    return jsonify({"answer": answer, "source": "youtube"})


# 5 MB limit for document uploads
MAX_UPLOAD_SIZE = 5 * 1024 * 1024
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_SIZE


@app.route("/api/query/document", methods=["POST"])
def query_document():
    """Query an uploaded document (PDF, DOCX, etc.)."""
    
    # Check if request is JSON
    if request.is_json:
        data = request.get_json(silent=True) or {}
        question = (data.get("question") or "").strip()
        history = data.get("history") or []
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
            
        try:
            answer = doc_pipeline(None, question, history)
            return jsonify({"answer": answer, "source": "document"})
        except Exception as e:
            return jsonify({"error": f"Document pipeline error: {e}"}), 500

    # Otherwise, it's a multipart form upload
    question = (request.form.get("question") or "").strip()
    history_str = request.form.get("history") or "[]"
    import json
    try:
        history = json.loads(history_str)
    except:
        history = []

    if not question:
        return jsonify({"error": "Question is required"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    # Read file content
    content = file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        return jsonify({
            "error": f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024 * 1024)}MB"
        }), 413

    # Get the original file extension
    original_name = file.filename or "upload.pdf"
    _, ext = os.path.splitext(original_name)
    ext = ext.lower() if ext else ".pdf"

    # Save to temp file and run pipeline with try/finally cleanup
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=ext, dir=tempfile.gettempdir()
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        answer = doc_pipeline(tmp_path, question, history)
    except Exception as e:
        return jsonify({"error": f"Document pipeline error: {e}"}), 500
    finally:
        # Always clean up the temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    return jsonify({"answer": answer, "source": "document"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
