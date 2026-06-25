# Jobmagic API (NestJS)

Standalone NestJS backend hosting Jobmagic's domain logic — the shared matching brain,
multi-source candidate pipeline, LangGraph agents, and the full REST surface. The Next.js
app (`../jobmagic-web`) calls this service; its own `/api` routes remain as a fallback.

**Graceful degradation:** the service runs fully with **no API keys**. Every AI feature
falls back to a deterministic heuristic (tagged `mode:'heuristic'`), and the LangGraph
agents run a deterministic policy over the same tool graph. Seeded in-memory data means
every endpoint returns content out of the box.

## Run

```bash
cp .env.example .env      # optional — all values are optional
npm install
npm run build
npm run start             # node dist/main  → http://localhost:4000/api
# or: npm run start:dev   # watch mode
```

### Configuration (all optional)

| Env | Purpose | Default |
|-----|---------|---------|
| `ANTHROPIC_API_KEY` | Enables Claude for AI features + agents | unset → heuristic |
| `AI_MODEL` | Model id | `claude-sonnet-4-6` |
| `GITHUB_TOKEN` | Live GitHub sourcing | unset → offline sample |
| `PORT` | HTTP port | `4000` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:3000` |

## `@/` import resolution

The ported domain logic and the Nest layer use **relative imports** (e.g. `../lib/...`),
so the compiled `dist/` runs under plain Node module resolution with **no path-alias loader
required** — `node dist/main` just works. The `@/* → src/*` alias remains in `tsconfig.json`
for editor/DX only. (The `server-only` Next package was stripped during the port.)

## Endpoints

All under the global prefix `/api`. Every response is the `ApiResponse<T>` envelope:
`{ ok: true, data }` or `{ ok: false, error }`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + capability mode (ai/heuristic) |
| GET | `/jobs` | List seeker-facing jobs |
| GET / POST | `/requisitions` | List / create (parses JD → JobSpec) |
| POST | `/match` | Score a (job, candidate) pair; `enrich` adds AI narrative |
| POST | `/source` | Quick non-agent sourcing (adapters + rank) |
| GET / POST | `/pipeline` | List / upsert+move pipeline cards |
| GET / POST / PATCH | `/applications` | List / create / update status |
| GET / POST | `/outreach` | List / draft outreach |
| GET / POST | `/seeker/profile` | Get/list / upsert (parses resume) |
| POST | `/ats` | Score resume ATS-readiness |
| POST | `/agent/sourcing` | Run the LangGraph Sourcing Agent (trace + shortlist) |
| POST | `/agent/copilot` | Run the LangGraph Career Copilot (trace + answer) |
| GET | `/audit` | Read the audit log |

### Example

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/jobs
curl -X POST http://localhost:4000/api/agent/copilot \
  -H 'content-type: application/json' \
  -d '{"seekerId":"<id>","question":"Which jobs fit me?"}'
```

## Architecture

- `src/lib/**` — ported domain logic (identical to `jobmagic-web`): `domain`, `ai`, `db`,
  `sources`, `matching`, `agents`.
- `src/core/**` — `@Injectable` services (`RepoService`, `MatchingService`, `SourcingService`,
  `AgentsService`) provided by a global `CoreModule` for DI.
- `src/modules/**` — one controller per resource, mirroring the Next.js routes.
- `src/common/**` — `ApiResponse` helpers + zod validation + a global exception filter that
  guarantees the error envelope shape.
