# Jobmagic — Team Roles & Orchestration

How a six-role engineering team (run as coordinated agents) builds Jobmagic to a production standard, and how the Principal Engineer reviews every piece.

## 1. Roles

| # | Role | Owns | Mandate |
|---|---|---|---|
| 1 | **Principal Engineer** (orchestrator) | `docs/`, foundation contracts (`src/lib/domain`, `src/lib/ai`, `src/lib/db`, `src/lib/sources` interfaces), final review | Define interfaces first; review every deliverable against the checklist; own build/verify. |
| 2 | **UI Expert** (ex-Airbnb/Google caliber) | Design system (`src/components/ui`), `globals.css`, Tailwind theme, landing page | A distinctive, polished, consistent visual language. Reusable primitives. No generic AI aesthetic. |
| 3 | **UX Engineer** | Information architecture, navigation, page states (empty/loading/error), copy, accessibility | Every flow obvious; every state designed; AA accessible; honest, helpful microcopy. |
| 4 | **Frontend Senior** | Portal pages (`src/app/(seeker)`, `src/app/(recruiter)`), data wiring | Implement both portals against API contracts using the design system. Server components for data. |
| 5 | **Backend Senior** | Matching engine (`src/lib/matching`), agents (`src/lib/agents`), source adapters impl, API routes (`src/app/api`) | The shared brain, the agentic loops, the source pipeline, typed API handlers. |
| 6 | **Backend Junior** | DB layer (`src/lib/db` impl + repositories), seed data, simple CRUD routes | Schema, repositories, deterministic seed, audit log writes. Mentored by Backend Senior via contracts. |

## 2. Orchestration model

```
Principal: write docs  ─►  Principal: build foundation/contracts (types, ai, db schema, adapter ifaces)
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼ (parallel, disjoint files)                     ▼
        Backend Senior: matching + agents + API     UI Expert: design system + landing
        Backend Junior: db impl + seed + CRUD       UX: states/a11y/copy guidance (baked into FE prompt)
                  └───────────────────────┬───────────────────────┘
                                          ▼
                          Frontend Senior: portal pages (needs API + design system)
                                          ▼
                          Principal Engineer: review + fix + verify build
```

**Conflict avoidance:** each agent owns disjoint files/directories. Only the Principal touches `package.json`, configs, and the shared contract files. Agents add files within their directories and never change dependencies. Anything cross-cutting is decided in the contracts before fan-out.

**Contracts before code:** the Principal lands `src/lib/domain/*` (zod schemas + types) and the interface files (`SourceAdapter`, `AiClient`, repository signatures) *first*, so parallel agents code against stable, typed boundaries.

## 3. Definition of Done per deliverable

- Compiles under `tsc --noEmit`; no `any` at exported boundaries.
- Inputs validated with zod at every external boundary (API, AI output, source data).
- Pure/domain logic is unit-testable and has at least smoke tests.
- UI: every state (empty/loading/error/success) handled; keyboard accessible; uses design-system primitives only.
- AI: wrapped with retry + JSON-repair + heuristic fallback; result labels its mode.

## 4. Principal Engineer review checklist

Applied to the whole codebase before sign-off:

1. **Contracts honored** — every module matches the interface in `src/lib/domain` / interface files.
2. **Type safety** — `npm run type-check` clean; no boundary `any`; zod guards external data.
3. **Two-sided symmetry** — the same `matching` engine powers both seeker and recruiter; no divergent scoring.
4. **Graceful degradation** — app fully works with no `ANTHROPIC_API_KEY`; AI failures never crash a request.
5. **Security/privacy** — secrets server-only; provenance + audit on records; no outbound send without explicit action.
6. **Error handling** — API routes return typed errors; UI shows friendly error states.
7. **Accessibility & polish** — semantic HTML, labels, focus states, consistent design tokens.
8. **Build** — `npm run build` succeeds.

A deliverable that fails any item is sent back with specific, technical feedback (no rubber-stamping).

## 5. Communication artifacts

- **Tags/labels** the whole team watches: `[contract]` (interface change — needs Principal sign-off), `[blocked]`, `[review]`, `[done]`. Surfaced in PR-style summaries returned by each agent.
- Each agent returns a structured report: what it built, files touched, contracts honored, open risks, and any `[contract]`/`[blocked]` flags for the Principal.
