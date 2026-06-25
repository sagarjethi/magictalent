import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Search,
  FileCheck2,
  Bot,
  Brain,
  ShieldCheck,
  WifiOff,
  ScrollText,
  Ban,
  Compass,
  Target,
  Send,
  LineChart,
  CheckCircle2,
  Users,
  Briefcase,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  Badge,
  ModeBadge,
  ScoreRing,
  ScoreBar,
  LifecycleSteps,
} from '@/components/ui';
import { Logo } from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main id="main" className="flex-1">
        <Hero />
        <TwoSided />
        <Lifecycle />
        <Agentic />
        <Trust />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ───────────────────────────── Header ───────────────────────────── */

function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-surface/75 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="rounded-lg" aria-label="Jobmagic home">
          <Logo />
        </Link>
        <nav
          aria-label="Primary"
          className="ml-6 hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex"
        >
          <a href="#lifecycle" className="rounded transition-colors hover:text-ink">
            Lifecycle
          </a>
          <a href="#agentic" className="rounded transition-colors hover:text-ink">
            AI & agents
          </a>
          <a href="#trust" className="rounded transition-colors hover:text-ink">
            Trust
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button href="/seeker" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Find a job
          </Button>
          <Button href="/recruiter" variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Start hiring
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-mesh">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
      <div className="container-page relative grid items-center gap-14 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="animate-fade-up">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-first · agentic · two-sided
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            One explainable brain for{' '}
            <span className="text-gradient-brand">both sides</span> of hiring.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Seekers find roles that actually fit and apply with tailored, ATS-safe resumes.
            Recruiters source, rank, and hire real candidates. Same matching engine, same
            transparent score — both directions.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              href="/seeker"
              size="lg"
              variant="primary"
              leftIcon={<Users className="h-5 w-5" />}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              I&apos;m looking for a job
            </Button>
            <Button
              href="/recruiter"
              size="lg"
              variant="secondary"
              leftIcon={<Briefcase className="h-5 w-5" />}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              I&apos;m hiring
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-faint">
            {[
              'Explainable scores',
              'Works offline in heuristic mode',
              'No LinkedIn scraping',
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Hero visual: the shared-brain match card */}
        <div className="animate-fade-up delay-150">
          <HeroMatchCard />
        </div>
      </div>
    </section>
  );
}

function HeroMatchCard() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* floating accent chips */}
      <div className="glass-card absolute -left-4 -top-4 z-20 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink shadow-lift sm:flex">
        <Bot className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Sourcing Agent ran 3 steps
      </div>
      <div className="glass-card absolute -bottom-5 -right-3 z-20 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink shadow-lift sm:flex">
        <Sparkles className="h-4 w-4 text-accent-500" aria-hidden="true" />
        Career Copilot suggested 5 fixes
      </div>

      <Card className="relative z-10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Brain className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Match result
          </div>
          <ModeBadge mode="ai" />
        </div>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={92} size={84} showLabel />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                Sr. Backend Engineer
              </p>
              <p className="truncate text-sm text-ink-faint">Aanya R. · 7 yrs · Remote</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="brand" size="sm">
                  Go
                </Badge>
                <Badge tone="brand" size="sm">
                  Kubernetes
                </Badge>
                <Badge tone="green" size="sm">
                  +6 more
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <ScoreBar label="Skills" value={94} />
            <ScoreBar label="Experience" value={88} />
            <ScoreBar label="Keywords" value={90} />
            <ScoreBar label="Seniority" value={96} />
          </div>

          <div className="rounded-xl bg-surface-muted px-3.5 py-3 text-sm">
            <p className="font-medium text-ink">Why this fits</p>
            <p className="mt-1 text-ink-faint">
              Strong Go + distributed systems depth; led platform teams. Minor gap: limited
              Rust exposure.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ───────────────────────────── Two-sided ───────────────────────────── */

