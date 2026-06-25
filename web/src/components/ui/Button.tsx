'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-55 ' +
  'active:translate-y-px whitespace-nowrap';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-card hover:bg-brand-700 hover:shadow-lift ' +
    'border border-brand-700/20',
  secondary:
    'bg-surface text-ink border border-slate-200 shadow-card ' +
    'hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700',
  ghost:
    'bg-transparent text-ink-soft hover:bg-slate-100 hover:text-ink',
  danger:
    'bg-red-600 text-white shadow-card hover:bg-red-700 border border-red-700/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[3.25rem] px-7 text-base',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | 'href'> & {
    href?: undefined;
  };

export type ButtonLinkProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | 'href'> & {
    /** When provided, the button renders as a Next.js <Link>. */
    href: string;
  };

function Content({
  loading,
  leftIcon,
  rightIcon,
  children,
}: Pick<CommonProps, 'loading' | 'leftIcon' | 'rightIcon' | 'children'>) {
  return (
    <>
      {loading && (
        <Spinner size={16} className="text-current" label="Working" />
      )}
      {!loading && leftIcon}
      {children != null && <span>{children}</span>}
      {!loading && rightIcon}
    </>
  );
}

/**
 * Button — renders a real <button>, or a Next.js <Link> when `href` is set.
 * Variants: primary | secondary | ghost | danger. Sizes: sm | md | lg.
 */
export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | ButtonLinkProps
>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    className,
    children,
  } = props;

  const classes = cn(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonLinkProps;
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        aria-busy={loading || undefined}
        {...rest}
      >
        <Content loading={loading} leftIcon={leftIcon} rightIcon={rightIcon}>
          {children}
        </Content>
      </Link>
    );
  }

  const { disabled, type, ...rest } = props as ButtonProps;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      <Content loading={loading} leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </Content>
    </button>
  );
});
