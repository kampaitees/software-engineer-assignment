# AI Interview Prep Kit
## Screen Recording and Code Walkthrough

Use this document while recording the assessment walkthrough. It is written in short sections so it is easy to read on a phone.

---

## 1. Final Links

Frontend:

https://ai-interview-prep-frontend-pied.vercel.app

Backend health check:

https://software-engineer-backend-gq0l.onrender.com/health

GitHub repository:

https://github.com/kampaitees/software-engineer-assignment

Expected health response:

```json
{"ok":true,"service":"interview-prep-backend"}
```

The backend root URL may show `NOT_FOUND`. That is expected because the backend exposes `/health`, `/auth`, and `/kits` routes rather than a homepage.

---

## 2. What To Say First

Say this at the beginning of the video:

> This project is an AI Interview Prep Kit. A user provides a job description, a company URL, and the number of days available. The system researches the company, extracts role requirements, generates category-specific interview questions and flashcards, checks coverage deterministically, creates a study schedule, and stores the result for editing and practice.

> The main engineering decision is that coverage checking and scheduling are implemented in code rather than delegated to the language model. This makes those two parts deterministic and testable.

---

## 3. Tools Used

### Frontend: Next.js and React

The frontend provides registration, login, kit creation, dashboard, editing, regeneration, schedule, flashcards, and practice mode.

### Styling: Tailwind CSS

Tailwind utility classes are used for layout, spacing, responsive grids, buttons, forms, cards, and mobile behavior.

### Backend: Node.js, Express, and TypeScript

The backend exposes the API, validates requests, manages authentication, runs the pipeline, and returns structured errors.

### Database: MongoDB Atlas and Mongoose

MongoDB stores users, generated kits, generation status, edited content, and practice confidence history. Mongoose provides the database models and connection layer.

### AI: Google Gemini

Gemini is used for role extraction, company brief generation, question generation, and flashcard generation. When no key is configured, deterministic fallback generation keeps local demos and tests usable.

### Research: Cheerio and public HTML search

Cheerio extracts useful text and links from company pages. Public interview discussion is searched through a public HTML endpoint.

### Deployment: Vercel and Render

Vercel hosts the Next.js frontend. Render hosts the Node/Express backend. MongoDB Atlas provides the cloud database.

### Testing: Vitest

Vitest protects coverage checking, schedule allocation, edge cases, and generated-kit validation.

---

## 4. Screenshot Checklist

Capture these screenshots during the walkthrough. Use the suggested filename so the evidence stays organized.

1. `01-vercel-home.png` - deployed frontend homepage.
2. `02-register.png` - registration page.
3. `03-login.png` - login page.
4. `04-render-live.png` - Render deployment showing Live status.
5. `05-health.png` - backend `/health` response.
6. `06-atlas-cluster.png` - MongoDB Atlas free Cluster0.
7. `07-atlas-user.png` - Database Access showing the database user. Do not show the password.
8. `08-render-environment.png` - Render environment variable names. Hide all secret values.
9. `09-new-kit.png` - new kit form with job description, company URL, and days.
10. `10-generating.png` - generation progress screen.
11. `11-overview.png` - company brief, coverage, and requirements.
12. `12-questions.png` - question bank and categories.
13. `13-edited-question.png` - edited question marked as edited.
14. `14-regeneration.png` - section regeneration control.
15. `15-flashcards.png` - flashcard list.
16. `16-practice.png` - reveal answer and confidence rating.
17. `17-schedule.png` - day-by-day schedule with minutes.
18. `18-github.png` - GitHub repository and README.

Never show passwords, MongoDB connection strings, Gemini keys, JWT secrets, Vercel tokens, or Render secrets in screenshots.

---

## 5. Live Product Walkthrough

### Step 1: Open the application

Open:

https://ai-interview-prep-frontend-pied.vercel.app

Say:

> This is the deployed Next.js frontend. The frontend is hosted on Vercel and communicates with the Express backend through a production API URL.

Screenshot: `01-vercel-home.png`

### Step 2: Register or sign in

Open Register and create a demo account. Then sign in.

Say:

> Authentication uses an HTTP-only JWT session cookie. The browser sends credentials with API requests, and the backend protects kit routes with authentication middleware.

Screenshot: `02-register.png` and `03-login.png`

Security note: use a demo password for the recording. Do not show real credentials.

### Step 3: Create a kit

Open **New Kit**. Enter:

- A realistic job description.
- A public company URL, such as `https://example.com` for a simple demo.
- A schedule length such as `5` days.

Click create.

Say:

> The API creates a processing shell immediately and runs the slow pipeline in the background. The UI polls the kit status and shows the current stage and progress instead of making the user wait on a blank page.

Screenshot: `09-new-kit.png` and `10-generating.png`