function TwoSided() {
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Two portals, one engine"
          title="Built for both sides of the table"
          description="Most tools serve one side and bolt AI on top. Jobmagic is two-sided by design — and both sides read the same explainable score, so everyone trusts it."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <SideCard
            tone="seeker"
            badge="For job seekers"
            icon={<Users className="h-5 w-5" />}
            title="Find roles that fit — and win them"
            points={[
              { icon: <FileCheck2 className="h-4 w-4" />, text: 'AI parses your resume into a structured profile' },
              { icon: <ShieldCheck className="h-4 w-4" />, text: 'ATS-readiness score (0–100) with concrete fixes' },
              { icon: <Compass className="h-4 w-4" />, text: 'A job feed ranked by match — with “why this fits / gaps”' },
              { icon: <Sparkles className="h-4 w-4" />, text: 'Career Copilot tailors summaries & cover letters' },
            ]}
            cta={{ href: '/seeker', label: 'Enter the seeker portal' }}
          />
          <SideCard
            tone="recruiter"
            badge="For recruiters"
            icon={<Briefcase className="h-5 w-5" />}
            title="Source, rank, and hire with confidence"
            points={[
              { icon: <Target className="h-4 w-4" />, text: 'Paste a JD → AI structures it into a search spec' },
              { icon: <Bot className="h-4 w-4" />, text: 'One click runs the Sourcing Agent across sources' },
              { icon: <Search className="h-4 w-4" />, text: 'Ranked candidate cards with explainable breakdowns' },
              { icon: <Send className="h-4 w-4" />, text: 'AI-drafted outreach + a 7-stage pipeline CRM' },
            ]}
            cta={{ href: '/recruiter', label: 'Enter the recruiter portal' }}
          />
        </div>
      </div>
    </section>
  );
}

function SideCard({
  tone,
  badge,
  icon,
  title,
  points,
  cta,
}: {
  tone: 'seeker' | 'recruiter';
  badge: string;
  icon: React.ReactNode;
  title: string;
  points: { icon: React.ReactNode; text: string }[];
  cta: { href: string; label: string };
}) {
  const seeker = tone === 'seeker';
  return (
    <Card interactive className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-5 p-7">
        <div className="flex items-center gap-3">
          <span
            className={
              seeker
                ? 'inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100'
                : 'inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100'
            }
          >
            {icon}
          </span>
          <Badge tone={seeker ? 'brand' : 'amber'}>{badge}</Badge>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-ink">{title}</h3>
        <ul className="flex flex-1 flex-col gap-3">
          {points.map((p) => (
            <li key={p.text} className="flex items-start gap-3 text-sm text-ink-soft">
              <span
                className={
                  seeker
                    ? 'mt-0.5 text-brand-600'
                    : 'mt-0.5 text-accent-600'
                }
              >
                {p.icon}
              </span>
              {p.text}
            </li>
          ))}
        </ul>
        <Button
          href={cta.href}
          variant={seeker ? 'primary' : 'secondary'}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="mt-2 self-start"
        >
          {cta.label}
        </Button>
      </CardBody>
    </Card>
  );
}

/* ───────────────────────────── Lifecycle ───────────────────────────── */

