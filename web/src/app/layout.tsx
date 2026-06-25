import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Jobmagic — AI recruitment for seekers & recruiters',
    template: '%s · Jobmagic',
  },
  description:
    'Jobmagic is an AI-first, agentic recruitment platform. Job seekers find roles that fit and apply with tailored, ATS-safe resumes; recruiters source, rank, and hire — sharing one explainable matching brain.',
  applicationName: 'Jobmagic',
  keywords: [
    'AI recruitment',
    'job matching',
    'ATS resume checker',
    'candidate sourcing',
    'hiring pipeline',
    'career copilot',
  ],
  authors: [{ name: 'Jobmagic' }],
  openGraph: {
    title: 'Jobmagic — AI recruitment for seekers & recruiters',
    description:
      'Two sides, one explainable matching brain. AI-native, agentic, and honest about how every score is made.',
    siteName: 'Jobmagic',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-muted text-ink antialiased">
        {/* Skip link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lift"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
