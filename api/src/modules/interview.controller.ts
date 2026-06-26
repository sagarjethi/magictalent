/**
 * /api/interview/* — browser video interviews (schedule → notify → record → transcribe → report).
 * Mirrors the Next.js /api/interview route surface. Auth-gated by the global AuthGuard.
 *
 * Endpoints:
 *   GET  /interview?requisitionId          list
 *   POST /interview                         schedule
 *   GET  /interview/:id                     fetch one
 *   POST /interview/:id/notify {channel}    send invite (email/sms/in-app)
 *   POST /interview/:id/chunk  (binary)     chunked video upload sink
 *   POST /interview/:id/transcript {...}    append speech-to-text segments
 *   POST /interview/:id/status {status}     lifecycle transition
 *   POST /interview/:id/report              generate AI debrief
 */
import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { InterviewSession, InviteChannel, InterviewStatus, TranscriptSegment } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { AgentsService } from '../core/agents.service';
import { sendInvite } from '../lib/notify/invites';
import { ok, validate, apiError, newId, nowIso } from '../common/api';
import type { AuthedRequest } from '../common/auth.guard';

const CreateSchema = z.object({
  requisitionId: z.string().min(1),
  candidateId: z.string().min(1),
  candidateName: z.string().optional(),
  candidateContact: z.string().optional(),
  scheduledAt: z.string().min(1),
  durationMins: z.number().int().min(5).max(240).optional(),
});
const NotifySchema = z.object({ channel: InviteChannel.default('in-app') });
const TranscriptSchema = z.object({ segments: z.array(TranscriptSegment), replace: z.boolean().optional() });
const StatusSchema = z.object({ status: InterviewStatus });

/** Count bytes of a raw (unparsed) request body — chunks arrive as application/octet-stream. */
function readBodyLength(req: Request): Promise<number> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared >= 0 && req.readableEnded) return resolve(declared);
    let len = 0;
    req.on('data', (c: Buffer) => { len += c.length; });
    req.on('end', () => resolve(len || (Number.isFinite(declared) ? declared : 0)));
    req.on('error', reject);
  });
}

@Controller('interview')
export class InterviewController {
  constructor(
    private readonly repo: RepoService,
    private readonly agents: AgentsService,
  ) {}

  @Get()
  list(@Query('requisitionId') requisitionId?: string) {
    return ok(this.repo.get().listInterviews(requisitionId));
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() body: unknown) {
    const data = validate(CreateSchema, body);
    const repo = this.repo.get();
    const requisition = repo.getRequisition(data.requisitionId);
    if (!requisition) apiError(`Requisition ${data.requisitionId} not found`, HttpStatus.NOT_FOUND);

    const card = repo.listPipeline(data.requisitionId).find((c) => c.candidate.id === data.candidateId);
    const candidateName = data.candidateName ?? card?.candidate.name ?? 'Candidate';
    const userId = req.user?.id ?? 'recruiter-demo';
    const now = nowIso();

    const session = InterviewSession.parse({
      id: newId('iv'),
      requisitionId: data.requisitionId,
      candidateId: data.candidateId,
      candidateName,
      candidateContact: data.candidateContact ?? '',
      jobTitle: requisition!.spec.title,
      company: requisition!.company,
      recruiterId: userId,
      scheduledAt: data.scheduledAt,
      durationMins: data.durationMins ?? 30,
      status: 'scheduled',
      invites: [],
      recording: {},
      transcript: [],
      createdAt: now,
      updatedAt: now,
    });

    const saved = repo.createInterview(session);
    repo.audit({ actor: userId, action: 'interview.scheduled', target: saved.id });
    return ok(saved);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    const session = this.repo.get().getInterview(id);
    if (!session) apiError(`Interview ${id} not found`, HttpStatus.NOT_FOUND);
    return ok(session);
  }

  @Post(':id/notify')
  async notify(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: unknown) {
    const { channel } = validate(NotifySchema, body);
    const repo = this.repo.get();
    const session = repo.getInterview(id);
    if (!session) apiError(`Interview ${id} not found`, HttpStatus.NOT_FOUND);

    const invite = await sendInvite(session!, channel);
    const updated = repo.updateInterview(id, { invites: [...session!.invites, invite] });
    repo.audit({ actor: req.user?.id ?? 'recruiter-demo', action: `interview.invite.${invite.channel}.${invite.status}`, target: id });
    return ok({ invite, session: updated });
  }

  @Post(':id/chunk')
  async chunk(@Req() req: Request, @Param('id') id: string, @Query('last') last?: string, @Query('durationSec') durationSec?: string) {
    const repo = this.repo.get();
    const session = repo.getInterview(id);
    if (!session) apiError(`Interview ${id} not found`, HttpStatus.NOT_FOUND);

    const size = await readBodyLength(req);
    const isLast = last === 'true';
    const recording = {
      chunkCount: session!.recording.chunkCount + 1,
      totalBytes: session!.recording.totalBytes + size,
      mimeType: (req.headers['content-type'] as string) || session!.recording.mimeType || 'video/webm',
      durationSec: Number(durationSec) || session!.recording.durationSec,
      complete: isLast,
      lastChunkAt: nowIso(),
    };
    const patch = isLast && session!.status === 'in-progress'
      ? { recording, status: 'recorded' as const }
      : { recording };
    const updated = repo.updateInterview(id, patch);
    return ok({ recording: updated?.recording, accepted: size });
  }

  @Post(':id/transcript')
  transcript(@Param('id') id: string, @Body() body: unknown) {
    const data = validate(TranscriptSchema, body);
    const repo = this.repo.get();
    const session = repo.getInterview(id);
    if (!session) apiError(`Interview ${id} not found`, HttpStatus.NOT_FOUND);

    const transcript = data.replace ? data.segments : [...session!.transcript, ...data.segments];
    const updated = repo.updateInterview(id, { transcript });
    return ok({ count: updated?.transcript.length ?? 0 });
  }

  @Post(':id/status')
  status(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: unknown) {
    const { status } = validate(StatusSchema, body);
    const repo = this.repo.get();
    if (!repo.getInterview(id)) apiError(`Interview ${id} not found`, HttpStatus.NOT_FOUND);
    const updated = repo.updateInterview(id, { status });
    repo.audit({ actor: req.user?.id ?? 'recruiter-demo', action: `interview.status.${status}`, target: id });
    return ok(updated);
  }

  @Post(':id/report')
  async report(@Param('id') id: string) {
    const result = await this.agents.runInterviewReport(id);
    return ok(result);
  }
}
