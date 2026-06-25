'use client';

import * as React from 'react';
import { KanbanSquare } from 'lucide-react';
import {
  Card,
  CardBody,
  Badge,
  Select,
  Avatar,
  ScoreRing,
  Alert,
  EmptyState,
  LifecycleSteps,
} from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type { PipelineCard, PipelineStage, Requisition } from '@/lib/domain/types';
import { ALL_PIPELINE_STAGES, PIPELINE_STAGES, STAGE_TONE, SOURCE_LABEL, SOURCE_TONE } from '../../_components/stage';

export function PipelineBoard({
  initial,
  requisitions,
  initialReqId,
}: {
  initial: PipelineCard[];
  requisitions: Requisition[];
  initialReqId: string;
}) {
  const [cards, setCards] = React.useState(initial);
  const [reqId, setReqId] = React.useState(initialReqId);
  const [error, setError] = React.useState('');
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const visible = reqId === 'all' ? cards : cards.filter((c) => c.requisitionId === reqId);

  async function move(id: string, stage: PipelineStage) {
    setPendingId(id);
    setError('');
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));
    try {
      const updated = await apiPost<PipelineCard>('/api/pipeline', { action: 'move', id, stage });
      setCards((cs) => cs.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setCards(prev);
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs">
          <Select
            label="Filter by requisition"
            value={reqId}
            onChange={(e) => setReqId(e.target.value)}
            options={[
              { value: 'all', label: 'All requisitions' },
              ...requisitions.map((r) => ({ value: r.id, label: `${r.spec.title} · ${r.company}` })),
            ]}
          />
        </div>
      </div>

      {error && (
        <Alert tone="error" title="Couldn't move the card">
          {error}
        </Alert>
      )}

      <div className="rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-5 sm:px-6">
        <LifecycleSteps variant="compact" current="screen" />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-6 w-6" />}
          title="No candidates in this pipeline yet"
          description="Source candidates and save them to the pipeline to populate these stages."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ALL_PIPELINE_STAGES.map((stage) => {
            const col = visible.filter((c) => c.stage === stage);
            return (
              <section key={stage} aria-label={`${stage} (${col.length})`} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Badge tone={STAGE_TONE[stage]} size="sm">
                      {stage}
                    </Badge>
                  </h3>
                  <span className="text-xs font-medium tabular-nums text-ink-faint">{col.length}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {col.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-ink-faint">
                      Empty
                    </div>
                  ) : (
                    col.map((c) => (
                      <Card key={c.id} className="shadow-card">
                        <CardBody className="space-y-3 p-4">
                          <div className="flex items-start gap-2.5">
                            <Avatar name={c.candidate.name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-ink">{c.candidate.name}</p>
                              <p className="truncate text-xs text-ink-faint">{c.candidate.headline}</p>
                            </div>
                            <ScoreRing score={c.match.overall} size={40} />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Badge tone={SOURCE_TONE[c.candidate.source]} size="sm">
                              {SOURCE_LABEL[c.candidate.source]}
                            </Badge>
                            {c.match.mode && (
                              <span className="text-[0.6875rem] text-ink-faint">{c.match.mode}</span>
                            )}
                          </div>

                          {c.notes && <p className="text-xs text-ink-soft">{c.notes}</p>}

                          <Select
                            aria-label={`Move ${c.candidate.name} to a stage`}
                            value={c.stage}
                            disabled={pendingId === c.id}
                            onChange={(e) => move(c.id, e.target.value as PipelineStage)}
                            options={ALL_PIPELINE_STAGES.map((s) => ({ value: s, label: s }))}
                          />
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-ink-faint">
        Stage moves are audited. The lifecycle above maps:{' '}
        {PIPELINE_STAGES.join(' → ')} (Rejected is a terminal off-ramp).
      </p>
    </div>
  );
}
