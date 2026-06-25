import { cn } from './cn';

export interface AvatarProps {
  /** Full name — used for initials + alt text. */
  name: string;
  /** Optional image URL. Falls back to initials when absent. */
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic tone from the name so avatars are stable + varied. */
const tones = [
  'bg-brand-100 text-brand-700',
  'bg-accent-100 text-accent-600',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-slate-200 text-slate-700',
];

function toneFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

/** Avatar — image with initials fallback. Server-compatible. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'inline-block shrink-0 rounded-full object-cover ring-1 ring-slate-200',
          sizes[size],
          className,
        )}
      />
    );
  }
  return (
    <span
      aria-label={name}
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/5',
        sizes[size],
        toneFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
