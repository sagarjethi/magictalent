import type { BadgeTone } from '@/components/ui';
import type { PipelineStage, SourceType } from '@/lib/domain/types';

/** The active 7-stage hiring lifecycle (Rejected is a terminal off-ramp shown separately). */
export const PIPELINE_STAGES: PipelineStage[] = [
  'Sourced',
  'Screening',
  'Interview',
  'Selected',
  'Hired',
  'Onboarding',
];

export const ALL_PIPELINE_STAGES: PipelineStage[] = [...PIPELINE_STAGES, 'Rejected'];

export const STAGE_TONE: Record<PipelineStage, BadgeTone> = {
  Sourced: 'slate',
  Screening: 'brand',
  Interview: 'brand',
  Selected: 'amber',
  Hired: 'green',
  Onboarding: 'green',
  Rejected: 'red',
};

/** Map a pipeline stage onto the canonical LifecycleSteps key for the stepper. */
export const STAGE_TO_LIFECYCLE: Record<PipelineStage, string> = {
  Sourced: 'attract',
  Screening: 'screen',
  Interview: 'interview',
  Selected: 'select',
  Hired: 'hire',
  Onboarding: 'onboard',
  Rejected: 'attract',
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  github: 'GitHub',
  'internal-pool': 'Talent pool',
  linkedin: 'LinkedIn',
  naukri: 'Naukri',
  manual: 'Manual',
};

export const SOURCE_TONE: Record<SourceType, BadgeTone> = {
  github: 'slate',
  'internal-pool': 'brand',
  linkedin: 'brand',
  naukri: 'amber',
  manual: 'slate',
};
