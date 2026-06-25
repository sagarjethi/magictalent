# Jobmagic — Product Specification

> **One-liner:** An AI-first, agentic recruitment platform with two sides — job seekers find and win the right roles, recruiters source and hire the right people — sharing one explainable matching brain.

Status: v1 (MVP) spec. Owner: Principal Engineer. Audience: the build team (see `TEAM_AND_ORCHESTRATION.md`).

---

## 1. Vision

Most recruitment tools serve one side and treat AI as a bolt-on. Jobmagic is **two-sided** and **AI-native**: the same matching engine that ranks candidates for a recruiter also ranks jobs for a seeker, so both sides see the *same explainable score* and trust it. Every heavy action (parse a JD, score a candidate, draft outreach, tailor a resume) is an **agentic step** that a human reviews and approves — "confirmation over magic."

## 2. Personas

| Persona | Goal | Pain today |
|---|---|---|
| **Sam, Job Seeker** | Find roles that actually fit; apply with a tailored, ATS-safe resume; track applications | Spray-and-pray applications; no feedback; generic resumes get filtered |
| **Riya, Recruiter** | Source real candidates from a JD; rank by fit; reach out; manage a pipeline | Manual sourcing; opaque scores; copy-paste outreach; scattered tracking |
| **Principal/Admin** | Trust the system end-to-end | Black-box AI, no provenance, no audit |

## 3. The two journeys

### 3.1 Job Seeker journey
1. **Build profile** — paste/upload resume → AI parses into a structured profile (skills, experience, seniority).
2. **ATS check** — AI scores the resume's ATS-readiness (0–100) with concrete fixes.
3. **Discover jobs** — a feed of roles, each with a **match score** + "why this fits / gaps."
4. **Tailor & apply** — AI drafts a tailored summary + cover letter for a chosen job; seeker edits & applies.
5. **Track** — application status board (Applied → Screening → Interview → Offer).
6. **Career Copilot (agent)** — a chat agent that uses the seeker's profile to answer "what should I improve / which jobs / how do I tailor this."

### 3.2 Recruiter journey
1. **Create requisition** — paste a JD → AI parses into a structured search spec; recruiter confirms.
2. **Source (agentic)** — one click runs the **Sourcing Agent**: parse → fan out to sources (GitHub + internal seeker pool) → normalize → dedupe → match/rank.
3. **Review matches** — ranked candidate cards with explainable score (skills/experience/keyword breakdown), strengths, gaps.
4. **Pipeline** — save fits to a Kanban CRM (Sourced → Contacted → Screening → Interview → Hired).
5. **Outreach** — AI drafts a personalized first-touch message; recruiter edits & sends (logged).
6. **Analytics** — sourcing→hire funnel, reply rate, source quality.

## 4. The shared brain (why two-sided matters)

A single `matching` engine scores a `(JobSpec, CandidateProfile)` pair and returns a symmetric, explainable `MatchResult`. The recruiter view ranks candidates for one job; the seeker view ranks jobs for one candidate. **Same math, same explanation, both directions.** This is the product's core defensibility.

## 5. AI-first & agentic principles

- **Every AI output is structured + explainable** — never an unexplained number. Score breakdowns, strengths, gaps, reasoning.
- **Graceful degradation** — if no AI provider key is configured, every AI feature falls back to a deterministic heuristic (keyword/skills overlap, rule-based parsing) so the product is fully usable offline and in CI. The UI labels which mode produced a result.
- **Agentic loops with human approval** — the Sourcing Agent and Career Copilot run multi-step tool-using loops, but state-changing actions (send outreach, submit application) require explicit human confirmation.
- **Provenance + audit** — every candidate/job record carries its source and timestamp; every state change writes to an audit log.

## 6. MVP scope (what we build now)

**In:** two portals, shared matching engine (heuristic + AI), JD parser, resume parser, ATS scorer, job/candidate feeds with scores, AI outreach + cover-letter drafting, pipeline Kanban, application tracker, Sourcing Agent, Career Copilot, GitHub + internal-pool source adapters, SQLite persistence with seed data, audit log, full API layer, landing page.

**Out (explicitly):** real auth/multi-tenant (use a mock current-user/role switch), real email sending (draft + log only), LinkedIn scraping (gated/off — legal), payments, mobile apps.

## 7. Non-functional requirements

- **Code standard:** TypeScript strict, zod-validated boundaries, server-only secrets, no `any` at module boundaries, every domain module independently testable.
- **Reliability:** AI calls wrapped with retry + robust JSON parsing + heuristic fallback; API routes validate input and return typed errors.
- **Accessibility:** keyboard-navigable, semantic HTML, labelled controls, visible focus, color-contrast AA.
- **Performance:** server components for data, client components only where interactive; no blocking AI call on first paint.
- **Privacy:** provenance retained; per-record delete; no sending without explicit action.

## 8. Success criteria (definition of done)

1. `npm run build` and `npm run type-check` pass clean.
2. Both portals are navigable and functional end-to-end with **no API key set** (heuristic mode) using seeded data.
3. The shared matching engine produces identical explainable scores in both directions.
4. The Sourcing Agent and Career Copilot run and return reviewed output.
5. Principal Engineer review checklist (in `TEAM_AND_ORCHESTRATION.md`) passes.
