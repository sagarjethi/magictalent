'use client';

import * as React from 'react';
import { Video, CalendarPlus, Mail, MessageSquare, Bell, DoorOpen, Sparkles, Clock } from 'lucide-react';
import {
  Card, CardBody, CardHeader, CardTitle, Button, Select, Input, Badge, Alert, Spinner, EmptyState,
} from '@/components/ui';
import { apiGet, apiPost } from '@/lib/api-client';
import type { InterviewSession, InterviewStatus, InviteChannel } from '@/lib/domain/types';
import { InterviewReportCard } from '@/components/InterviewReportCard';

interface ReqOpt { id: string; title: string; company: string }

const STATUS_TONE: Record<InterviewStatus, 'brand' | 'green' | 'amber' | 'slate' | 'red'> = {
  scheduled: 'amber',
  'in-progress': 'brand',
  recorded: 'brand',
  completed: 'green',
  cancelled: 'red',
};

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

/** Default the datetime picker to ~1 hour from now, rounded, in the input's local format. */
function defaultWhen(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InterviewsClient({
  requisitions,
  candidatesByReq,
}: {
  requisitions: ReqOpt[];
  candidatesByReq: Record<string, { id: string; name: string }[]>;
}) {
  const [reqId, setReqId] = React.useState(requisitions[0]?.id ?? '');
  const candidates = candidatesByReq[reqId] ?? [];
  const [candId, setCandId] = React.useState(candidates[0]?.id ?? '');
  const [when, setWhen] = React.useState(defaultWhen());
  const [duration, setDuration] = React.useState(45);
  const [contact, setContact] = React.useState('');

  const [sessions, setSessions] = React.useState<InterviewSession[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setSessions(await apiGet<InterviewSession[]>('/api/interview'));
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  // Keep the candidate selection valid when the requisition changes.
  React.useEffect(() => {
    const list = candidatesByReq[reqId] ?? [];
    if (!list.some((c) => c.id === candId)) setCandId(list[0]?.id ?? '');
  }, [reqId, candId, candidatesByReq]);

  async function schedule() {
    if (!reqId || !candId) { setNotice('Pick a requisition and a candidate first.'); return; }
    setBusy(true); setNotice(null);
    try {
      await apiPost<InterviewSession>('/api/interview', {
        requisitionId: reqId,
        candidateId: candId,
        scheduledAt: new Date(when).toISOString(),
        durationMins: Number(duration),
        candidateContact: contact || undefined,
      });
      setNotice('Interview scheduled.');
      await refresh();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Schedule form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-brand-600" /> Schedule an interview
          </CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Requisition"
            value={reqId}
            onChange={(e) => setReqId(e.target.value)}
            options={requisitions.map((r) => ({ value: r.id, label: `${r.title} · ${r.company}` }))}
          />
          <Select
            label="Candidate"
            value={candId}
            onChange={(e) => setCandId(e.target.value)}
            options={candidates.length
              ? candidates.map((c) => ({ value: c.id, label: c.name }))
              : [{ value: '', label: 'No pipeline candidates' }]}
          />
          <Input
            label="When"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <Input
            label="Duration (min)"
            type="number"
            min={5}
            max={240}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <Input
            label="Candidate email / phone (optional)"
            placeholder="for email/SMS invite"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={schedule} loading={busy} leftIcon={<CalendarPlus className="h-4 w-4" />}>
              Schedule
            </Button>
          </div>
        </CardBody>
      </Card>

      {notice && <Alert tone="info">{notice}</Alert>}
      {loadError && <Alert tone="error">{loadError}</Alert>}

      {/* Sessions list */}
      {sessions === null && !loadError && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-6 text-sm text-ink-soft">
          <Spinner /> Loading interviews…
        </div>
      )}

      {sessions !== null && sessions.length === 0 && (
        <EmptyState
          icon={<Video className="h-6 w-6" />}
          title="No interviews scheduled yet"
          description="Schedule one above. You'll be able to notify the candidate, run the call in-browser, and generate an AI debrief."
        />
      )}

      {sessions?.map((s) => (
        <InterviewRow key={s.id} session={s} onChanged={refresh} />
      ))}
    </div>
  );
}

function InterviewRow({ session, onChanged }: { session: InterviewSession; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function notify(channel: InviteChannel) {
    setBusy(channel); setMsg(null);
    try {
      const { invite } = await apiPost<{ invite: { status: string } }>(`/api/interview/${session.id}/notify`, { channel });
      setMsg(`Invite via ${channel}: ${invite.status}.`);
      await onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function generateReport() {
    setBusy('report'); setMsg(null);
    try {
      await apiPost(`/api/interview/${session.id}/report`, {});
      await onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const rec = session.recording;
  const kb = rec.totalBytes ? `${(rec.totalBytes / 1024).toFixed(0)} KB` : '—';

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink">{session.candidateName}</p>
              <Badge tone={STATUS_TONE[session.status]}>{session.status}</Badge>
            </div>
            <p className="text-sm text-ink-faint">{session.jobTitle} · {session.company}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
              <Clock className="h-3.5 w-3.5" /> {fmt(session.scheduledAt)} · {session.durationMins} min
            </p>
          </div>
          <div className="text-right text-xs text-ink-faint">
            <p>{rec.chunkCount} chunk(s) · {kb}</p>
            <p>{session.transcript.length} transcript segment(s)</p>
            {session.invites.length > 0 && <p>{session.invites.length} invite(s) sent</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Bell className="h-4 w-4" />} loading={busy === 'in-app'} onClick={() => notify('in-app')}>
            In-app
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<Mail className="h-4 w-4" />} loading={busy === 'email'} onClick={() => notify('email')}>
            Email
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<MessageSquare className="h-4 w-4" />} loading={busy === 'sms'} onClick={() => notify('sms')}>
            SMS
          </Button>
          <Button size="sm" href={`/room/${session.id}`} leftIcon={<DoorOpen className="h-4 w-4" />}>
            Open room
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Sparkles className="h-4 w-4" />}
            loading={busy === 'report'}
            onClick={generateReport}
            disabled={session.transcript.length === 0 && session.recording.chunkCount === 0}
          >
            {session.report ? 'Regenerate report' : 'Generate report'}
          </Button>
        </div>

        {msg && <Alert tone="info">{msg}</Alert>}
        {session.report && <InterviewReportCard report={session.report} />}
      </CardBody>
    </Card>
  );
}
