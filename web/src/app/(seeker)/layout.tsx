import * as React from 'react';
import { LayoutDashboard, FileText, ShieldCheck, Compass, ClipboardList, Sparkles, MessagesSquare } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { AuthProvider, AuthGate, UserMenu } from '@/lib/auth-context';

const seekerNav = [
  { href: '/seeker', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/seeker/profile', label: 'Profile', icon: <FileText className="h-4 w-4" /> },
  { href: '/seeker/ats', label: 'ATS Check', icon: <ShieldCheck className="h-4 w-4" /> },
  { href: '/seeker/jobs', label: 'Jobs', icon: <Compass className="h-4 w-4" /> },
  { href: '/seeker/prep', label: 'Interview Prep', icon: <MessagesSquare className="h-4 w-4" /> },
  { href: '/seeker/applications', label: 'Applications', icon: <ClipboardList className="h-4 w-4" /> },
  { href: '/seeker/copilot', label: 'Career Copilot', icon: <Sparkles className="h-4 w-4" /> },
];

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell portal="seeker" navItems={seekerNav} actions={<UserMenu />}>
        <AuthGate role="seeker">{children}</AuthGate>
      </AppShell>
    </AuthProvider>
  );
}
