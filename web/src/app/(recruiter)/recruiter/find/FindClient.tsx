'use client';

import * as React from 'react';
import {
  Radar,
  Bot,
  Zap,
  Save,
  Send,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Select,
  Avatar,
  ScoreRing,
  ModeBadge,
  Alert,
  EmptyState,
  Spinner,
  cn,
} from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type {
  RankedCandidate,
  AgentStep,
  ResultMode,
  Requisition,
  OutreachMessage,
} from '@/lib/domain/types';
import { AgentTrace } from '../../../(seeker)/_components/AgentTrace';
import { MatchDetails } from '../../../(seeker)/_components/MatchDetails';
import { SOURCE_LABEL, SOURCE_TONE } from '../../_components/stage';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; steps: AgentStep[]; shortlist: RankedCandidate[]; mode: ResultMode; agent: boolean }
  | { phase: 'error'; message: string };

type RowAction = { saved?: boolean; outreach?: OutreachMessage; busy?: 'save' | 'outreach'; error?: string };

export function FindClient({
  requisitions,
  initialReqId,
}: {
  requisitions: Requisition[];
  initialReqId: string;
}) {
  const [reqId, setReqId] = React.useState(initialReqId);
  const [useAgent, setUseAgent] = React.useState(true);
  const [run, setRun] = React.useState<RunState>({ phase: 'idle' });
  const [rows, setRows] = React.useState<Record<string, RowAction>>({});
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  // Blind screening: redact identity (name, avatar, profile link, location) while
  // keeping skills + the explainable score, to reduce bias at the screening stage.
  const [blind, setBlind] = React.useState(false);

  const currentReq = requisitions.find((r) => r.id === reqId);

  async function source() {
    setRun({ phase: 'running' });
    setRows({});
    try {
      if (useAgent) {
        const res = await apiPost<{ mode: ResultMode; steps: AgentStep[]; shortlist: RankedCandidate[] }>(
          '/api/agent/sourcing',
          { requisitionId: reqId },
        );
        setRun({ phase: 'done', steps: res.steps, shortlist: res.shortlist, mode: res.mode, agent: true });
      } else {
        const res = await apiPost<{ count: number; ranked: RankedCandidate[] }>('/api/source', {
          requisitionId: reqId,
        });
        setRun({
          phase: 'done',
          steps: [],
          shortlist: res.ranked,
          mode: res.ranked[0]?.match.mode ?? 'heuristic',
          agent: false,
        });
      }
    } catch (err) {
      setRun({ phase: 'error', message: (err as Error).message });
    }
  }

  async function saveToPipeline(rc: RankedCandidate) {
    const id = rc.candidate.id;
    setRows((r) => ({ ...r, [id]: { ...r[id], busy: 'save', error: undefined } }));
    try {
      await apiPost('/api/pipeline', {
        action: 'upsert',
        card: {
          requisitionId: reqId,
          candidate: rc.candidate,
          match: rc.match,
          stage: 'Sourced',
          notes: '',
        },
      });
      setRows((r) => ({ ...r, [id]: { ...r[id], busy: undefined, saved: true } }));
    } catch (err) {
      setRows((r) => ({ ...r, [id]: { ...r[id], busy: undefined, error: (err as Error).message } }));
    }
  }

  async function draftOutreach(rc: RankedCandidate) {
    const id = rc.candidate.id;
    setRows((r) => ({ ...r, [id]: { ...r[id], busy: 'outreach', error: undefined } }));
    try {
      const msg = await apiPost<OutreachMessage>('/api/outreach', {
        candidateId: rc.candidate.id,
        requisitionId: reqId,
        candidate: rc.candidate,
      });
      setRows((r) => ({ ...r, [id]: { ...r[id], busy: undefined, outreach: msg } }));
    } catch (err) {
      setRows((r) => ({ ...r, [id]: { ...r[id], busy: undefined, error: (err as Error).message } }));
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Requisition"
              value={reqId}
              onChange={(e) => {
                setReqId(e.target.value);
                setRun({ phase: 'idle' });
              }}
              options={requisitions.map((r) => ({ value: r.id, label: `${r.spec.title} · ${r.company}` }))}
            />
          </div>
          <fieldset className="flex items-center rounded-xl bg-slate-100 p-0.5" aria-label="Sourcing mode">
            <button
              type="button"
              aria-pressed={useAgent}
              onClick={() => setUseAgent(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[0.625rem] px-3 py-2 text-sm font-medium transition-colors',
                useAgent ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-faint hover:text-ink',
              )}
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              Agent
            </button>
            <button
              type="button"
              aria-pressed={!useAgent}
              onClick={() => setUseAgent(false)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[0.625rem] px-3 py-2 text-sm font-medium transition-colors',
                !useAgent ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-faint hover:text-ink',
              )}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              Quick
            </button>
          </fieldset>
          <Button
            onClick={source}
            loading={run.phase === 'running'}
            disabled={!reqId}
            leftIcon={<Radar className="h-4 w-4" />}
          >
            {run.phase === 'running'
              ? useAgent
                ? 'Agent working…'
                : 'Sourcing…'
              : useAgent
                ? 'Run Sourcing Agent'
                : 'Quick source'}
          </Button>
        </CardBody>
      </Card>

      {currentReq && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-faint">
          <span>Searching for:</span>
          {currentReq.spec.mustHaveSkills.slice(0, 6).map((s) => (
            <Badge key={s} tone="brand" size="sm">
              {s}
            </Badge>
          ))}
        </p>
      )}

      {/* Running state */}
      {run.phase === 'running' && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-card">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Spinner size={16} label="Sourcing" />
              {useAgent
                ? 'The Sourcing Agent is parsing the spec, fanning out to sources, and ranking…'
                : 'Fanning out to sources and ranking candidates…'}
            </p>
            <p className="max-w-md text-xs text-ink-faint">
              Sources: GitHub (official API) + your internal talent pool. No LinkedIn scraping.
            </p>
          </CardBody>
        </Card>
      )}

      {run.phase === 'error' && (
        <Alert tone="error" title="Sourcing failed">
          {run.message}
        </Alert>
      )}

      {run.phase === 'idle' && (
        <EmptyState
          icon={<Radar className="h-6 w-6" />}
          title="Ready to source"
          description="Pick a requisition and run the Sourcing Agent. You'll see its reasoning trace and a ranked shortlist to review — every candidate carries its source for provenance."
        />
      )}

      {/* Results */}
      {run.phase === 'done' && (
        <div className="space-y-5">
          {run.agent && run.steps.length > 0 && (
            <AgentTrace steps={run.steps} mode={run.mode} title="Sourcing Agent reasoning" />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Users className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Shortlist
              <span className="text-sm font-normal text-ink-faint">({run.shortlist.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={blind}
                onClick={() => setBlind((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  blind
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-ink-soft hover:bg-surface-sunken',
                )}
              >
                {blind ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                Blind screening {blind ? 'on' : 'off'}
              </button>
              <ModeBadge mode={run.mode} />
            </div>
          </div>

          {blind && (
            <Alert tone="info">
              Blind screening is on — names, photos, profile links and location are hidden so you
              rank on skills and the explainable score alone. Reveal identities after you&apos;ve shortlisted.
            </Alert>
          )}

          {run.shortlist.length === 0 ? (
            <EmptyState
              title="No candidates found"
              description="No candidates matched this requisition across the enabled sources."
            />
          ) : (
            run.shortlist.map((rc, i) => {
              const id = rc.candidate.id;
              const row = rows[id] ?? {};
              const open = expanded.has(id);
              const displayName = blind ? `Candidate #${i + 1}` : rc.candidate.name;
              return (
                <Card key={id}>
                  <CardBody className="space-y-4">
                    <div className="flex items-start gap-4">
                      {blind ? (
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-faint" aria-hidden="true">
                          <EyeOff className="h-5 w-5" />
                        </span>
                      ) : (
                        <Avatar name={rc.candidate.name} size="lg" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-ink">{displayName}</h3>
                          <Badge tone={SOURCE_TONE[rc.candidate.source]} size="sm">
                            {SOURCE_LABEL[rc.candidate.source]}
                          </Badge>
                          {!blind && rc.candidate.sourceUrl && (
                            <a
                              href={rc.candidate.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
                            >
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              Source
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-ink-faint">{rc.candidate.headline}</p>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {rc.candidate.yearsExperience} yrs · {rc.candidate.seniority}
                          {!blind && rc.candidate.location ? ` · ${rc.candidate.location}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rc.candidate.skills.slice(0, 6).map((s) => (
                            <Badge key={s} tone="brand" size="sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ScoreRing score={rc.match.overall} size={64} />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-expanded={open}
                      className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
                      {open ? 'Hide breakdown' : 'Match breakdown'}
                    </button>
                    {open && <MatchDetails match={rc.match} showReasoning />}

                    {row.error && (
                      <Alert tone="error" title="Action failed">
                        {row.error}
                      </Alert>
                    )}

                    {row.outreach && (
                      <Alert tone="success" title="Outreach drafted (not sent)">
                        <p className="font-medium text-ink">{row.outreach.subject}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">
                          {row.outreach.body}
                        </p>
                      </Alert>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      {row.saved ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Saved to pipeline
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={row.busy === 'save'}
                          onClick={() => saveToPipeline(rc)}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save to pipeline
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={row.busy === 'outreach'}
                        onClick={() => draftOutreach(rc)}
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        Draft outreach
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
