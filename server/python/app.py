"""
OmniQuery FastAPI Backend
Wraps the existing web_pipeline, youtube_pipeline, and doc_pipeline
functions as HTTP endpoints.
"""

import asyncio
import os
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Load env vars ────────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Ensure feature package is importable ─────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from feature.web.web_main import web_pipeline
from feature.vid.yt_main import youtube_pipeline
from feature.doc.doc_main import doc_pipeline

# ── Thread pool for blocking pipeline calls ──────────────────
# Tuned: 4 workers is reasonable for a single-user dev machine.
# Increase for prod deployments.
_executor = ThreadPoolExecutor(max_workers=4)

# ── App lifecycle ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    _executor.shutdown(wait=False)

# ── FastAPI app ──────────────────────────────────────────────
app = FastAPI(
    title="OmniQuery API",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Always return JSON errors, never HTML."""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )


# ── Request / Response models ────────────────────────────────
class URLQueryRequest(BaseModel):
    url: str
    question: str

class QueryResponse(BaseModel):
    answer: str
    source: str


# ── Endpoints ────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/query/web", response_model=QueryResponse)
async def query_web(body: URLQueryRequest):
    """Query a website URL."""
    if not body.url.strip():
        raise HTTPException(status_code=400, detail="URL is required")
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    loop = asyncio.get_running_loop()
    try:
        answer = await loop.run_in_executor(
            _executor,
            web_pipeline,
            body.url.strip(),
            body.question.strip(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web pipeline error: {e}")

    return QueryResponse(answer=answer, source="web")


@app.post("/api/query/youtube", response_model=QueryResponse)
async def query_youtube(body: URLQueryRequest):
    """Query a YouTube video by URL."""
    if not body.url.strip():
        raise HTTPException(status_code=400, detail="YouTube URL is required")
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    loop = asyncio.get_running_loop()
    try:
        answer = await loop.run_in_executor(
            _executor,
            youtube_pipeline,
            body.url.strip(),
            body.question.strip(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube pipeline error: {e}")

    return QueryResponse(answer=answer, source="youtube")


# 50 MB limit for document uploads
MAX_UPLOAD_SIZE = 50 * 1024 * 1024


@app.post("/api/query/document", response_model=QueryResponse)
async def query_document(
    file: UploadFile = File(...),
    question: str = Form(...),
):
    """Query an uploaded document (PDF, DOCX, etc.)."""
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    # Read file content with size check
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024*1024)}MB",
        )

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

        loop = asyncio.get_running_loop()
        answer = await loop.run_in_executor(
            _executor,
            doc_pipeline,
            tmp_path,
            question.strip(),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document pipeline error: {e}")
    finally:
        # Always clean up the temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    return QueryResponse(answer=answer, source="document")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
