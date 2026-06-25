/**
 * Jobmagic design system — primitive component library.
 * Import from '@/components/ui' across both portals.
 */
export { cn } from './cn';
export type { ClassValue } from './cn';

export { Button } from './Button';
export type {
  ButtonProps,
  ButtonLinkProps,
  ButtonVariant,
  ButtonSize,
} from './Button';

export { Card, CardHeader, CardTitle, CardBody, CardFooter } from './Card';
export type { CardProps, CardTitleProps } from './Card';

export { Badge } from './Badge';
export type { BadgeProps, BadgeTone, BadgeSize } from './Badge';

export { ModeBadge } from './ModeBadge';
export type { ModeBadgeProps, ResultMode } from './ModeBadge';

export { Input } from './Input';
export type { InputProps } from './Input';
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';
export { FieldShell } from './Field';

export { ScoreRing } from './ScoreRing';
export type { ScoreRingProps } from './ScoreRing';
export { ScoreBar } from './ScoreBar';
export type { ScoreBarProps } from './ScoreBar';
export { scoreBand, clampScore } from './score';
export type { ScoreBand, BandStyle } from './score';

export { Stat } from './Stat';
export type { StatProps } from './Stat';

export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';
export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { Alert } from './Alert';
export type { AlertProps, AlertTone } from './Alert';

export { LifecycleSteps, LIFECYCLE_STAGES } from './LifecycleSteps';
export type { LifecycleStepsProps, LifecycleStage } from './LifecycleSteps';
