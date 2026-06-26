/**
 * Deterministic demo seed data for Jobmagic.
 *
 * Every object conforms to the domain zod schemas in `@/lib/domain/types`.
 * All timestamps are fixed ISO strings (NO `new Date()`) so the seed is
 * reproducible across runs, CI, and snapshot tests.
 *
 * Owned by the Backend Junior. Read-only contract dependency: domain/types.
 */
import type {
  Application,
  AuditEntry,
  CandidateProfile,
  InterviewSession,
  Job,
  MatchResult,
  OutreachMessage,
  PipelineCard,
  Requisition,
  SeekerProfile,
} from '@/lib/domain/types';

/** Everything the store needs to populate itself. */
export interface SeedData {
  jobs: Job[];
  seekers: SeekerProfile[];
  requisitions: Requisition[];
  pipeline: PipelineCard[];
  applications: Application[];
  outreach: OutreachMessage[];
  interviews: InterviewSession[];
  audit: AuditEntry[];
}

/* Fixed reference timestamps (determinism). */
const T = {
  jun01: '2026-06-01T10:00:00.000Z',
  jun02: '2026-06-02T10:00:00.000Z',
  jun03: '2026-06-03T10:00:00.000Z',
  jun05: '2026-06-05T09:30:00.000Z',
  jun08: '2026-06-08T14:00:00.000Z',
  jun10: '2026-06-10T11:15:00.000Z',
  jun12: '2026-06-12T16:45:00.000Z',
  jun15: '2026-06-15T08:20:00.000Z',
  jun18: '2026-06-18T13:00:00.000Z',
  jun20: '2026-06-20T10:00:00.000Z',
  jun30: '2026-06-30T15:00:00.000Z',
} as const;

/* ─────────────────────────── Jobs ─────────────────────────── */

