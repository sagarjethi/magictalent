import type { Metadata } from 'next';
import { PageHeader } from '../../_components/PageHeader';
import { CopilotChat } from './CopilotChat';

export const metadata: Metadata = { title: 'Career Copilot' };

export default function CopilotPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Career Copilot"
        title="Your agentic job-search partner"
        description="Powered by a LangGraph agent that cites your real data. It shows its reasoning and proposes next steps — confirmation over magic."
      />
      <CopilotChat />
    </div>
  );
}