function Lifecycle() {
  return (
    <section id="lifecycle" className="section scroll-mt-20 bg-surface">
      <div className="container-page">
        <SectionHeading
          eyebrow="The hiring backbone"
          title="One workflow, seven honest stages"
          description="Every requisition flows through the canonical hiring lifecycle. Each stage is an explicit pipeline column and an audited state transition — never a black box."
        />
        <div className="mt-14 rounded-2xl border border-slate-200 bg-surface-muted/60 px-5 py-10 sm:px-10">
          <LifecycleSteps current="screen" showBlurbs />
        </div>
        <p className="mt-6 text-center text-sm text-ink-faint">
          Shown mid-pipeline at <span className="font-medium text-ink">Screen</span> — the same
          stepper powers the recruiter pipeline.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────────── Agentic ───────────────────────────── */

const FEATURES = [
  {
    icon: Brain,
    title: 'The shared brain',
    body: 'A single matching engine scores every (job, candidate) pair symmetrically. Recruiters rank candidates; seekers rank jobs. Same math, same explanation.',
  },
  {
    icon: Bot,
    title: 'Sourcing Agent',
    body: 'A real tool-using agent: parse the JD, fan out to GitHub + your internal talent pool, normalize, dedupe, rank — then propose a shortlist for your review.',
  },
  {
    icon: Sparkles,
    title: 'Career Copilot',
    body: 'A seeker-side agent that cites your real profile to answer “what should I improve, which jobs, how do I tailor this” — drafts proposed, never auto-sent.',
  },
  {
    icon: ScrollText,
    title: 'Explainable by default',
    body: 'Every AI output is structured: score breakdowns, strengths, gaps, reasoning. Never an unexplained number.',
  },
];

function Agentic() {
  return (
    <section id="agentic" className="section scroll-mt-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="AI-native & agentic"
          title="Agents that do the work — and show theirs"
          description="Every heavy action is an agentic step you review and approve. Confirmation over magic: state-changing actions always need a human."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} interactive className="animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardBody className="space-y-3 p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-card">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-ink">{f.title}</h3>
                  <p className="text-sm text-ink-faint">{f.body}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Trust ───────────────────────────── */

const TRUST = [
  {
    icon: ScrollText,
    title: 'Provenance & audit',
    body: 'Every candidate carries its source and timestamp; every state change writes to an audit log. Full traceability, per-record delete.',
  },
  {
    icon: ShieldCheck,
    title: 'Explainable scores',
    body: 'A deterministic breakdown (skills · experience · keywords · seniority) means both sides see — and can challenge — exactly how a score was made.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    body: 'No AI key? Every feature falls back to a deterministic heuristic and the UI labels the mode. Fully usable in CI and air-gapped.',
  },
  {
    icon: Ban,
    title: 'No LinkedIn scraping',
    body: 'We source from official APIs (GitHub) and your own opted-in talent pool. Gray-area scraping is gated off — by design, for legal reasons.',
  },
];

function Trust() {
  return (
    <section id="trust" className="section scroll-mt-20 bg-surface">
      <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Trust, not vibes"
            title="Honest AI you can actually defend"
            description="Recruitment decisions affect real careers. Jobmagic is built so a principal engineer, a recruiter, and a candidate can all trust the same result."
          />
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-surface-muted px-4 py-3">
            <span className="text-sm text-ink-soft">Every result is labelled:</span>
            <ModeBadge mode="ai" />
            <ModeBadge mode="heuristic" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRUST.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="rounded-2xl border border-slate-200 bg-surface-muted/50 p-5"
              >
                <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-ink">{t.title}</h3>
                <p className="mt-1.5 text-sm text-ink-faint">{t.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Final CTA ───────────────────────────── */

function FinalCta() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-950 px-6 py-16 text-center sm:px-16">
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                'radial-gradient(30rem 20rem at 15% 0%, #6366f1, transparent 60%), radial-gradient(28rem 22rem at 100% 100%, #f97316, transparent 55%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pick your side. Same brain, either way.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-200">
              Jump into a fully working demo — seeded data, no signup, no API key required.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                href="/seeker"
                size="lg"
                variant="primary"
                className="bg-white text-brand-700 hover:bg-brand-50"
                leftIcon={<Users className="h-5 w-5" />}
              >
                I&apos;m looking for a job
              </Button>
              <Button
                href="/recruiter"
                size="lg"
                variant="ghost"
                className="border border-white/25 text-white hover:bg-white/10"
                leftIcon={<Briefcase className="h-5 w-5" />}
              >
                I&apos;m hiring
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Footer ───────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-xs text-sm text-ink-faint">
            AI-first, agentic recruitment. Two sides, one explainable matching brain.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Seekers
            </span>
            <Link href="/seeker" className="text-ink-soft hover:text-ink">
              Seeker portal
            </Link>
            <Link href="/seeker/ats" className="text-ink-soft hover:text-ink">
              ATS check
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Recruiters
            </span>
            <Link href="/recruiter" className="text-ink-soft hover:text-ink">
              Recruiter portal
            </Link>
            <Link href="/recruiter/find" className="text-ink-soft hover:text-ink">
              Source candidates
            </Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Jobmagic. A demo product.</p>
          <p className="inline-flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5" aria-hidden="true" />
            Heuristic mode works with zero configuration.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────────── Shared ───────────────────────────── */

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-lg text-ink-soft">{description}</p>}
    </div>
  );
}
