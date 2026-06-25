/** Shared 0–100 score banding so ScoreRing / ScoreBar / cards agree on color. */
export type ScoreBand = 'strong' | 'good' | 'fair' | 'weak';

export interface BandStyle {
  band: ScoreBand;
  label: string;
  /** Stroke/text hex for SVG + inline styles. */
  hex: string;
  /** Tailwind text color class. */
  text: string;
  /** Tailwind bg color class (solid). */
  bg: string;
  /** Tailwind soft bg class. */
  softBg: string;
}

export function scoreBand(score: number): BandStyle {
  if (score >= 80)
    return {
      band: 'strong',
      label: 'Strong match',
      hex: '#16a34a',
      text: 'text-green-700',
      bg: 'bg-green-600',
      softBg: 'bg-green-100',
    };
  if (score >= 60)
    return {
      band: 'good',
      label: 'Good match',
      hex: '#4f46e5',
      text: 'text-brand-700',
      bg: 'bg-brand-600',
      softBg: 'bg-brand-100',
    };
  if (score >= 40)
    return {
      band: 'fair',
      label: 'Fair match',
      hex: '#d97706',
      text: 'text-amber-700',
      bg: 'bg-amber-500',
      softBg: 'bg-amber-100',
    };
  return {
    band: 'weak',
    label: 'Low match',
    hex: '#dc2626',
    text: 'text-red-700',
    bg: 'bg-red-500',
    softBg: 'bg-red-100',
  };
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
