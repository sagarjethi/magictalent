# Jobmagic — Product Roadmap & Future Functionality

What Jobmagic is today (MVP, shipped & verified) and the product it grows into. This is the
"intone product" vision: one coherent, AI-native hiring OS where every capability reinforces the
**shared explainable brain** and the **7-stage lifecycle**.

---

## 0. Proven today (MVP — live & verified)

Captured from the running app (Next.js :3000 + NestJS :4000, heuristic mode, seeded data):

- **Landing** — two-sided value prop, live match card (ScoreRing 92 + breakdown + ModeBadge), agent activity.
- **Recruiter › Find** — the **Sourcing Agent** runs a transparent 3-step LangGraph trace (parse_jd → search_sources: 18 candidates across internal-pool + GitHub → score_candidates: shortlist 10, top 96/100), each candidate with provenance, ScoreRing, breakdown, Save-to-pipeline & Draft-outreach.
- **Seeker › Jobs** — feed ranked by the *same* engine; explicit "the number you see is the number a recruiter sees for this exact pairing."
- **Plus**: Requisitions (JD→spec), Pipeline (7-stage Kanban), Outreach, Analytics, Seeker Profile/ATS/Applications/Career Copilot.
- **Everywhere**: a `ModeBadge` (AI vs Heuristic) — honesty as a feature.

---

## 1. Roadmap themes

### Theme A — Make the shared brain smarter
| Feature | Why | Notes |
|---|---|---|
| **Embeddings-based semantic match** | Skill synonyms ("RN"≈"React Native"), JD prose understanding | Add a vector layer behind `scoreMatch`; keep the deterministic breakdown, add a `semantic` sub-score. Degrades to keyword overlap with no key. |
| **Learned ranking from outcomes** | Pipeline stage advances + hires are labels | Re-weight breakdown per role-family from historical `audit_log` + `pipeline_cards`. |
| **Bias & fairness guardrails** | Trust + compliance | Blind-mode (hide name/photo/school during screen), adverse-impact report on shortlists. |
| **Explainability v2** | Deeper "why" | Per-skill evidence links (the repo/line/bullet that earned the score). |

### Theme B — Close the lifecycle loop (stages 4–7)
| Feature | Why |
|---|---|
| **Interview kit generator (agent)** | Stage 4: tailored questions + scorecards from the JobSpec + candidate gaps |
| **Structured scorecards + panel sync** | Stage 4–5: collect interviewer feedback, aggregate into the match view |
| **Offer builder + e-sign** | Stage 6: salary bands, approval chain, audit trail |
| **Onboarding checklists + handoff** | Stage 7: convert a hire into an onboarding plan; close the requisition |
| **Reference & background check intake** | Stage 5–6: consented, provenance-tracked |

### Theme C — More & better sources (ethical)
- Additional **opt-in** adapters behind the proven `SourceAdapter` interface: Stack Overflow, public portfolios, ATS imports (Greenhouse/Lever), referral links, talent CRM import.
- **Inbound applications** → candidates flow straight into the same pipeline + scoring.
- Keep the hard line: **no scraping of gated networks**; licensed APIs only, always provenance-tagged.

### Theme D — Agentic depth (LangGraph)
- **Outreach Sequencer agent** — multi-touch cadence (+3/+7/+14d), reply-intent classification, auto stage advance — with human approval gates before each send.
- **Career Copilot v2** — long-horizon plan: skill-gap → learning resources → mock interview → application tracking; memory across sessions.
- **Recruiter Copilot** — "who should I talk to today," pipeline triage, JD quality critique.
- **Multi-agent review** — a second LangGraph agent adversarially audits the first's shortlist for missed candidates / unjustified scores (the "completeness critic" pattern).

### Theme E — Platform & trust
| Feature | Why |
|---|---|
| **Real auth + multi-tenant (orgs, roles)** | Replace the demo current-user; RBAC for recruiter/hiring-manager/admin |
| **Postgres + the documented repository swap** | `schema.sql` already mirrors prod; flip the repo impl, call sites unchanged |
| **Real email/calendar integration** | Send (with unsubscribe + sender identity, CAN-SPAM), schedule interviews |
| **Audit & compliance center** | GDPR/DPDP delete, consent ledger, exportable audit log (already write-logged) |
| **Notifications + real-time** | Reply received, stage moved, agent finished |
| **Analytics v2** | Time-to-hire, source ROI, funnel drop-off, diversity dashboards |

### Theme F — Quality & delivery
- **Test pyramid**: unit (matching/parsers — node:test in place), API contract tests, Playwright E2E across both portals.
- **CI/CD**: typecheck + build + tests on PR; preview deploys (Vercel for web, container for the Nest API).
- **Observability**: structured logs, agent step tracing exported, token/cost metering for AI mode.
- **Design system v2**: dark mode, Storybook, motion polish, mobile layouts.

---

## 2. Sequenced waves (suggested)

1. **Wave 1 — Trust & loop**: blind-mode + fairness report, interview kit agent, scorecards. *(High value, uses existing brain.)*
2. **Wave 2 — Reach**: ATS import + inbound applications + Stack Overflow adapter; Outreach Sequencer agent.
3. **Wave 3 — Platform**: auth/multi-tenant, Postgres swap, real email/calendar, notifications.
4. **Wave 4 — Intelligence**: embeddings semantic match, learned ranking, multi-agent review, analytics v2.
5. **Wave 5 — Polish**: E2E tests, CI/CD, observability, dark mode + mobile.

Each wave keeps the two invariants: **one explainable brain, both directions** and **graceful degradation** (every AI feature has a heuristic fallback and labels its mode).

---

## 3. The product I'd want this to be

A **hiring operating system** a seeker and a recruiter can both trust because they literally share
the same math. The agent does the tedious work (sourcing, drafting, scheduling, tracking) and shows
its reasoning every step; the human keeps every irreversible decision. No black boxes, no dark
patterns, provenance on everything — and it still works when the network and the API key are gone.
