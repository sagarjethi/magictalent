'use client';

import * as React from 'react';
import { Award, ThumbsUp, AlertTriangle, ListChecks } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle, Badge, ModeBadge, ScoreRing, ScoreBar } from '@/components/ui';
import type { InterviewReport, InterviewRecommendation } from '@/lib/domain/types';

const REC_TONE: Record<InterviewRecommendation, 'brand' | 'green' | 'amber' | 'slate' | 'red'> = {
  'strong-hire': 'green',
  hire: 'green',
  'lean-hire': 'amber',
  'lean-no-hire': 'amber',
  'no-hire': 'red',
};

const REC_LABEL: Record<InterviewRecommendation, string> = {
  'strong-hire': 'Strong hire',
  hire: 'Hire',
  'lean-hire': 'Lean hire',
  'lean-no-hire': 'Lean no-hire',
  'no-hire': 'No hire',
};

/** Renders an AI/heuristic interview debrief — shared by recruiter and (read-only) seeker views. */
export function InterviewReportCard({ report }: { report: InterviewReport }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-brand-600" /> Interview debrief
        </CardTitle>
        <ModeBadge mode={report.mode} />
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="flex items-center gap-4">
          <ScoreRing score={report.overallScore} size={64} />
          <div>
            <Badge tone={REC_TONE[report.recommendation]}>{REC_LABEL[report.recommendation]}</Badge>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{report.summary}</p>
          </div>
        </div>

        {report.competencies.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ListChecks className="h-4 w-4 text-brand-600" /> Competencies
            </h4>
            {report.competencies.map((c, i) => (
              <div key={`${c.name}-${i}`}>
                <ScoreBar label={c.name} value={c.score} />
                {c.evidence && <p className="mt-1 text-xs text-ink-faint">{c.evidence}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {report.strengths.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <ThumbsUp className="h-4 w-4 text-green-600" /> Strengths
              </h4>
              <ul className="space-y-1 text-sm text-ink-soft">
                {report.strengths.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
          )}
          {report.concerns.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Concerns
              </h4>
              <ul className="space-y-1 text-sm text-ink-soft">
                {report.concerns.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
          )}
        </div>

        {report.followUps.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink">Suggested follow-ups</h4>
            <ul className="space-y-1 text-sm text-ink-soft">
              {report.followUps.map((s, i) => <li key={i}>→ {s}</li>)}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
