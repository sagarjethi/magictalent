'use client';

import * as React from 'react';
import { Send, Wand2, CheckCircle2, Mail, Inbox } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Input,
  Textarea,
  Badge,
  ModeBadge,
  Alert,
  EmptyState,
  Avatar,
} from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type { OutreachMessage } from '@/lib/domain/types';

interface CandidateOption {
  id: string;
  name: string;
}

export function OutreachClient({
  initialMessages,
  candidates,
  requisitions,
}: {
  initialMessages: OutreachMessage[];
  candidates: CandidateOption[];
  requisitions: { id: string; label: string }[];
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [reqId, setReqId] = React.useState(requisitions[0]?.id ?? '');
  const [candidateId, setCandidateId] = React.useState(candidates[0]?.id ?? '');
  const [draft, setDraft] = React.useState<{ subject: string; body: string; mode: OutreachMessage['mode'] } | null>(
    null,
  );
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = React.useState('');
  const [sentIds, setSentIds] = React.useState<Set<string>>(
    new Set(initialMessages.filter((m) => m.status === 'sent').map((m) => m.id)),
  );

  const nameById = React.useMemo(() => {
    const m = new Map(candidates.map((c) => [c.id, c.name]));
    return (id: string) => m.get(id) ?? id;
  }, [candidates]);
  const reqLabelById = React.useMemo(() => {
    const m = new Map(requisitions.map((r) => [r.id, r.label]));
    return (id: string) => m.get(id) ?? id;
  }, [requisitions]);

  async function generate() {
    setStatus('loading');
    setError('');
    try {
      const msg = await apiPost<OutreachMessage>('/api/outreach', {
        candidateId,
        requisitionId: reqId,
      });
      setDraft({ subject: msg.subject, body: msg.body, mode: msg.mode });
      setMessages((m) => [msg, ...m]);
      setStatus('idle');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  function markSent(id: string) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Composer */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Draft outreach</CardTitle>
            <p className="text-sm text-ink-faint">
              We draft a personalized first-touch message from the candidate and the requisition.
              You always review and edit before anything happens.
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {requisitions.length === 0 || candidates.length === 0 ? (
              <Alert tone="warning" title="Need a requisition and candidates">
                Create a requisition and ensure there are candidates in the pool to draft outreach.
              </Alert>
            ) : (
              <>
                <Select
                  label="Requisition"
                  value={reqId}
                  onChange={(e) => setReqId(e.target.value)}
                  options={requisitions.map((r) => ({ value: r.id, label: r.label }))}
                />
                <Select
                  label="Candidate"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  options={candidates.map((c) => ({ value: c.id, label: c.name }))}
                />
                {status === 'error' && (
                  <Alert tone="error" title="Couldn't draft the message">
                    {error}
                  </Alert>
                )}
                <Button
                  onClick={generate}
                  loading={status === 'loading'}
                  disabled={!reqId || !candidateId}
                  leftIcon={<Wand2 className="h-4 w-4" />}
                >
                  {status === 'loading' ? 'Drafting…' : 'Draft message'}
                </Button>
              </>
            )}
          </CardBody>
        </Card>

        {draft && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Editable draft</CardTitle>
              <ModeBadge mode={draft.mode} />
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Subject"
                value={draft.subject}
                onChange={(e) => setDraft((d) => (d ? { ...d, subject: e.target.value } : d))}
              />
              <Textarea
                label="Body"
                rows={9}
                value={draft.body}
                onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
              />
              <Alert tone="info">
                This is a demo. Edits are local and no email is sent — Jobmagic never contacts a
                candidate without a real, configured integration.
              </Alert>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Existing messages */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Mail className="h-5 w-5 text-brand-600" aria-hidden="true" />
          Messages ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No outreach yet"
            description="Draft your first message — it'll appear here as a draft until you mark it sent."
          />
        ) : (
          messages.map((m) => {
            const sent = sentIds.has(m.id) || m.status === 'sent';
            return (
              <Card key={m.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={nameById(m.candidateId)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{nameById(m.candidateId)}</p>
                      <p className="truncate text-xs text-ink-faint">{reqLabelById(m.requisitionId)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ModeBadge mode={m.mode} />
                      <Badge tone={sent ? 'green' : 'amber'} size="sm">
                        {sent ? 'Sent (demo)' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-muted px-3.5 py-3">
                    <p className="text-sm font-medium text-ink">{m.subject}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{m.body}</p>
                  </div>
                  {!sent && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => markSent(m.id)}
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Mark sent (demo)
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
