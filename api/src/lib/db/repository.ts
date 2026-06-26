/**
 * Repository contract — the storage-agnostic boundary every API route and service uses.
 * Implementation (SQLite + in-memory fallback + seed) is provided by `./index.ts`.
 * Owned as a `[contract]` by the Principal Engineer; implemented by the Backend Junior.
 */
import type {
  Requisition, Job, CandidateProfile, SeekerProfile,
  PipelineCard, Application, OutreachMessage, AuditEntry, PipelineStage, ApplicationStatus,
} from '../domain/types';

export interface Repository {
  // Requisitions
  listRequisitions(): Requisition[];
  getRequisition(id: string): Requisition | undefined;
  createRequisition(r: Requisition): Requisition;

  // Jobs (seeker-facing listings)
  listJobs(): Job[];
  getJob(id: string): Job | undefined;

  // Seekers (also the internal-pool candidate source)
  listSeekers(): SeekerProfile[];
  getSeeker(id: string): SeekerProfile | undefined;
  upsertSeeker(s: SeekerProfile): SeekerProfile;
  /** CandidateProfiles drawn from the platform's own seekers, for recruiter sourcing. */
  internalCandidatePool(): CandidateProfile[];

  // Pipeline (recruiter CRM, 7-stage lifecycle)
  listPipeline(requisitionId?: string): PipelineCard[];
  upsertPipelineCard(c: PipelineCard): PipelineCard;
  movePipelineCard(id: string, stage: PipelineStage): PipelineCard | undefined;

  // Applications (seeker tracker)
  listApplications(seekerId?: string): Application[];
  createApplication(a: Application): Application;
  setApplicationStatus(id: string, status: ApplicationStatus): Application | undefined;

  // Outreach
  listOutreach(requisitionId?: string): OutreachMessage[];
  createOutreach(m: OutreachMessage): OutreachMessage;

  /**
   * The two-way flywheel: recruiter interest in a platform seeker — pipeline cards and
   * outreach that target this seeker's own candidate profile. Empty if no recruiter has engaged.
   */
  interestForSeeker(seekerId: string): { cards: PipelineCard[]; outreach: OutreachMessage[] };

  // Audit
  listAudit(limit?: number): AuditEntry[];
  audit(entry: Omit<AuditEntry, 'id' | 'at'>): AuditEntry;
}
