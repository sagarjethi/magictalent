'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Building2, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/components/ui';
import { Logo } from '@/components/Logo';

export type Portal = 'seeker' | 'recruiter';

export interface NavItem {
  href: string;
  label: string;
  /** A lucide icon element, e.g. <FileText className="h-4 w-4" />. */
  icon?: React.ReactNode;
}

export interface AppShellProps {
  /** Which portal is currently active — controls the portal switcher state. */
  portal: Portal;
  /** Left-nav links supplied by the portal layout. */
  navItems: NavItem[];
  /** Optional right-aligned top-bar content (e.g. user menu, role switch). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const PORTALS: Record<Portal, { label: string; href: string; icon: React.ReactNode }> = {
  seeker: { label: 'Job Seeker', href: '/seeker', icon: <User className="h-4 w-4" /> },
  recruiter: { label: 'Recruiter', href: '/recruiter', icon: <Building2 className="h-4 w-4" /> },
};

function isActive(pathname: string, href: string): boolean {
  if (href === '/seeker' || href === '/recruiter') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

function PortalSwitcher({ portal }: { portal: Portal }) {
  const other: Portal = portal === 'seeker' ? 'recruiter' : 'seeker';
  return (
    <div
      className="flex items-center rounded-xl bg-slate-100 p-0.5"
      role="group"
      aria-label="Switch portal"
    >
      {(['seeker', 'recruiter'] as Portal[]).map((p) => {
        const active = p === portal;
        const meta = PORTALS[p];
        return (
          <Link
            key={p}
            href={meta.href}
            aria-current={active ? 'true' : undefined}
            title={active ? `${meta.label} (current)` : `Switch to ${meta.label}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[0.625rem] px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-surface text-brand-700 shadow-sm'
                : 'text-ink-faint hover:text-ink',
            )}
          >
            {meta.icon}
            <span className="hidden sm:inline">{meta.label}</span>
          </Link>
        );
      })}
      <span className="sr-only">
        <ArrowLeftRight aria-hidden="true" /> Currently in the {PORTALS[portal].label} portal; switch
        to {PORTALS[other].label}.
      </span>
    </div>
  );
}

function NavLinks({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Portal sections" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-soft hover:bg-slate-100 hover:text-ink',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center',
                active ? 'text-brand-600' : 'text-ink-faint group-hover:text-ink',
              )}
            >
              {item.icon}
            </span>
            {item.label}
            {active && (
              <span
                aria-hidden="true"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * AppShell — the premium, reusable application chrome shared by both portals.
 * Sticky top bar (Jobmagic wordmark + portal switcher), a left sidebar fed by
 * `navItems`, and a content slot. Fully responsive (sidebar collapses into a
 * slide-down menu on mobile) and keyboard accessible (aria-current, focusable
 * controls, ESC to close mobile menu).
 */
export function AppShell({ portal, navItems, actions, children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-3">
          <button
            type="button"
            className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="rounded-lg" aria-label="Jobmagic home">
            <Logo />
          </Link>

          <div className="mx-auto sm:mx-3">
            <PortalSwitcher portal={portal} />
          </div>

          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div
            id="mobile-nav"
            className="border-t border-slate-200 bg-surface px-4 py-3 lg:hidden"
          >
            <NavLinks
              navItems={navItems}
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        )}
      </header>

      {/* Body: sidebar + content */}
      <div className="container-page flex gap-8 py-6 lg:py-8">
        <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-60 shrink-0 lg:block">
          <NavLinks navItems={navItems} pathname={pathname} />
        </aside>

        <main id="main" className="min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