### Step 4: Explain the generated overview

Open the completed kit overview.

Point out:

- Company brief.
- Coverage count.
- Coverage passes.
- Must-have requirements.
- Research sources.

Say:

> The overview separates facts about the company from role requirements. Coverage shows how many must-have requirements are covered by generated questions.

Screenshot: `11-overview.png`

### Step 5: Explain questions

Open the Questions tab.

Point out:

- Technical questions.
- Behavioural questions.
- System design questions.
- Company-fit questions.
- Difficulty.
- Requirement IDs.
- Regenerate buttons.
- Add, delete, and reorder controls.

Edit a question and show the `edited` label.

Say:

> Every question points to one or more stable requirement IDs. This makes coverage measurable. A manually edited question is marked as edited and survives regeneration of its category.

Screenshot: `12-questions.png` and `13-edited-question.png`

### Step 6: Demonstrate regeneration

Choose one category and click its regeneration button.

Say:

> Regeneration is scoped to one section. It replaces generated questions in that category while preserving edited questions and leaving other categories unchanged.

Screenshot: `14-regeneration.png`

### Step 7: Explain flashcards and practice mode

Open Flashcards, then Practice.

Reveal an answer and select a confidence score.

Say:

> Practice is not just a read-only document. The user reveals the answer, records confidence, and the next session orders cards by lowest recorded confidence first. This is a simple, explainable weak-spot workflow.

Screenshot: `15-flashcards.png` and `16-practice.png`

### Step 8: Explain the schedule

Open Schedule.

Point out the exact number of days, question IDs, focus, and integer minutes.

Say:

> The schedule is calculated by application code. Higher difficulty and must-have material are prioritized earlier, and the schedule always contains exactly the requested number of days.

Screenshot: `17-schedule.png`

---

## 6. Code Walkthrough Order

Open the GitHub repository or VS Code and use this order. Keep each explanation short.

### 6.1 Workspace scripts

File: `package.json`

Show:

- `npm run dev` starts frontend and backend together.
- `npm run build` builds both applications.
- `npm test` runs backend tests.
- `npm run evaluate` runs the mandatory evaluator.

Say:

> The root workspace provides one-command development, build, test, and evaluation workflows.

### 6.2 Frontend API client

File: `frontend/src/lib/api.ts`

Show:

- `NEXT_PUBLIC_API_URL` configuration.
- `credentials: 'include'` for session cookies.
- JSON response parsing.
- Structured error messages.

Say:

> The client is intentionally small. Every frontend request goes through one helper so the API base URL, credentials, and error handling stay consistent.

### 6.3 Frontend kit workflow

File: `frontend/src/app/kits/[id]/page.tsx`

Show:

- Loading state.
- Processing state and progress bar.
- Error state.
- Overview, questions, flashcards, schedule, and practice tabs.
- Edit, reorder, delete, add, regenerate, and confidence actions.
- Debounced saving for inline question and brief edits.

Say:

> This page owns the interactive kit workflow. Local state updates immediately, while edits are persisted after a short debounce so typing does not create an API request for every character.

### 6.4 Backend application setup

File: `backend/src/app.ts`

Show:

- CORS with the configured frontend origin.
- JSON body parsing.
- Cookie parsing.
- `/health` endpoint.
- Auth and kit routers.
- Structured error middleware.

Say:

> The app layer wires transport concerns. Business decisions remain in route handlers and services.

### 6.5 Authentication

Files:

- `backend/src/routes/auth.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/models/User.ts`

Show:

- Zod email and password validation.
- bcrypt password hashing.
- JWT session signing.
- HTTP-only cookie.
- Cross-site production cookie settings for Vercel-to-Render requests.
- `requireAuth` middleware.

Say:

> Passwords are stored as bcrypt hashes, never plaintext. The frontend and backend are on different domains in production, so the session cookie uses `SameSite=None` and `Secure` when the configured frontend URL is HTTPS.

Do not show a real password while recording.

### 6.6 Kit routes and persistence

File: `backend/src/routes/kits.ts`

Show:

- Zod request validation.
- Deduplication hash for repeated submissions.
- Processing shell creation.
- Background pipeline execution.
- Generation status updates.
- Patch, regeneration, and practice endpoints.

Say:

> Kit creation returns quickly with a processing ID. The pipeline continues in the background, and the user can reopen the kit while generation is in progress or after a failure.

### 6.7 The pipeline

File: `backend/src/services/pipeline.ts`

Read the flow in this order:

1. Validate job description and days.
2. Extract the role and requirements.
3. Crawl the company site.
4. Search public interview discussion.
5. Build the company brief.
6. Generate each question category separately.
7. Run deterministic coverage checking.
8. Generate missing questions for up to three total passes.
9. Generate flashcards.
10. Allocate the schedule.
11. Validate the complete kit.
12. Return the validated result.

