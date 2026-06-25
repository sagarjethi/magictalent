# Magictalent — Jobmagic

> **An AI-first, agentic recruitment platform with two sides** — job seekers find and win the right roles, recruiters source and hire the right people — sharing **one explainable matching brain**.

Built by a coordinated six-role engineering team (UI Expert, UX, Frontend Senior, Backend Senior, Backend Junior, and a Principal Engineer who designed the contracts and reviewed every deliverable). See [`docs/`](./web/docs) for the full product spec, architecture, and the team/orchestration model.

## Monorepo layout

```
magictalent/
├── web/    Next.js 14 (App Router) frontend — both portals + a fallback API layer
├── api/    NestJS backend — matching engine, LangGraph agents, sources, persistence
└── docs/   Product spec · Architecture · Team & orchestration
```

## What it does

**The 7-stage recruitment lifecycle** (Identify → Attract → Screen → Interview → Select → Hire → Onboard) is the product backbone — every recruiter pipeline column and analytics funnel maps to it.

- **Job Seeker portal** — resume parsing, ATS readiness scoring, an explainable job feed, AI-tailored cover letters, application tracking, and a **Career Copilot** agent.
- **Recruiter portal** — JD → structured spec, a **Sourcing Agent** that fans out across sources, explainable ranked shortlists, a 7-stage pipeline (CRM), AI outreach drafting, and analytics.
- **The shared brain** — one deterministic, explainable `scoreMatch(job, candidate)` powers both directions, so a seeker sees the *same* score a recruiter sees for the same pairing.

## AI-first, agentic, and honest

- **Agents** are built on **LangGraph.js** (`@langchain/langgraph`) with **`@langchain/anthropic`** (Claude) as the model provider — real stateful tool-using graphs.
- **Graceful degradation** — every AI feature falls back to a deterministic heuristic when no `ANTHROPIC_API_KEY` is set, so the whole product is usable offline and in CI. A `ModeBadge` always tells you whether a result came from AI or the heuristic.
- **Trust by default** — provenance + audit on every record, explainable score breakdowns, no LinkedIn scraping, no sending without explicit action.

## Tech stack

**Frontend:** Next.js 14 · React 18 · TypeScript (strict) · Tailwind CSS · zod · lucide-react
**Backend:** NestJS 10 · TypeScript (strict) · zod · LangGraph.js + `@langchain/anthropic` · `@anthropic-ai/sdk` · better-sqlite3 (with in-memory fallback + deterministic seed)

## Quick start

```bash
# Backend (NestJS) — http://localhost:4000
cd api && npm install && npm run start   # GET /api/health, /api/jobs, ...

# Frontend (Next.js) — http://localhost:3000
cd web && npm install
# optional: point the UI at the Nest backend
echo "NEXT_PUBLIC_API_BASE=http://localhost:4000" >> .env.local
npm run dev
```

Both apps run fully **without any API key** on deterministic seed data. Set `ANTHROPIC_API_KEY` (and optionally `GITHUB_TOKEN`) to switch AI features from heuristic to live.

## Standards & review

TypeScript strict, zod-validated boundaries, server-only secrets, accessible UI (AA), and a Principal Engineer review checklist (in [`docs/TEAM_AND_ORCHESTRATION.md`](./web/docs/TEAM_AND_ORCHESTRATION.md)) applied before sign-off.
