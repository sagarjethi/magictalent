-- Jobmagic — reference DDL for the production persistence target.
--
-- This file documents the SQLite / Postgres schema described in
-- docs/ARCHITECTURE.md §7. It is NOT executed by the app: the MVP uses the
-- in-memory store in store.ts. Structured object fields (JobSpec, MatchResult,
-- experience[], etc.) are stored as JSON text columns; enums are CHECK-constrained.
--
-- Tables: job_requisitions, jobs, candidates, seeker_profiles,
--         candidate_matches, pipeline_cards, applications,
--         outreach_messages, audit_log.

PRAGMA foreign_keys = ON;

-- ─────────────────────────── Requisitions ───────────────────────────
CREATE TABLE IF NOT EXISTS job_requisitions (
  id              TEXT PRIMARY KEY,
  company         TEXT NOT NULL,
  spec            TEXT NOT NULL,                 -- JSON: JobSpec
  raw_description TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('draft', 'open', 'closed')),
  owner_id        TEXT NOT NULL DEFAULT 'recruiter-demo',
  created_at      TEXT NOT NULL                  -- ISO 8601
);

-- ─────────────────────────── Jobs (seeker-facing listings) ───────────
CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT PRIMARY KEY,
  company         TEXT NOT NULL,
  spec            TEXT NOT NULL,                 -- JSON: JobSpec
  raw_description TEXT NOT NULL DEFAULT '',
  salary_range    TEXT,
  source          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('github', 'internal-pool', 'linkedin', 'naukri', 'manual')),
  posted_at       TEXT NOT NULL                  -- ISO 8601
);

-- ─────────────────────────── Candidates (sourced profiles) ───────────
CREATE TABLE IF NOT EXISTS candidates (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  headline         TEXT NOT NULL DEFAULT '',
  skills           TEXT NOT NULL DEFAULT '[]',   -- JSON: string[]
  seniority        TEXT NOT NULL DEFAULT 'mid'
                     CHECK (seniority IN ('intern','junior','mid','senior','staff','principal','lead')),
  years_experience REAL NOT NULL DEFAULT 0,
  location         TEXT,
  open_to_remote   INTEGER NOT NULL DEFAULT 1,   -- boolean (0/1)
  experience       TEXT NOT NULL DEFAULT '[]',   -- JSON: ExperienceItem[]
  summary          TEXT NOT NULL DEFAULT '',
  -- Provenance
  source           TEXT NOT NULL
                     CHECK (source IN ('github','internal-pool','linkedin','naukri','manual')),
  source_id        TEXT NOT NULL,
  source_url       TEXT,
  sourced_at       TEXT NOT NULL,                -- ISO 8601
  UNIQUE (source, source_id)
);

-- ─────────────────────────── Seeker profiles ─────────────────────────
CREATE TABLE IF NOT EXISTS seeker_profiles (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL DEFAULT '',
  raw_resume   TEXT NOT NULL DEFAULT '',
  candidate_id TEXT NOT NULL,                    -- FK -> candidates.id (parsed view)
  created_at   TEXT NOT NULL,                    -- ISO 8601
  FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
);

-- ─────────────────────────── Match snapshots ─────────────────────────
CREATE TABLE IF NOT EXISTS candidate_matches (
  id           TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,                    -- FK -> candidates.id
  target_id    TEXT NOT NULL,                    -- requisition or job id
  overall      REAL NOT NULL CHECK (overall BETWEEN 0 AND 100),
  breakdown    TEXT NOT NULL,                    -- JSON: MatchBreakdown
  strengths    TEXT NOT NULL DEFAULT '[]',       -- JSON: string[]
  gaps         TEXT NOT NULL DEFAULT '[]',       -- JSON: string[]
  reasoning    TEXT NOT NULL DEFAULT '',
  mode         TEXT NOT NULL CHECK (mode IN ('ai', 'heuristic')),
  created_at   TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
);

-- ─────────────────────────── Pipeline cards (recruiter CRM) ──────────
CREATE TABLE IF NOT EXISTS pipeline_cards (
  id              TEXT PRIMARY KEY,
  requisition_id  TEXT NOT NULL,                 -- FK -> job_requisitions.id
  candidate       TEXT NOT NULL,                 -- JSON: CandidateProfile (denormalized snapshot)
  match           TEXT NOT NULL,                 -- JSON: MatchResult
  stage           TEXT NOT NULL
                    CHECK (stage IN ('Sourced','Screening','Interview','Selected','Hired','Onboarding','Rejected')),
  notes           TEXT NOT NULL DEFAULT '',
  updated_at      TEXT NOT NULL,
  FOREIGN KEY (requisition_id) REFERENCES job_requisitions (id) ON DELETE CASCADE
);

-- ─────────────────────────── Applications (seeker tracker) ───────────
CREATE TABLE IF NOT EXISTS applications (
  id           TEXT PRIMARY KEY,
  seeker_id    TEXT NOT NULL,                    -- FK -> seeker_profiles.id
  job_id       TEXT NOT NULL,
  job_title    TEXT NOT NULL,
  company      TEXT NOT NULL,
  status       TEXT NOT NULL
                 CHECK (status IN ('Applied','Screening','Interview','Offer','Hired','Rejected','Withdrawn')),
  cover_letter TEXT NOT NULL DEFAULT '',
  applied_at   TEXT NOT NULL,
  FOREIGN KEY (seeker_id) REFERENCES seeker_profiles (id) ON DELETE CASCADE
);

-- ─────────────────────────── Outreach messages ──────────────────────
CREATE TABLE IF NOT EXISTS outreach_messages (
  id             TEXT PRIMARY KEY,
  candidate_id   TEXT NOT NULL,
  requisition_id TEXT NOT NULL,                  -- FK -> job_requisitions.id
  subject        TEXT NOT NULL,
  body           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'sent')),
  mode           TEXT NOT NULL CHECK (mode IN ('ai', 'heuristic')),
  created_at     TEXT NOT NULL,
  FOREIGN KEY (requisition_id) REFERENCES job_requisitions (id) ON DELETE CASCADE
);

-- ─────────────────────────── Audit log ──────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id     TEXT PRIMARY KEY,
  actor  TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  at     TEXT NOT NULL                           -- ISO 8601
);

-- Helpful indexes for common access patterns.
CREATE INDEX IF NOT EXISTS idx_pipeline_requisition ON pipeline_cards (requisition_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker   ON applications (seeker_id);
CREATE INDEX IF NOT EXISTS idx_outreach_requisition  ON outreach_messages (requisition_id);
CREATE INDEX IF NOT EXISTS idx_audit_at              ON audit_log (at);
