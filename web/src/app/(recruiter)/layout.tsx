import * as React from 'react';
import { Briefcase, Radar, KanbanSquare, Send, BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

const recruiterNav = [
  { href: '/recruiter', label: 'Requisitions', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/recruiter/find', label: 'Find', icon: <Radar className="h-4 w-4" /> },
  { href: '/recruiter/pipeline', label: 'Pipeline', icon: <KanbanSquare className="h-4 w-4" /> },
  { href: '/recruiter/outreach', label: 'Outreach', icon: <Send className="h-4 w-4" /> },
  { href: '/recruiter/analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portal="recruiter" navItems={recruiterNav}>
      {children}
    </AppShell>
  );
}
