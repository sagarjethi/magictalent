import * as React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation + border accent. Use for clickable/linked cards. */
  interactive?: boolean;
  /** Removes the default border for a flatter surface. */
  flush?: boolean;
}

/** Elevated surface container. Compose with CardHeader / CardBody / CardFooter. */
export function Card({ interactive, flush, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface shadow-card',
        !flush && 'border border-slate-200',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  );
}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({
  as: Tag = 'h3',
  className,
  ...props
}: CardTitleProps) {
  return (
    <Tag
      className={cn('text-base font-semibold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-t border-slate-100 px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  );
}
