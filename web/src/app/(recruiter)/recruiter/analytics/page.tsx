import type { Metadata } from 'next';
import { Users, Target, Handshake, Gauge, ScrollText, Radar } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Stat,
  Badge,
  ModeBadge,
  ScoreBar,
  Alert,
  EmptyState,
} from '@/components/ui';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../../(seeker)/_components/PageHeader';
import {
  PIPELINE_STAGES,
  ALL_PIPELINE_STAGES,
  STAGE_TONE,
  SOURCE_LABEL,
  SOURCE_TONE,
} from '../../_components/stage';
import type { SourceType } from '@/lib/domain/types';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const repo = getRepo();
  const cards = repo.listPipeline();
  const audit = repo.listAudit(8);

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Analytics" title="Hiring analytics" />
        <EmptyState
          icon={<Gauge className="h-6 w-6" />}
          title="No pipeline data yet"
          description="Source candidates and build a pipeline to see funnel and source-quality analytics."
        />
      </div>
    );
  }

  const total = cards.length;
  const hired = cards.filter((c) => c.stage === 'Hired' || c.stage === 'Onboarding').length;
  const rejected = cards.filter((c) => c.stage === 'Rejected').length;
  const avgScore = Math.round(cards.reduce((s, c) => s + c.match.overall, 0) / total);

  const funnel = ALL_PIPELINE_STAGES.map((stage) => ({
    stage,
    count: cards.filter((c) => c.stage === stage).length,
  }));
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  // Source quality: count + average match per source.
  const bySource = new Map<SourceType, { count: number; sum: number }>();
  for (const c of cards) {
    const cur = bySource.get(c.candidate.source) ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += c.match.overall;
    bySource.set(c.candidate.source, cur);
  }
  const sources = [...bySource.entries()]
    .map(([source, v]) => ({ source, count: v.count, avg: Math.round(v.sum / v.count) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Hiring analytics"
        description="Computed live from your pipeline and audit log. Numbers reflect seeded demo data — honest about what's real."
      />

      <Alert tone="info" className="mb-6">
        Metrics are derived from the in-memory seeded dataset for this session. In production these
        would aggregate across all requisitions over time.
      </Alert>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <Stat icon={<Users className="h-3.5 w-3.5" />} label="In pipeline" value={total} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat icon={<Handshake className="h-3.5 w-3.5" />} label="Hired / onboarding" value={hired} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              icon={<Target className="h-3.5 w-3.5" />}
              label="Avg match score"
              value={`${avgScore}%`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              icon={<Gauge className="h-3.5 w-3.5" />}
              label="Conversion to hire"
              value={`${Math.round((hired / total) * 100)}%`}
              trend={`${rejected} rejected`}
              trendDirection="neutral"
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Stage funnel</CardTitle>
            <p className="text-sm text-ink-faint">Candidates by lifecycle stage.</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {funnel.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <Badge tone={STAGE_TONE[stage]} size="sm">
                    {stage}
                  </Badge>
                </div>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-brand-500 px-2 text-xs font-semibold text-white transition-[width] duration-500"
                    style={{ width: `${Math.max(count === 0 ? 0 : 8, (count / maxFunnel) * 100)}%` }}
                  >
                    {count > 0 && count}
                  </div>
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-ink-soft">
                  {count}
                </span>
              </div>
            ))}
            <p className="pt-1 text-xs text-ink-faint">
              Active lifecycle: {PIPELINE_STAGES.join(' → ')}.
            </p>
          </CardBody>
        </Card>

        {/* Source quality */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Source quality</CardTitle>
            <ModeBadge mode="heuristic" />
          </CardHeader>
          <CardBody className="space-y-4">
            {sources.map((s) => (
              <div key={s.source}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    <Radar className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                    <Badge tone={SOURCE_TONE[s.source]} size="sm">
                      {SOURCE_LABEL[s.source]}
                    </Badge>
                  </span>
                  <span className="text-xs text-ink-faint">
                    {s.count} candidate{s.count === 1 ? '' : 's'}
                  </span>
                </div>
                <ScoreBar label="Avg match" value={s.avg} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Audit */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Recent activity
          </CardTitle>
          <p className="text-sm text-ink-faint">Every state change is auditable — full traceability.</p>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-slate-100">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-ink">{a.actor}</span>{' '}
                  <span className="text-ink-soft">{a.action}</span>{' '}
                  <span className="text-ink-faint">→ {a.target}</span>
                </span>
                <time className="shrink-0 text-xs text-ink-faint" dateTime={a.at}>
                  {new Date(a.at).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
