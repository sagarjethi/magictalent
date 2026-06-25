import type { Metadata } from 'next';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../../(seeker)/_components/PageHeader';
import { OutreachClient } from './OutreachClient';

export const metadata: Metadata = { title: 'Outreach' };
export const dynamic = 'force-dynamic';

export default function OutreachPage() {
  const repo = getRepo();
  const messages = repo.listOutreach();
  const candidates = repo.internalCandidatePool().map((c) => ({ id: c.id, name: c.name }));
  const requisitions = repo
    .listRequisitions()
    .map((r) => ({ id: r.id, label: `${r.spec.title} · ${r.company}` }));

  return (
    <div>
      <PageHeader
        eyebrow="Outreach"
        title="First-touch messages, drafted for you"
        description="AI-drafted (or heuristic) outreach you review and edit. Honest by design: no email is sent in this MVP — drafts are stored and audited only."
      />
      <OutreachClient initialMessages={messages} candidates={candidates} requisitions={requisitions} />
    </div>
  );
}