const jobs: Job[] = [
  {
    id: 'job-1',
    company: 'Northwind Labs',
    source: 'manual',
    postedAt: T.jun01,
    salaryRange: '$150k–$190k',
    spec: {
      title: 'Senior Frontend Engineer',
      seniority: 'senior',
      mustHaveSkills: ['React', 'TypeScript', 'Next.js', 'CSS'],
      niceToHaveSkills: ['GraphQL', 'Tailwind', 'Testing'],
      keywords: ['frontend', 'design systems', 'performance', 'accessibility'],
      minYearsExperience: 5,
      location: 'San Francisco, CA',
      remote: true,
      summary: 'Build delightful, accessible web experiences on a modern React/Next.js stack.',
    },
    rawDescription:
      'Northwind Labs is hiring a Senior Frontend Engineer to lead our design-system and core product UI. ' +
      'You will ship pixel-perfect, accessible React components, drive performance budgets, and mentor mid-level ' +
      'engineers. Strong TypeScript and Next.js experience required; GraphQL and Tailwind are a plus.',
  },
  {
    id: 'job-2',
    company: 'Cobalt Systems',
    source: 'manual',
    postedAt: T.jun01,
    salaryRange: '$160k–$200k',
    spec: {
      title: 'Backend Engineer (Go)',
      seniority: 'senior',
      mustHaveSkills: ['Go', 'PostgreSQL', 'gRPC', 'Docker'],
      niceToHaveSkills: ['Kubernetes', 'Kafka', 'Redis'],
      keywords: ['backend', 'microservices', 'distributed systems', 'APIs'],
      minYearsExperience: 5,
      location: 'Austin, TX',
      remote: true,
      summary: 'Design and operate high-throughput Go microservices powering our payments platform.',
    },
    rawDescription:
      'Cobalt Systems seeks a Backend Engineer fluent in Go to build resilient, low-latency microservices. ' +
      'You will own services end to end: gRPC APIs, PostgreSQL schemas, Dockerized deploys, and on-call. ' +
      'Experience with Kafka and Kubernetes is highly valued.',
  },
  {
    id: 'job-3',
    company: 'Helix AI',
    source: 'manual',
    postedAt: T.jun02,
    salaryRange: '$180k–$230k',
    spec: {
      title: 'Machine Learning Engineer',
      seniority: 'senior',
      mustHaveSkills: ['Python', 'PyTorch', 'MLOps', 'SQL'],
      niceToHaveSkills: ['LLMs', 'Ray', 'Kubernetes'],
      keywords: ['machine learning', 'deep learning', 'model serving', 'data pipelines'],
      minYearsExperience: 4,
      location: 'Remote (US)',
      remote: true,
      summary: 'Train, evaluate, and serve production ML models at scale.',
    },
    rawDescription:
      'Helix AI is looking for an ML Engineer to take models from notebook to production. You will build training ' +
      'and evaluation pipelines in PyTorch, stand up model-serving infrastructure, and partner with research on LLM ' +
      'fine-tuning. Solid Python and MLOps fundamentals are essential.',
  },
  {
    id: 'job-4',
    company: 'Cobalt Systems',
    source: 'manual',
    postedAt: T.jun02,
    salaryRange: '$155k–$195k',
    spec: {
      title: 'DevOps / SRE Engineer',
      seniority: 'mid',
      mustHaveSkills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
      niceToHaveSkills: ['Prometheus', 'Go', 'Datadog'],
      keywords: ['devops', 'sre', 'infrastructure', 'observability', 'reliability'],
      minYearsExperience: 3,
      location: 'Austin, TX',
      remote: false,
      summary: 'Keep our platform fast, observable, and always on.',
    },
    rawDescription:
      'Join Cobalt as a DevOps/SRE engineer owning our Kubernetes platform, Terraform-managed AWS infra, and CI/CD ' +
      'pipelines. You will define SLOs, build observability with Prometheus/Datadog, and automate toil away.',
  },
  {
    id: 'job-5',
    company: 'Brightwave',
    source: 'manual',
    postedAt: T.jun03,
    salaryRange: '$130k–$170k',
    spec: {
      title: 'Full-Stack Engineer',
      seniority: 'mid',
      mustHaveSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      niceToHaveSkills: ['Next.js', 'AWS', 'GraphQL'],
      keywords: ['full-stack', 'product', 'web', 'startup'],
      minYearsExperience: 3,
      location: 'New York, NY',
      remote: true,
      summary: 'Ship product end to end across a TypeScript/React/Node stack.',
    },
    rawDescription:
      'Brightwave is an early-stage startup hiring a Full-Stack Engineer who loves shipping. You will build features ' +
      'across the stack — React frontends, Node.js APIs, and PostgreSQL — and have real ownership over what we build.',
  },
  {
    id: 'job-6',
    company: 'Datastream Inc.',
    source: 'manual',
    postedAt: T.jun03,
    salaryRange: '$145k–$185k',
    spec: {
      title: 'Data Engineer',
      seniority: 'mid',
      mustHaveSkills: ['Python', 'SQL', 'Spark', 'Airflow'],
      niceToHaveSkills: ['dbt', 'Snowflake', 'Kafka'],
      keywords: ['data engineering', 'etl', 'pipelines', 'warehouse'],
      minYearsExperience: 3,
      location: 'Seattle, WA',
      remote: true,
      summary: 'Build reliable data pipelines feeding analytics and ML.',
    },
    rawDescription:
      'Datastream is hiring a Data Engineer to own our batch and streaming pipelines. You will model data in ' +
      'Snowflake, orchestrate with Airflow, transform with Spark and dbt, and ensure data quality across the org.',
  },
  {
    id: 'job-7',
    company: 'Orbit Mobile',
    source: 'manual',
    postedAt: T.jun05,
    salaryRange: '$135k–$175k',
    spec: {
      title: 'Mobile Engineer (React Native)',
      seniority: 'mid',
      mustHaveSkills: ['React Native', 'TypeScript', 'JavaScript', 'REST APIs'],
      niceToHaveSkills: ['Swift', 'Kotlin', 'GraphQL'],
      keywords: ['mobile', 'ios', 'android', 'react native'],
      minYearsExperience: 3,
      location: 'Los Angeles, CA',
      remote: true,
      summary: 'Build a cross-platform mobile app used by millions.',
    },
    rawDescription:
      'Orbit Mobile is hiring a React Native engineer to craft a polished cross-platform experience. You will own ' +
      'features across iOS and Android, integrate REST/GraphQL APIs, and obsess over smooth, native-feeling UX.',
  },
  {
    id: 'job-8',
    company: 'Northwind Labs',
    source: 'manual',
    postedAt: T.jun05,
    salaryRange: '$120k–$160k',
    spec: {
      title: 'Product Designer',
      seniority: 'senior',
      mustHaveSkills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      niceToHaveSkills: ['HTML', 'CSS', 'Accessibility'],
      keywords: ['product design', 'ux', 'ui', 'design systems'],
      minYearsExperience: 5,
      location: 'San Francisco, CA',
      remote: true,
      summary: 'Own the end-to-end design of core product surfaces.',
    },
    rawDescription:
      'Northwind Labs seeks a Senior Product Designer to shape our product from research to polished UI. You will ' +
      'run user research, prototype in Figma, evolve our design system, and partner closely with engineering.',
  },
];

