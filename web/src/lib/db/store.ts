/**
 * In-memory implementation of the `Repository` contract.
 *
 * This is the always-works default backing store for the MVP: Map-based,
 * synchronous, zero-config, and seeded deterministically from `seedData()`.
 * Runtime-created records get UUIDs; seed records keep their fixed ids.
 *
 * Owned by the Backend Junior. Implements `@/lib/db/repository`.
 */
import { randomUUID } from 'node:crypto';

import type { Repository } from '@/lib/db/repository';
import { seedData } from '@/lib/db/seed';
import type {
  Application,
  ApplicationStatus,
  AuditEntry,
  CandidateProfile,
  Job,
  OutreachMessage,
  PipelineCard,
  PipelineStage,
  Requisition,
  SeekerProfile,
} from '@/lib/domain/types';

/** Stable ISO clock for mutation timestamps — overridable for deterministic tests. */
function now(): string {
  return new Date().toISOString();
}

export class InMemoryStore implements Repository {
  private requisitions = new Map<string, Requisition>();
  private jobs = new Map<string, Job>();
  private seekers = new Map<string, SeekerProfile>();
  private pipeline = new Map<string, PipelineCard>();
  private applications = new Map<string, Application>();
  private outreach = new Map<string, OutreachMessage>();
  private auditLog: AuditEntry[] = [];

  constructor() {
    this.load(seedData());
  }

  private load(data: ReturnType<typeof seedData>): void {
    for (const r of data.requisitions) this.requisitions.set(r.id, r);
    for (const j of data.jobs) this.jobs.set(j.id, j);
    for (const s of data.seekers) this.seekers.set(s.id, s);
    for (const c of data.pipeline) this.pipeline.set(c.id, c);
    for (const a of data.applications) this.applications.set(a.id, a);
    for (const m of data.outreach) this.outreach.set(m.id, m);
    this.auditLog = [...data.audit];
  }

  /* ── Requisitions ───────────────────────────────────────────── */

  listRequisitions(): Requisition[] {
    return [...this.requisitions.values()];
  }

  getRequisition(id: string): Requisition | undefined {
    return this.requisitions.get(id);
  }

  createRequisition(r: Requisition): Requisition {
    this.requisitions.set(r.id, r);
    return r;
  }

  /* ── Jobs ───────────────────────────────────────────────────── */

  listJobs(): Job[] {
    return [...this.jobs.values()];
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /* ── Seekers / internal candidate pool ──────────────────────── */

  listSeekers(): SeekerProfile[] {
    return [...this.seekers.values()];
  }

  getSeeker(id: string): SeekerProfile | undefined {
    return this.seekers.get(id);
  }

  upsertSeeker(s: SeekerProfile): SeekerProfile {
    this.seekers.set(s.id, s);
    return s;
  }

  internalCandidatePool(): CandidateProfile[] {
    return [...this.seekers.values()].map((s) => s.profile);
  }

  /* ── Pipeline ───────────────────────────────────────────────── */

  listPipeline(requisitionId?: string): PipelineCard[] {
    const all = [...this.pipeline.values()];
    return requisitionId ? all.filter((c) => c.requisitionId === requisitionId) : all;
  }

  upsertPipelineCard(c: PipelineCard): PipelineCard {
    this.pipeline.set(c.id, c);
    return c;
  }

  movePipelineCard(id: string, stage: PipelineStage): PipelineCard | undefined {
    const card = this.pipeline.get(id);
    if (!card) return undefined;
    const updated: PipelineCard = { ...card, stage, updatedAt: now() };
    this.pipeline.set(id, updated);
    return updated;
  }

  /* ── Applications ───────────────────────────────────────────── */

  listApplications(seekerId?: string): Application[] {
    const all = [...this.applications.values()];
    return seekerId ? all.filter((a) => a.seekerId === seekerId) : all;
  }

  createApplication(a: Application): Application {
    this.applications.set(a.id, a);
    return a;
  }

  setApplicationStatus(id: string, status: ApplicationStatus): Application | undefined {
    const app = this.applications.get(id);
    if (!app) return undefined;
    const updated: Application = { ...app, status };
    this.applications.set(id, updated);
    return updated;
  }

  /* ── Outreach ───────────────────────────────────────────────── */

  listOutreach(requisitionId?: string): OutreachMessage[] {
    const all = [...this.outreach.values()];
    return requisitionId ? all.filter((m) => m.requisitionId === requisitionId) : all;
  }

  createOutreach(m: OutreachMessage): OutreachMessage {
    this.outreach.set(m.id, m);
    return m;
  }

  interestForSeeker(seekerId: string): { cards: PipelineCard[]; outreach: OutreachMessage[] } {
    const seeker = this.getSeeker(seekerId);
    if (!seeker) return { cards: [], outreach: [] };
    const candidateId = seeker.profile.id;
    const cards = [...this.pipeline.values()].filter((c) => c.candidate.id === candidateId);
    const outreach = [...this.outreach.values()].filter((m) => m.candidateId === candidateId);
    return { cards, outreach };
  }

  /* ── Audit ──────────────────────────────────────────────────── */

  listAudit(limit?: number): AuditEntry[] {
    // Most-recent first.
    const ordered = [...this.auditLog].reverse();
    return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
  }

  audit(entry: Omit<AuditEntry, 'id' | 'at'>): AuditEntry {
    const full: AuditEntry = { ...entry, id: `audit-${randomUUID()}`, at: now() };
    this.auditLog.push(full);
    return full;
  }
}