Say:

> The pipeline is deliberately separated into small responsibilities. The language model generates content, but the application controls coverage, schedule allocation, validation, and persistence.

### 6.8 LLM boundary and fallback

Files:

- `backend/src/services/generation/llm.ts`
- `backend/src/services/extraction/extractRole.ts`
- `backend/src/services/generation/generateQuestions.ts`
- `backend/src/services/generation/generateCompanyBrief.ts`

Say:

> The Gemini boundary requests JSON, retries transient failures, retries rate limits, and rejects invalid JSON. Without an API key, deterministic fallback generators allow the interface and evaluator to run locally.

### 6.9 Deterministic coverage

File: `backend/src/services/coverage/checkCoverage.ts`

Say:

> Coverage builds a set of question requirement IDs and returns must-have requirements that are missing. This is a code decision, not an LLM decision.

### 6.10 Deterministic schedule

File: `backend/src/services/scheduling/allocateSchedule.ts`

Say:

> Questions are sorted by must-have priority and difficulty, then distributed across exactly the requested number of day buckets. Durations are integer minutes based on difficulty.

### 6.11 Validation

File: `backend/src/services/validator.ts`

Say:

> Zod validates the complete kit shape. Additional checks ensure that question requirement IDs exist, scheduled question IDs exist, the day count is exact, and every must-have requirement appears in the schedule.

### 6.12 Tests

Files:

- `backend/tests/pipeline.test.ts`
- `backend/tests/edge.test.ts`

Run:

```bash
npm test
```

Say:

> The tests protect the highest-risk deterministic behavior: coverage, schedule allocation, validation, and one-day and sixty-day edge cases.

### 6.13 Mandatory evaluator

File: `backend/evaluate/cli.ts`

Run:

```bash
npm run evaluate -- --input cases/sample-cases.json --output kits.json
```

Say:

> The evaluator uses the same pipeline as the web app, accepts multiple cases, continues after an individual failure, and writes one JSON result file.

### 6.14 Deployment files

Files:

- `frontend/Dockerfile`
- `backend/Dockerfile`
- `render.yaml`
- `.env.example`
- `frontend/.env.example`

Say:

> The frontend is deployed to Vercel, the backend runs on Render, and MongoDB Atlas provides persistence. Secrets are supplied through hosting environment variables and are not committed to Git.

---

## 7. One-Minute Architecture Summary

Use this if the interviewer asks for a concise explanation:

> The browser talks to a Next.js frontend. The frontend calls an Express API with credentials included for the JWT session cookie. The API validates requests with Zod and persists users and kits in MongoDB through Mongoose. Kit creation starts a background pipeline. The pipeline separates extraction, retrieval, generation, coverage, scheduling, validation, and persistence. Gemini generates content, while deterministic TypeScript code controls coverage and scheduling. The final kit can be edited, regenerated section by section, and used in a confidence-based practice workflow.

---

## 8. Final Design Decisions

### Why separate question categories?

Technical, behavioural, system-design, and company-fit questions need different prompts and different requirement mappings. Separate generation calls make the output more targeted.

### Why deterministic coverage?

A model can claim that a requirement is covered inconsistently. Comparing stable IDs in code is repeatable and testable.

### Why a maximum of three coverage passes?

It closes obvious gaps without creating an unbounded generation loop or excessive API usage.

### Why confidence ordering?

It is simple, explainable, persists naturally with practice history, and immediately focuses the next session on weak areas.

### Why a background job shape?

Company crawling and LLM generation can take time. Returning a processing kit immediately keeps the UI responsive and lets the user see progress and failures.

---

## 9. Final Verification Before Submission

Run:

```bash
npm test
npm run build
npm run evaluate -- --input cases/sample-cases.json --output kits.json
```

Check:

- Frontend opens publicly.
- Backend `/health` returns `ok: true`.
- Register and login work.
- New kit reaches completed status.
- Questions can be edited and reordered.
- Edited questions survive category regeneration.
- Flashcard practice records confidence.
- Schedule has the requested number of days.
- No screenshot contains a password, token, or connection string.

Submission values:

```text
Hosted Project Link:
https://ai-interview-prep-frontend-pied.vercel.app

Frontend Repository URL:
https://github.com/kampaitees/software-engineer-assignment

Backend Repository URL:
https://github.com/kampaitees/software-engineer-assignment
```

---

## 10. Closing Line

End the walkthrough with:

> The result is an editable interview-preparation workspace rather than a one-time generated document. The important engineering properties are deterministic coverage and scheduling, background progress handling, safe regeneration, persistent practice history, and a deployment setup that separates the frontend, backend, and database responsibilities.
