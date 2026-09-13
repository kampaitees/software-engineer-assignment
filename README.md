# AI Interview Prep Kit

> Turn a job description and company URL into a focused, editable interview preparation workspace.

This is a full-stack engineering assessment implementation. It extracts role requirements, researches the company, generates targeted interview material, checks requirement coverage deterministically, creates a day-by-day schedule, and persists the result for continued practice.

## What It Does

- Extracts technical, behavioural, and domain requirements from a job description.
- Crawls the supplied company site and ranks useful pages such as hiring, about, and engineering pages.
- Searches public interview discussion and labels the result as reported public information.
- Generates a company brief, category-specific questions, and flashcards.
- Runs a deterministic coverage check and a targeted second-generation pass for missing must-have requirements.
- Allocates questions across exactly the requested number of study days.
- Lets users edit, reorder, add, delete, regenerate, and practise from a saved kit.
- Orders future flashcard practice by the user's lowest recorded confidence.

## Architecture

```text
Next.js frontend
			 |
			 v
Express API -> MongoDB
			 |
			 +-> extraction
			 +-> company crawler and public research
			 +-> LLM generation
			 +-> deterministic coverage and scheduling
			 +-> validation and persistence
```

Generation flow:

```text
JD
 -> requirement extraction
 -> company crawl and interview research
 -> company brief
 -> category-specific questions
 -> coverage check
 -> missing-question pass (maximum 3 total passes)
 -> flashcards
 -> deterministic schedule
 -> structure validation
 -> persistence
```

The model does not decide coverage or scheduling. Coverage is a set comparison over stable requirement IDs, and scheduling is arithmetic performed by application code.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Node.js 22 runtime, Express 5, TypeScript 5 |
| Persistence | MongoDB Atlas, Mongoose 9 |
| Research | Cheerio, DuckDuckGo HTML search |
| Generation | Google Gemini API with deterministic local fallback |
| Authentication | bcryptjs password hashing, JWT, HTTP-only cookies |
| Testing | Vitest 3 |
| Deployment | Vercel frontend, Render backend, MongoDB Atlas |

The project uses modern ESM TypeScript on the backend and the Next.js App Router on the frontend. The backend is compiled with TypeScript into `backend/dist/src/`; its production entrypoint is `node dist/src/server.js`.

## Project Structure

```text
backend/
	evaluate/                 Mandatory batch evaluator
	src/routes/               Auth and kit API routes
	src/services/             Pipeline, crawler, research, generation, validation
	tests/                    Deterministic behavior tests
frontend/
	src/app/                  Next.js pages and kit workflow
	src/components/           Shared navigation and auth components
cases/                      Sample evaluator input
docker-compose.yml          Local MongoDB service
```

## Quick Start

### Prerequisites

- Node.js 20 or newer
- Docker Desktop for local MongoDB
- A Gemini API key for live generation; local fallback generation works without one

### Install

From the repository root:

```powershell
npm install
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env.local
```

Start MongoDB:

```powershell
docker compose up -d mongo
```

Set `GEMINI_API_KEY` and a strong random `JWT_SECRET` in `.env`, then start both services:

```powershell
npm run dev
```

