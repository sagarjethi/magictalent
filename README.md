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

- **Job Seeker portal** — resume parsing, ATS readiness scoring, an explainable job feed, AI-tailored cover letters, application tracking, a **Career Copilot** agent, **Recruiter Interest** (the two-way flywheel), interview prep, and **My Interviews** (join browser video calls + read the debrief).
- **Recruiter portal** — JD → structured spec, a **Sourcing Agent** that fans out across sources, explainable ranked shortlists, a 7-stage pipeline (CRM), AI outreach drafting, interview kits, **Video Interviews**, and analytics.
- **Video Interviews (end-to-end)** — schedule a browser-based interview, notify the candidate by **email / SMS / in-app**, run the call in-browser with **MediaRecorder chunked upload** + **live speech-to-text transcription**, then generate a structured **AI interview debrief** (competency scores, recommendation, strengths/concerns) from the transcript. Email/SMS gracefully *simulate* until a provider is configured.
- **The shared brain** — one deterministic, explainable `scoreMatch(job, candidate)` powers both directions, so a seeker sees the *same* score a recruiter sees — and the *same* interview debrief, from their own side.

## AI-first, agentic, and honest

- **Agents** are built on **LangGraph.js** (`@langchain/langgraph`) with real stateful tool-using graphs.
- **Pluggable, fully-configurable model provider** — set `AI_PROVIDER` to **`xai`** (Grok, OpenAI-compatible) or **`anthropic`** (Claude), or leave it on `auto` to use whichever key is present. Model, base URL, and token cap are all env-configurable (`XAI_MODEL`, `ANTHROPIC_MODEL`, `AI_MODEL`, `XAI_BASE_URL`, `AI_MAX_TOKENS`). Both the JSON path and the tool-calling graph honor the same selection. xAI needs no SDK (uses the OpenAI-compatible HTTP API); Anthropic uses `@anthropic-ai/sdk`.
- **Graceful degradation** — every AI feature falls back to a deterministic heuristic when no provider key is set, so the whole product is usable offline and in CI. A `ModeBadge` always tells you whether a result came from AI or the heuristic.
- **Trust by default** — provenance + audit on every record, explainable score breakdowns, no LinkedIn scraping, no sending without explicit action.

## Tech stack

**Frontend:** Next.js 14 · React 18 · TypeScript (strict) · Tailwind CSS · zod · lucide-react
**Backend:** NestJS 10 · TypeScript (strict) · zod · LangGraph.js + `@langchain/anthropic` / `@langchain/openai` (xAI) · `@anthropic-ai/sdk` · better-sqlite3 (with in-memory fallback + deterministic seed)
**AI:** pluggable provider — xAI/Grok (OpenAI-compatible HTTP) or Anthropic/Claude · browser **MediaRecorder** + **Web Speech API** for video interview capture

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

Both apps run fully **without any API key** on deterministic seed data. To switch AI features from heuristic to live, set a provider in `.env.local` (web) / `.env` (api):

```bash
# xAI / Grok (recommended; OpenAI-compatible, no SDK needed)
AI_PROVIDER=xai
XAI_API_KEY=xai-...
XAI_MODEL=grok-4.3
# …or Anthropic
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-...
```

See `.env.example` for the full set (provider, model, base URL, token cap, invite providers, GitHub token).

## Standards & review

TypeScript strict, zod-validated boundaries, server-only secrets, accessible UI (AA), and a Principal Engineer review checklist (in [`docs/TEAM_AND_ORCHESTRATION.md`](./web/docs/TEAM_AND_ORCHESTRATION.md)) applied before sign-off.