/* ─────────────────────────── Seekers (internal candidate pool) ─────────────────────────── */

function seeker(args: {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  rawResume?: string;
  profile: Omit<CandidateProfile, 'source' | 'sourceId' | 'sourcedAt'>;
}): SeekerProfile {
  const profile: CandidateProfile = {
    ...args.profile,
    source: 'internal-pool',
    sourceId: args.id,
    sourcedAt: args.createdAt,
  };
  return {
    id: args.id,
    name: args.name,
    email: args.email,
    rawResume: args.rawResume ?? '',
    profile,
    createdAt: args.createdAt,
  };
}

const seekers: SeekerProfile[] = [
  seeker({
    id: 'seeker-1',
    name: 'Ava Chen',
    email: 'ava.chen@example.com',
    createdAt: T.jun01,
    rawResume:
      'Ava Chen — Senior Frontend Engineer\n7 years building React/TypeScript products. Led a design-system rewrite ' +
      'at Lumen (Next.js, Tailwind) cutting bundle size 35%. Strong on accessibility and performance.\n' +
      'Skills: React, TypeScript, Next.js, CSS, Tailwind, GraphQL, Testing.',
    profile: {
      id: 'cand-seeker-1',
      name: 'Ava Chen',
      headline: 'Senior Frontend Engineer · React & Next.js',
      skills: ['React', 'TypeScript', 'Next.js', 'CSS', 'Tailwind', 'GraphQL', 'Testing', 'Accessibility'],
      seniority: 'senior',
      yearsExperience: 7,
      location: 'San Francisco, CA',
      openToRemote: true,
      summary: 'Frontend specialist focused on design systems, accessibility, and performance.',
      experience: [
        {
          title: 'Senior Frontend Engineer',
          company: 'Lumen',
          years: 4,
          highlights: ['Led design-system rewrite in Next.js + Tailwind', 'Cut bundle size by 35%'],
        },
        {
          title: 'Frontend Engineer',
          company: 'Pixel Co.',
          years: 3,
          highlights: ['Shipped accessible component library', 'Owned Core Web Vitals improvements'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-2',
    name: 'Marcus Reid',
    email: 'marcus.reid@example.com',
    createdAt: T.jun01,
    rawResume:
      'Marcus Reid — Backend Engineer\n6 years in Go and distributed systems. Built payments microservices at ' +
      'PayForge (Go, gRPC, PostgreSQL, Kafka). Comfortable with Kubernetes and on-call.\n' +
      'Skills: Go, PostgreSQL, gRPC, Docker, Kafka, Kubernetes, Redis.',
    profile: {
      id: 'cand-seeker-2',
      name: 'Marcus Reid',
      headline: 'Backend Engineer · Go & distributed systems',
      skills: ['Go', 'PostgreSQL', 'gRPC', 'Docker', 'Kafka', 'Kubernetes', 'Redis'],
      seniority: 'senior',
      yearsExperience: 6,
      location: 'Austin, TX',
      openToRemote: true,
      summary: 'Backend engineer specializing in high-throughput Go microservices and payments.',
      experience: [
        {
          title: 'Backend Engineer',
          company: 'PayForge',
          years: 4,
          highlights: ['Built gRPC payments services in Go', 'Scaled to 10k req/s with Kafka + Redis'],
        },
        {
          title: 'Software Engineer',
          company: 'Gridline',
          years: 2,
          highlights: ['PostgreSQL schema design', 'Dockerized service deploys'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-3',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    createdAt: T.jun02,
    rawResume:
      'Priya Nair — Machine Learning Engineer\n5 years in ML. Productionized PyTorch models and serving infra at ' +
      'Vectorly. Built training/eval pipelines and fine-tuned LLMs.\nSkills: Python, PyTorch, MLOps, SQL, Ray, LLMs.',
    profile: {
      id: 'cand-seeker-3',
      name: 'Priya Nair',
      headline: 'ML Engineer · PyTorch & MLOps',
      skills: ['Python', 'PyTorch', 'MLOps', 'SQL', 'Ray', 'LLMs', 'Kubernetes'],
      seniority: 'senior',
      yearsExperience: 5,
      location: 'Remote (US)',
      openToRemote: true,
      summary: 'ML engineer taking models from research to reliable production serving.',
      experience: [
        {
          title: 'ML Engineer',
          company: 'Vectorly',
          years: 3,
          highlights: ['Built PyTorch training/eval pipelines', 'Stood up low-latency model serving on Ray'],
        },
        {
          title: 'Data Scientist',
          company: 'Insightly',
          years: 2,
          highlights: ['Shipped recommendation models', 'Owned offline evaluation framework'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-4',
    name: 'Diego Alvarez',
    email: 'diego.alvarez@example.com',
    createdAt: T.jun02,
    profile: {
      id: 'cand-seeker-4',
      name: 'Diego Alvarez',
      headline: 'DevOps / SRE Engineer',
      skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Prometheus', 'Datadog', 'Go'],
      seniority: 'mid',
      yearsExperience: 4,
      location: 'Austin, TX',
      openToRemote: false,
      summary: 'SRE focused on Kubernetes platforms, IaC, and observability.',
      experience: [
        {
          title: 'SRE',
          company: 'Cloudbase',
          years: 3,
          highlights: ['Ran multi-cluster Kubernetes', 'Defined SLOs and Prometheus alerting'],
        },
        {
          title: 'DevOps Engineer',
          company: 'Stacklight',
          years: 1,
          highlights: ['Terraform-managed AWS', 'Built CI/CD pipelines'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-5',
    name: 'Sofia Rossi',
    email: 'sofia.rossi@example.com',
    createdAt: T.jun03,
    profile: {
      id: 'cand-seeker-5',
      name: 'Sofia Rossi',
      headline: 'Full-Stack Engineer · TypeScript',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Next.js', 'GraphQL'],
      seniority: 'mid',
      yearsExperience: 4,
      location: 'New York, NY',
      openToRemote: true,
      summary: 'Full-stack generalist who ships product features end to end.',
      experience: [
        {
          title: 'Full-Stack Engineer',
          company: 'Brightline',
          years: 3,
          highlights: ['Built React + Node features end to end', 'Owned PostgreSQL data model'],
        },
        {
          title: 'Junior Engineer',
          company: 'Webcraft',
          years: 1,
          highlights: ['Shipped customer-facing dashboards'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-6',
    name: 'Liam OConnor',
    email: 'liam.oconnor@example.com',
    createdAt: T.jun03,
    profile: {
      id: 'cand-seeker-6',
      name: "Liam O'Connor",
      headline: 'Data Engineer · Spark & Airflow',
      skills: ['Python', 'SQL', 'Spark', 'Airflow', 'dbt', 'Snowflake'],
      seniority: 'mid',
      yearsExperience: 5,
      location: 'Seattle, WA',
      openToRemote: true,
      summary: 'Data engineer building reliable batch and streaming pipelines.',
      experience: [
        {
          title: 'Data Engineer',
          company: 'Streamhouse',
          years: 3,
          highlights: ['Orchestrated pipelines with Airflow', 'Modeled the warehouse in Snowflake + dbt'],
        },
        {
          title: 'Analytics Engineer',
          company: 'Metricly',
          years: 2,
          highlights: ['Built Spark ETL jobs', 'Improved data quality coverage'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-7',
    name: 'Hana Kim',
    email: 'hana.kim@example.com',
    createdAt: T.jun05,
    profile: {
      id: 'cand-seeker-7',
      name: 'Hana Kim',
      headline: 'Mobile Engineer · React Native',
      skills: ['React Native', 'TypeScript', 'JavaScript', 'REST APIs', 'GraphQL'],
      seniority: 'mid',
      yearsExperience: 4,
      location: 'Los Angeles, CA',
      openToRemote: true,
      summary: 'Mobile engineer shipping polished cross-platform React Native apps.',
      experience: [
        {
          title: 'Mobile Engineer',
          company: 'Tappit',
          years: 3,
          highlights: ['Owned React Native app on iOS + Android', 'Integrated GraphQL APIs'],
        },
        {
          title: 'Frontend Engineer',
          company: 'Appworks',
          years: 1,
          highlights: ['Built reusable RN component kit'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-8',
    name: 'Noah Bennett',
    email: 'noah.bennett@example.com',
    createdAt: T.jun05,
    profile: {
      id: 'cand-seeker-8',
      name: 'Noah Bennett',
      headline: 'Product Designer · Systems & Research',
      skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'Accessibility'],
      seniority: 'senior',
      yearsExperience: 6,
      location: 'San Francisco, CA',
      openToRemote: true,
      summary: 'Product designer connecting research insight to polished, systemized UI.',
      experience: [
        {
          title: 'Senior Product Designer',
          company: 'Foldspace',
          years: 4,
          highlights: ['Built and governed the design system', 'Ran continuous user research'],
        },
        {
          title: 'Product Designer',
          company: 'Mossy',
          years: 2,
          highlights: ['Prototyped and shipped onboarding redesign'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-9',
    name: 'Grace Liu',
    email: 'grace.liu@example.com',
    createdAt: T.jun08,
    profile: {
      id: 'cand-seeker-9',
      name: 'Grace Liu',
      headline: 'Junior Frontend Engineer · React',
      skills: ['React', 'JavaScript', 'CSS', 'TypeScript'],
      seniority: 'junior',
      yearsExperience: 2,
      location: 'Remote (US)',
      openToRemote: true,
      summary: 'Early-career frontend engineer growing fast on the React ecosystem.',
      experience: [
        {
          title: 'Frontend Engineer',
          company: 'Startly',
          years: 2,
          highlights: ['Shipped React features', 'Improved CSS architecture'],
        },
      ],
    },
  }),
  seeker({
    id: 'seeker-10',
    name: 'Omar Haddad',
    email: 'omar.haddad@example.com',
    createdAt: T.jun08,
    profile: {
      id: 'cand-seeker-10',
      name: 'Omar Haddad',
      headline: 'Staff Backend Engineer · Go & Cloud',
      skills: ['Go', 'PostgreSQL', 'gRPC', 'Docker', 'Kubernetes', 'AWS', 'Terraform'],
      seniority: 'staff',
      yearsExperience: 10,
      location: 'Remote (US)',
      openToRemote: true,
      summary: 'Staff backend engineer with deep distributed-systems and platform experience.',
      experience: [
        {
          title: 'Staff Engineer',
          company: 'Hyperscale',
          years: 5,
          highlights: ['Architected multi-region Go services', 'Led platform reliability program'],
        },
        {
          title: 'Senior Backend Engineer',
          company: 'Corewire',
          years: 5,
          highlights: ['Owned gRPC service mesh', 'Scaled PostgreSQL fleet'],
        },
      ],
    },
  }),
];

/* ─────────────────────────── Requisitions ─────────────────────────── */

const requisitions: Requisition[] = [
  {
    id: 'req-1',
    company: 'Northwind Labs',
    status: 'open',
    createdAt: T.jun01,
    ownerId: 'recruiter-demo',
    spec: {
      title: 'Senior Frontend Engineer',
      seniority: 'senior',
      mustHaveSkills: ['React', 'TypeScript', 'Next.js', 'CSS'],
      niceToHaveSkills: ['GraphQL', 'Tailwind', 'Testing'],
      keywords: ['frontend', 'design systems', 'performance', 'accessibility'],
      minYearsExperience: 5,
      location: 'San Francisco, CA',
      remote: true,
      summary: 'Lead frontend for our core product and design system.',
    },
    rawDescription:
      'We are opening a req for a Senior Frontend Engineer to anchor our product UI and design system. ' +
      'Must be excellent at React, TypeScript, and Next.js with a strong eye for accessibility and performance.',
  },
  {
    id: 'req-2',
    company: 'Cobalt Systems',
    status: 'open',
    createdAt: T.jun02,
    ownerId: 'recruiter-demo',
    spec: {
      title: 'Backend Engineer (Go)',
      seniority: 'senior',
      mustHaveSkills: ['Go', 'PostgreSQL', 'gRPC', 'Docker'],
      niceToHaveSkills: ['Kubernetes', 'Kafka', 'Redis'],
      keywords: ['backend', 'microservices', 'distributed systems', 'APIs'],
      minYearsExperience: 5,
      location: 'Austin, TX',
      remote: true,
      summary: 'Grow the backend team behind our payments platform.',
    },
    rawDescription:
      'Open requisition for a senior Go backend engineer to build and operate payments microservices. ' +
      'gRPC, PostgreSQL, and Docker required; Kafka/Kubernetes a strong plus.',
  },
];

/* ─────────────────────────── Match helper (heuristic, deterministic) ─────────────────────────── */

function match(args: {
  overall: number;
  skills: number;
  experience: number;
  keywords: number;
  seniority: number;
  strengths: string[];
  gaps: string[];
  reasoning: string;
}): MatchResult {
  return {
    overall: args.overall,
    breakdown: {
      skills: args.skills,
      experience: args.experience,
      keywords: args.keywords,
      seniority: args.seniority,
    },
    strengths: args.strengths,
    gaps: args.gaps,
    reasoning: args.reasoning,
    mode: 'heuristic',
  };
}

/* ─────────────────────────── Pipeline cards (req-1 Frontend) ─────────────────────────── */

function candOf(seekerId: string): CandidateProfile {
  const s = seekers.find((x) => x.id === seekerId);
  if (!s) throw new Error(`seed: unknown seeker ${seekerId}`);
  return s.profile;
}

const pipeline: PipelineCard[] = [
  {
    id: 'card-1',
    requisitionId: 'req-1',
    candidate: candOf('seeker-1'),
    stage: 'Interview',
    notes: 'Strong design-system background. Scheduled onsite loop.',
    updatedAt: T.jun12,
    match: match({
      overall: 92,
      skills: 95,
      experience: 90,
      keywords: 88,
      seniority: 100,
      strengths: ['Deep React/Next.js + TypeScript', 'Design-system leadership', 'Accessibility focus'],
      gaps: ['Limited GraphQL depth'],
      reasoning: 'Covers all must-have skills, senior level matches, and brings strong design-system experience.',
    }),
  },
  {
    id: 'card-2',
    requisitionId: 'req-1',
    candidate: candOf('seeker-5'),
    stage: 'Screening',
    notes: 'Solid full-stack; verifying frontend depth and seniority.',
    updatedAt: T.jun10,
    match: match({
      overall: 74,
      skills: 78,
      experience: 65,
      keywords: 70,
      seniority: 70,
      strengths: ['TypeScript + React + Next.js', 'End-to-end product delivery'],
      gaps: ['Mid-level vs senior target', 'Less design-system specialization'],
      reasoning: 'Strong skill overlap but slightly under the senior experience bar for this req.',
    }),
  },
  {
    id: 'card-3',
    requisitionId: 'req-1',
    candidate: candOf('seeker-9'),
    stage: 'Sourced',
    notes: 'Promising junior; keep warm for a future opening.',
    updatedAt: T.jun08,
    match: match({
      overall: 52,
      skills: 60,
      experience: 30,
      keywords: 55,
      seniority: 40,
      strengths: ['Genuine React/TypeScript foundation'],
      gaps: ['Only 2 years experience', 'No Next.js or design-system depth'],
      reasoning: 'Good potential but well below the 5-year senior requirement.',
    }),
  },
  {
    id: 'card-4',
    requisitionId: 'req-2',
    candidate: candOf('seeker-2'),
    stage: 'Screening',
    notes: 'Excellent Go/gRPC fit. Setting up technical screen.',
    updatedAt: T.jun15,
    match: match({
      overall: 90,
      skills: 92,
      experience: 88,
      keywords: 90,
      seniority: 90,
      strengths: ['Go + gRPC + PostgreSQL', 'Payments microservices experience', 'Kafka/Kubernetes'],
      gaps: ['On-call expectations to confirm'],
      reasoning: 'Hits every must-have and most nice-to-haves with directly relevant payments experience.',
    }),
  },
];

/* ─────────────────────────── Applications (seeker-5, Sofia) ─────────────────────────── */

const applications: Application[] = [
  {
    id: 'app-1',
    seekerId: 'seeker-5',
    jobId: 'job-5',
    jobTitle: 'Full-Stack Engineer',
    company: 'Brightwave',
    status: 'Interview',
    coverLetter: 'I have shipped React/Node features end to end and would love to do the same at Brightwave.',
    appliedAt: T.jun05,
  },
  {
    id: 'app-2',
    seekerId: 'seeker-5',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer',
    company: 'Northwind Labs',
    status: 'Screening',
    coverLetter: 'Strong TypeScript/React/Next.js background; excited about your design-system work.',
    appliedAt: T.jun10,
  },
  {
    id: 'app-3',
    seekerId: 'seeker-5',
    jobId: 'job-7',
    jobTitle: 'Mobile Engineer (React Native)',
    company: 'Orbit Mobile',
    status: 'Applied',
    coverLetter: 'Comfortable in the React ecosystem and eager to grow into mobile.',
    appliedAt: T.jun18,
  },
];

/* ─────────────────────────── Outreach (drafts) ─────────────────────────── */

const outreach: OutreachMessage[] = [
  {
    id: 'out-1',
    candidateId: 'cand-seeker-1',
    requisitionId: 'req-1',
    subject: 'Senior Frontend Engineer role at Northwind Labs',
    body:
      'Hi Ava,\n\nYour design-system and Next.js work stood out for our Senior Frontend Engineer opening at Northwind ' +
      'Labs. Would you be open to a short intro call this week?\n\nBest,\nRecruiting Team',
    status: 'draft',
    mode: 'heuristic',
    createdAt: T.jun12,
  },
  {
    id: 'out-2',
    candidateId: 'cand-seeker-2',
    requisitionId: 'req-2',
    subject: 'Go Backend role at Cobalt Systems',
    body:
      'Hi Marcus,\n\nYour payments microservices background in Go is a great match for a backend role at Cobalt ' +
      'Systems. Could we find 20 minutes to chat?\n\nBest,\nRecruiting Team',
    status: 'draft',
    mode: 'heuristic',
    createdAt: T.jun15,
  },
];

/* ─────────────────────────── Video interviews ─────────────────────────── */

const interviews: InterviewSession[] = [
  {
    id: 'iv-1',
    requisitionId: 'req-1',
    candidateId: 'cand-seeker-5',
    candidateName: 'Sofia Rossi',
    candidateContact: 'sofia.rossi@example.com',
    jobTitle: 'Senior Frontend Engineer',
    company: 'Northwind Labs',
    recruiterId: 'recruiter-demo',
    scheduledAt: T.jun30,
    durationMins: 45,
    status: 'scheduled',
    invites: [
      {
        channel: 'in-app',
        to: 'cand-seeker-5',
        subject: 'Video interview: Senior Frontend Engineer @ Northwind Labs',
        body: 'You have a 45-minute video interview scheduled. Join from your Interviews tab when it’s time.',
        status: 'sent',
        sentAt: T.jun20,
      },
    ],
    recording: { chunkCount: 0, totalBytes: 0, mimeType: '', durationSec: 0, complete: false },
    transcript: [],
    createdAt: T.jun20,
    updatedAt: T.jun20,
  },
];

/* ─────────────────────────── Audit log ─────────────────────────── */

const audit: AuditEntry[] = [
  { id: 'audit-1', actor: 'recruiter-demo', action: 'requisition.created', target: 'req-1', at: T.jun01 },
  { id: 'audit-2', actor: 'recruiter-demo', action: 'requisition.created', target: 'req-2', at: T.jun02 },
  { id: 'audit-3', actor: 'recruiter-demo', action: 'pipeline.card.moved:Screening', target: 'card-2', at: T.jun10 },
  { id: 'audit-4', actor: 'recruiter-demo', action: 'pipeline.card.moved:Interview', target: 'card-1', at: T.jun12 },
  { id: 'audit-5', actor: 'recruiter-demo', action: 'outreach.drafted', target: 'out-1', at: T.jun12 },
  { id: 'audit-6', actor: 'seeker-5', action: 'application.submitted', target: 'app-2', at: T.jun10 },
  { id: 'audit-7', actor: 'recruiter-demo', action: 'pipeline.card.moved:Screening', target: 'card-4', at: T.jun15 },
];

/* ─────────────────────────── Export ─────────────────────────── */

/**
 * Returns a fresh, deep-enough copy of the deterministic demo dataset.
 * Arrays are rebuilt each call so callers (and the store) can mutate safely
 * without leaking state across `resetRepo()` boundaries in tests.
 */
export function seedData(): SeedData {
  return {
    jobs: jobs.map((j) => ({ ...j, spec: { ...j.spec } })),
    seekers: seekers.map((s) => ({ ...s, profile: { ...s.profile } })),
    requisitions: requisitions.map((r) => ({ ...r, spec: { ...r.spec } })),
    pipeline: pipeline.map((c) => ({ ...c, match: { ...c.match, breakdown: { ...c.match.breakdown } } })),
    applications: applications.map((a) => ({ ...a })),
    outreach: outreach.map((m) => ({ ...m })),
    interviews: interviews.map((iv) => ({
      ...iv,
      invites: iv.invites.map((n) => ({ ...n })),
      recording: { ...iv.recording },
      transcript: iv.transcript.map((t) => ({ ...t })),
    })),
    audit: audit.map((a) => ({ ...a })),
  };
}