For the deployed application, open the frontend at [ai-interview-prep-frontend-pied.vercel.app](https://ai-interview-prep-frontend-pied.vercel.app) and verify the backend with [software-engineer-backend-gq0l.onrender.com/health](https://software-engineer-backend-gq0l.onrender.com/health).

For local development only, `npm run dev` serves the frontend at `http://localhost:3000` and the backend health endpoint at `http://localhost:4000/health`.

## Environment Variables

The root `.env.example` contains backend settings. Frontend builds read `NEXT_PUBLIC_API_URL` from `frontend/.env.local`.

| Variable | Purpose | Local default |
| --- | --- | --- |
| `PORT` | Backend listening port | `4000` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | Local MongoDB database |
| `JWT_SECRET` | Session signing secret | Replace before deployment |
| `GEMINI_API_KEY` | Gemini generation credentials | Empty enables fallback mode |
| `GEMINI_MODEL` | Gemini model name | `gemini-3-flash-preview` |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | `http://localhost:4000` |
| `ALLOW_PRIVATE_FETCH` | Allow private URLs during controlled evaluation | `false` |
| `MAX_FETCH_BYTES` | Maximum fetched page size | `2000000` |
| `FETCH_TIMEOUT_MS` | External fetch timeout | `12000` |

Never commit `.env`, `.env.local`, API keys, or database credentials.

For production, `FRONTEND_URL` must be the exact HTTPS Vercel origin. The backend automatically uses `SameSite=None; Secure` session cookies when this value starts with `https://`, allowing authentication requests between the Vercel frontend and Render backend. Local HTTP development keeps `SameSite=Lax`.

## Mandatory Evaluator

The evaluator uses the same `runPipeline` as the web application. It accepts an array of cases, continues after individual failures, and writes the required `version`, `generated_at`, and `kits` structure.

```bash
npm run evaluate -- --input cases/sample-cases.json --output kits.json
```

Each input case contains:

```json
{
	"id": "case-01",
	"jd": "Job description text",
	"company_url": "https://example.com",
	"days": 5
}
```

The evaluator also supports local test hosts and resolves relative input/output paths from the repository root when run through the workspace script.

## Verification

Run the automated tests:

```bash
npm test
```

Build both production services:

```bash
npm run build
```

The tests cover the highest-risk deterministic behavior:

- Coverage identifies uncovered must-have requirements.
- Scheduling creates exactly the requested number of days with integer durations.
- Validation rejects invalid structure and unknown scheduled question IDs.

## Editing and Regeneration Rules

Questions edited in the interface receive `state: "edited"`. Regenerating a category replaces generated questions in that category while preserving edited questions. Regenerating the company brief or schedule only updates that section, so edits elsewhere remain intact. Inline text changes are applied locally immediately and persisted with a short debounce.

## Security and Failure Handling

- External URLs are validated before crawling.
- Private and loopback addresses are blocked in normal production mode.
- Fetches have content-size and timeout limits.
- Transient fetch and LLM failures are retried.
- Invalid LLM JSON is retried before the pipeline fails.
- Structured API errors are returned to the frontend.
- Duplicate job description and company submissions are detected by a normalized hash.
- Thin job descriptions and empty public research produce honest, limited output instead of invented facts.

## Deployment

Current deployment:

- Frontend: [ai-interview-prep-frontend-pied.vercel.app](https://ai-interview-prep-frontend-pied.vercel.app)
- Backend health check: [software-engineer-backend-gq0l.onrender.com/health](https://software-engineer-backend-gq0l.onrender.com/health)
- Database: MongoDB Atlas Free cluster

Recommended free-tier layout:

1. Deploy `frontend/` to Vercel or another Next.js host.
2. Deploy `backend/` to Render or another Node/Docker host.
3. Use MongoDB Atlas for the database.
4. Set `NEXT_PUBLIC_API_URL` on the frontend to the public backend URL.
5. Set `FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` on the backend.
6. Verify `GET /health`, registration, login, and create-kit flow after deployment.

For Render, use the included `render.yaml` blueprint or create a free Web Service manually with `backend/` as the root directory. The build command is `npm install && npm run build`, the start command is `npm start`, and the health check is `/health`. For Vercel, import this repository, set the project root to `frontend/`, and configure `NEXT_PUBLIC_API_URL` with the public Render backend URL.

The Dockerfiles in `frontend/` and `backend/` are included for container-based deployment. Secrets must be configured through the hosting provider's environment settings.

## Trade-offs

- DuckDuckGo HTML search is free and simple, but less reliable than a paid search API.
- Crawl depth is intentionally limited to keep latency and free-tier usage predictable.
- Confidence-weighted practice is intentionally explainable instead of implementing a full spaced-repetition algorithm.
- The batch UI loads the first case from an uploaded JSON file for quick entry.

## Assessment Status

The repository includes the complete source, Docker configuration, tests, sample cases, mandatory evaluator, and deployment blueprint. Recent production fixes include:

- Corrected the compiled backend entrypoint from `dist/server.js` to `dist/src/server.js`.
- Added cross-site production session cookies for Vercel-to-Render authentication.
- Added debounced inline persistence for question and company-brief edits.
- Added a dedicated Vercel frontend project and Render backend deployment configuration.
- Verified backend tests, production build, sample-case evaluator, frontend health, and backend `/health`.

