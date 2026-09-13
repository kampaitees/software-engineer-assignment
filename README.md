# AI Interview Prep Kit

A full-stack assessment implementation that converts a pasted job description plus company URL into a structured interview preparation kit. The pipeline deliberately separates extraction, retrieval, research, targeted question generation, deterministic coverage checking, deterministic schedule allocation, validation and persistence.

## Stack
- Next.js + Tailwind CSS frontend
- Node.js + Express backend
- MongoDB + Mongoose
- TypeScript
- Cheerio for HTML parsing
- Gemini API (default: `gemini-3-flash-preview`)
- Vitest for deterministic pipeline tests

The assessment's preferred stack is Next.js, Tailwind, Node/Express, MongoDB and JavaScript/TypeScript; this project follows that choice.

## Architecture

`frontend -> Express API -> services -> MongoDB`

Pipeline:

`JD -> requirement extraction -> company crawl/link ranking -> public interview discussion search -> company brief -> category-specific questions -> coverage check -> missing-question second pass (max 3 total) -> flashcards -> deterministic schedule -> structure validation -> persistence`

The model never decides the schedule or coverage status. The schedule is arithmetic/code. Coverage is a set comparison over stable requirement IDs and question `requirement_ids`.

## Generated / edited state

Hand-edited questions are marked with `state: "edited"`. Regeneration replaces generated material while preserving edited questions from the same category. This prevents a section regeneration from clobbering deliberate user edits elsewhere.

## Retrieval

The crawler starts at the supplied homepage, collects same-host links, ranks links using hiring/about/engineering/interview-related URL and anchor keywords, and fetches the highest-ranked candidates. It follows relative links, uses timeouts, enforces a response-size limit, retries transient failures, and records skipped sources. Public interview discussion is searched through DuckDuckGo HTML; absence of results is represented honestly.

The crawler validates HTTP(S) URLs and blocks private/loopback resolution in normal production mode. The mandatory evaluator supports local test hosts by setting `EVALUATE_MODE=1` inside the CLI process.

## LLM calls

Generation is intentionally split into multiple responsibilities. Requirements, company brief, each question category, and flashcards are different model calls. Invalid JSON is retried. HTTP 429s use exponential backoff. When `GEMINI_API_KEY` is missing, a deterministic fallback generator allows local UI/demo work without credentials; a real evaluation run should configure the provider key.

Google's Gemini Developer API currently documents a free tier for selected models; check current model/rate-limit availability before evaluation. See the official Gemini docs for current limits and model availability.

## Setup

### 1. Prerequisites
- Node.js 20+
- Docker (recommended for MongoDB)

### 2. Install

```bash
npm install
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env.local
```

### 3. MongoDB

```bash
docker compose up -d mongo
```

### 4. Environment

Fill in `GEMINI_API_KEY` and set a long random `JWT_SECRET` in `.env`.

### 5. Run

```bash
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000/health

## Mandatory batch command

The required command is implemented exactly as requested:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

Example:

```bash
npm run evaluate -- --input cases/sample-cases.json --output /tmp/kits.json
```

The evaluator runs the same `runPipeline` used by the application, continues after per-case failures, and writes Appendix B's `version/generated_at/kits` shape.

## Tests

```bash
npm test
```

Tests protect the three highest-risk deterministic behaviours: schedule allocation, coverage checking and structure validation.

## Deployment

A simple deployment is:
- frontend on a Next.js-capable host (for example Vercel)
- backend on a Node-capable host (for example Render/Railway/Fly.io)
- MongoDB Atlas for persistence

Set `NEXT_PUBLIC_API_URL` on the frontend and `FRONTEND_URL` on the backend to the public URLs. Never commit secrets.

For Vercel, set `NEXT_PUBLIC_API_URL` to the deployed backend URL before the frontend build. For Render/Railway/Fly.io, set `PORT`, `FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` in the service environment. The backend health check is `GET /health`.

## Known limitations / trade-offs

- The public interview search uses a simple public HTML endpoint and may return fewer results than a paid search API.
- Crawl depth is intentionally limited to keep free-tier latency predictable.
- Flashcard practice uses confidence-weighted ordering rather than a full spaced-repetition algorithm.
- The batch evaluator accepts the mandatory JSON shape; the web UI loads the first case from an uploaded JSON file for quick entry.

## Creative feature

The practice workflow itself is the differentiator: confidence is persisted per flashcard, and the next session orders cards by lowest observed confidence first. This is intentionally simple, explainable and reuses practice data already required by the assessment.
