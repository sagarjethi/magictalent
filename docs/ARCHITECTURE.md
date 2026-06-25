# Jobmagic — Architecture

A single Next.js (App Router) full-stack web app serving **two portals** (Job Seeker + Recruiter) over **one shared backend** (matching engine, agents, source pipeline, persistence). Runs locally and on Vercel. Fully functional offline (heuristic mode) with seeded SQLite data.

## 1. The 7-stage recruitment lifecycle (product backbone)

The recruiter pipeline and analytics are organized around the canonical 7-stage hiring life cycle. Each stage is an explicit pipeline column and an audited state transition.

| # | Stage | What happens | Where in app |
|---|---|---|---|
| 1 | **Identify** | Define the need: create a requisition; AI parses JD → structured `JobSpec` | Requisitions |
| 2 | **Attract / Source** | Reach candidates: Sourcing Agent fans out to sources + internal seeker pool | Find / Sourcing |
| 3 | **Screen** | Rank & filter by explainable match score; review strengths/gaps | Matches → Pipeline `Screening` |
| 4 | **Interview** | Track interview stage; notes | Pipeline `Interview` |
| 5 | **Select** | Decide; AI-assisted comparison; move to offer | Pipeline `Selected` |
| 6 | **Hire** | Offer + outreach; mark hired | Pipeline `Hired` + Outreach |
| 7 | **Onboard** | Handoff checklist; close requisition | Pipeline `Onboarding` |

Pipeline stages enum (`src/lib/domain`): `Sourced → Screening → Interview → Selected → Hired → Onboarding` (plus `Rejected`). The seeker-side application tracker mirrors stages 1–6 from the candidate's view (`Applied → Screening → Interview → Offer → Hired`).

## 2. Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│ UI (src/app/**, React + Tailwind, design system in src/components/ui) │
│  Landing · (seeker): Profile · ATS · Jobs · Applications · Copilot     │
│           · (recruiter): Requisitions · Find · Matches · Pipeline      │
│             · Outreach · Analytics                                      │
├─────────────────────────────────────────────────────────────────────┤
│ API layer (src/app/api/** route handlers, server-only, zod-validated)  │
│  /requisitions /jobs /candidates /seeker/profile /ats /match           │
│  /source /pipeline /applications /outreach /agent/* /audit             │
├─────────────────────────────────────────────────────────────────────┤
│ Domain services (src/lib/**, server-only)                              │
│  domain/   zod schemas + shared TS types (the contracts)               │
│  ai/       provider client (Anthropic) + retry + JSON-repair + fallback│
│  matching/ JD parse · resume parse · ATS score · the shared scorer     │
│  sources/  SourceAdapter interface + github + internal-pool + factory   │
│  agents/   Sourcing Agent + Career Copilot (tool-using loops)          │
│  db/       SQLite schema + repositories + seed + audit log              │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. The shared matching engine (core)

`scoreMatch(job: JobSpec, candidate: CandidateProfile): MatchResult` — pure, deterministic, explainable. Used **both** directions:
- Recruiter: `rankCandidates(job, candidates[])` → ranked shortlist.
- Seeker: `rankJobs(candidate, jobs[])` → ranked job feed.

`MatchResult` = overall 0–100 + breakdown `{ skills, experience, keywords, seniority }` + `strengths[]`, `gaps[]`, `reasoning`, and `mode: 'ai' | 'heuristic'`. The heuristic computes weighted skill/keyword overlap + seniority distance; the AI layer (when keyed) enriches `reasoning`, `strengths`, `gaps`. Either way the numeric breakdown is deterministic so both portals agree.

## 4. AI client & graceful degradation

`src/lib/ai/client.ts` exposes `complete()` and `completeJSON<T>(schema)`. Behavior:
- If `ANTHROPIC_API_KEY` set → call Claude (`AI_MODEL`, default `claude-sonnet-4-6`) with `withRetry` + `parseJsonResponse` (robust to code-fences/partial JSON), validated by the caller's zod schema.
- If unset or the call fails → caller falls back to a deterministic heuristic and tags the result `mode: 'heuristic'`.
- Secrets are server-only; the client throws if imported from a client component.

## 5. Source pipeline

Pluggable `SourceAdapter` (same as TalentScout's proven design): `getSourceType()`, `isEnabled()`, `search(spec)`, `enrichProfile()`, `getRateLimitStatus()`. Adapters:
- **github** — official Search API (token optional; degrades to a small public sample without one), repo→skills enrichment, rate-limit aware.
- **internal-pool** — the platform's own job-seeker profiles become a first-class candidate source (the two-sided flywheel).
- **linkedin/naukri** — gated off by env flags (legal); present as interface only.
Pipeline: parse JD → fan out to enabled adapters → normalize → dedupe (by source+id and by identity) → enrich → match/rank → persist with provenance.

## 6. Agents (agentic loops) — built on LangGraph.js

The agentic layer uses **LangGraph.js** (`@langchain/langgraph`) for stateful, tool-using agent graphs, with **`@langchain/anthropic` (`ChatAnthropic`)** as the model provider. Each agent is a real `StateGraph` that cycles between a **reason** node and a **tools** node (the ReAct pattern):

- **Sourcing Agent** (`agents/sourcing-agent.ts`) — a LangGraph graph over recruiter tools: `parse_jd`, `search_sources`, `score_candidates`. Given a requisition it runs parse → source → rank and proposes a shortlist for human review. State changes (save to pipeline, send outreach) require explicit user action.
- **Career Copilot** (`agents/career-copilot.ts`) — a LangGraph ReAct agent over read-only seeker tools: `rank_jobs`, `ats_score`, `tailor_resume`. Answers the seeker's question citing real data; drafts are proposed, never auto-submitted.

**Graceful degradation (still a real graph):** tools are LangChain `tool()` wrappers around our domain functions (which themselves work heuristically). When `ANTHROPIC_API_KEY` is set, the reason node is `ChatAnthropic.bindTools(...)` (true LLM tool-calling). When it is unset, the reason node falls back to a **deterministic policy** that drives the same tool nodes in the canonical order — so the graph, the tool calls, and the `AgentStep` trace are identical in shape, only the planner differs. The model provider lives in `agents/model.ts`. Both agents emit an `AgentStep[]` trace so the UI shows the agent's reasoning transparently.

## 7. Persistence

SQLite via `better-sqlite3` (synchronous, zero-config, file `./data/jobmagic.db`); thin repository layer so call sites are storage-agnostic (swap to Postgres later). Tables: `job_requisitions`, `jobs`, `candidates`, `seeker_profiles`, `candidate_matches`, `pipeline_cards`, `applications`, `outreach_messages`, `audit_log`. A deterministic **seed** populates demo jobs, seekers, and a requisition so every screen has content with no API key. If `better-sqlite3` is unavailable at runtime, the repository falls back to an in-memory store seeded identically (keeps CI/build green).

## 8. Security, privacy, audit

- Server-only secrets; zod validation on every API input and every AI/source output.
- Provenance (`source`, `source_id`, `sourced_at`) on every candidate; per-record delete.
- `audit_log` entry on every state transition (stage moves, outreach drafted/sent, application submitted).
- No outbound email send in MVP — drafts are stored and logged; sending is an explicit, gated future step.

## 9. Tech stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · zod · better-sqlite3 · @anthropic-ai/sdk · **LangGraph.js (`@langchain/langgraph`) + `@langchain/anthropic` for the agent layer** · lucide-react. Test: the built-in `node --test` runner (via `tsx`) for domain logic.
