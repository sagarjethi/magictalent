/**
 * Jobmagic domain contracts — the single source of truth every module codes against.
 * Owned by the Principal Engineer. Changes here are `[contract]` changes (team-wide review).
 *
 * Everything crossing a boundary (API, AI output, source data, DB row) is validated by these
 * zod schemas. Inferred TS types are exported for use across the app.
 */
import { z } from 'zod';

/* ─────────────────────────── Shared enums ─────────────────────────── */

export const SeniorityLevel = z.enum(['intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'lead']);
export type SeniorityLevel = z.infer<typeof SeniorityLevel>;

export const SourceType = z.enum(['github', 'internal-pool', 'linkedin', 'naukri', 'manual']);
export type SourceType = z.infer<typeof SourceType>;

/** Recruiter pipeline = the 7-stage hiring life cycle (Identify→Onboard) + Rejected. */
export const PipelineStage = z.enum([
  'Sourced',     // attracted / sourced
  'Screening',   // screen
  'Interview',   // interview
  'Selected',    // select
  'Hired',       // hire
  'Onboarding',  // onboard
  'Rejected',
]);
export type PipelineStage = z.infer<typeof PipelineStage>;

/** Seeker-side application status (the candidate's view of the same lifecycle). */
export const ApplicationStatus = z.enum(['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn']);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export const ResultMode = z.enum(['ai', 'heuristic']);
export type ResultMode = z.infer<typeof ResultMode>;

/* ─────────────────────────── Job / requisition ─────────────────────────── */

/** Structured search spec parsed from a raw JD. Symmetric counterpart of CandidateProfile. */
export const JobSpec = z.object({
  title: z.string(),
  seniority: SeniorityLevel,
  mustHaveSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  minYearsExperience: z.number().int().min(0).max(50).default(0),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  summary: z.string().default(''),
});
export type JobSpec = z.infer<typeof JobSpec>;

export const Job = z.object({
  id: z.string(),
  spec: JobSpec,
  company: z.string(),
  rawDescription: z.string().default(''),
  salaryRange: z.string().optional(),
  postedAt: z.string(), // ISO
  source: SourceType.default('manual'),
});
export type Job = z.infer<typeof Job>;

export const Requisition = z.object({
  id: z.string(),
  spec: JobSpec,
  company: z.string(),
  rawDescription: z.string().default(''),
  status: z.enum(['draft', 'open', 'closed']).default('open'),
  createdAt: z.string(),
  ownerId: z.string().default('recruiter-demo'),
});
export type Requisition = z.infer<typeof Requisition>;

/* ─────────────────────────── Candidate / seeker ─────────────────────────── */

export const ExperienceItem = z.object({
  title: z.string(),
  company: z.string().default(''),
  years: z.number().min(0).max(50).default(0),
  highlights: z.array(z.string()).default([]),
});
export type ExperienceItem = z.infer<typeof ExperienceItem>;

/** A candidate as the matcher sees them. Symmetric counterpart of JobSpec. */
export const CandidateProfile = z.object({
  id: z.string(),
  name: z.string(),
  headline: z.string().default(''),
  skills: z.array(z.string()).default([]),
  seniority: SeniorityLevel.default('mid'),
  yearsExperience: z.number().min(0).max(50).default(0),
  location: z.string().optional(),
  openToRemote: z.boolean().default(true),
  experience: z.array(ExperienceItem).default([]),
  summary: z.string().default(''),
  // Provenance — every candidate is traceable.
  source: SourceType,
  sourceId: z.string(),
  sourceUrl: z.string().optional(),
  sourcedAt: z.string(),
});
export type CandidateProfile = z.infer<typeof CandidateProfile>;

/** A platform job-seeker's own profile (also exposed to recruiters via the internal-pool source). */
export const SeekerProfile = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().default(''),
  rawResume: z.string().default(''),
  profile: CandidateProfile, // the parsed, matcher-ready view
  createdAt: z.string(),
});
export type SeekerProfile = z.infer<typeof SeekerProfile>;

/* ─────────────────────────── Matching (the shared brain) ─────────────────────────── */

export const MatchBreakdown = z.object({
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  keywords: z.number().min(0).max(100),
  seniority: z.number().min(0).max(100),
});
export type MatchBreakdown = z.infer<typeof MatchBreakdown>;

export const MatchResult = z.object({
  overall: z.number().min(0).max(100),
  breakdown: MatchBreakdown,
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  reasoning: z.string().default(''),
  mode: ResultMode,
});
export type MatchResult = z.infer<typeof MatchResult>;

/** A candidate ranked against a job (recruiter view). */
export const RankedCandidate = z.object({ candidate: CandidateProfile, match: MatchResult });
export type RankedCandidate = z.infer<typeof RankedCandidate>;

/** A job ranked against a candidate (seeker view). */
export const RankedJob = z.object({ job: Job, match: MatchResult });
export type RankedJob = z.infer<typeof RankedJob>;

/* ─────────────────────────── ATS ─────────────────────────── */

export const AtsReport = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.object({
    severity: z.enum(['high', 'medium', 'low']),
    message: z.string(),
    fix: z.string(),
  })).default([]),
  strengths: z.array(z.string()).default([]),
  mode: ResultMode,
});
export type AtsReport = z.infer<typeof AtsReport>;

/* ─────────────────────────── Pipeline / applications / outreach ─────────────────────────── */

export const PipelineCard = z.object({
  id: z.string(),
  requisitionId: z.string(),
  candidate: CandidateProfile,
  match: MatchResult,
  stage: PipelineStage,
  notes: z.string().default(''),
  updatedAt: z.string(),
});
export type PipelineCard = z.infer<typeof PipelineCard>;

export const Application = z.object({
  id: z.string(),
  seekerId: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  status: ApplicationStatus,
  coverLetter: z.string().default(''),
  appliedAt: z.string(),
});
export type Application = z.infer<typeof Application>;

export const OutreachMessage = z.object({
  id: z.string(),
  candidateId: z.string(),
  requisitionId: z.string(),
  subject: z.string(),
  body: z.string(),
  status: z.enum(['draft', 'sent']).default('draft'),
  mode: ResultMode,
  createdAt: z.string(),
});
export type OutreachMessage = z.infer<typeof OutreachMessage>;

/* ─────────────────────────── Agents ─────────────────────────── */

export const AgentStep = z.object({
  step: z.number().int(),
  tool: z.string(),
  summary: z.string(),
  detail: z.string().default(''),
});
export type AgentStep = z.infer<typeof AgentStep>;

export const AuditEntry = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string(),
  at: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;

/* ─────────────────────────── API envelope ─────────────────────────── */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; details?: unknown };
export type ApiResponse<T> = ApiOk<T> | ApiErr;
