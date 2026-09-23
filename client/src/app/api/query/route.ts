/**
 * Next.js Route Handler — proxies requests to the FastAPI backend.
 *
 * POST /api/query
 * Body: JSON { source: "web"|"youtube"|"document", question: string, url?: string }
 *       or FormData with file + question + source (for document uploads)
 *
 * The proxy keeps the FastAPI URL out of client code and sidesteps CORS.
 */

import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://localhost:8000";

// Map source types to FastAPI endpoints
const SOURCE_ENDPOINT_MAP: Record<string, string> = {
  web: "/api/query/web",
  website: "/api/query/web",
  youtube: "/api/query/youtube",
  document: "/api/query/document",
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  try {
    // ── Document upload (multipart/form-data) ────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const question = formData.get("question") as string;
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }
      if (!question?.trim()) {
        return NextResponse.json(
          { error: "Question is required" },
          { status: 400 }
        );
      }

      // Forward the FormData directly to FastAPI
      const backendForm = new FormData();
      backendForm.append("file", file, file.name);
      backendForm.append("question", question);

      const backendUrl = `${FASTAPI_BASE_URL}/api/query/document`;
      const resp = await fetch(backendUrl, {
        method: "POST",
        body: backendForm,
        signal: AbortSignal.timeout(120_000), // 2 min timeout for large docs
      });

      const data = await resp.json();

      if (!resp.ok) {
        return NextResponse.json(
          { error: data.detail || data.error || "Backend error" },
          { status: resp.status }
        );
      }

      return NextResponse.json(data);
    }

    // ── URL-based queries (JSON body) ────────────────────────
    const body = await request.json();
    const { source, question, url } = body as {
      source: string;
      question: string;
      url?: string;
    };

    if (!source || !SOURCE_ENDPOINT_MAP[source]) {
      return NextResponse.json(
        { error: `Invalid source: "${source}". Must be one of: web, website, youtube, document` },
        { status: 400 }
      );
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (source !== "document" && !url?.trim()) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const endpoint = SOURCE_ENDPOINT_MAP[source];
    const backendUrl = `${FASTAPI_BASE_URL}${endpoint}`;

    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, question }),
      signal: AbortSignal.timeout(60_000), // 60s timeout
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Backend error" },
        { status: resp.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out. The backend took too long to respond." },
        { status: 504 }
      );
    }
    const message = err instanceof Error ? err.message : "Internal proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
