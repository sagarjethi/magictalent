'use client';

import * as React from 'react';
import { Sparkles, Send, User } from 'lucide-react';
import { Card, CardBody, Button, Textarea, Alert, Spinner, Badge } from '@/components/ui';
import { apiPost, getCurrentSeekerId } from '@/lib/api-client';
import type { AgentStep, ResultMode } from '@/lib/domain/types';
import { AgentTrace } from '../../_components/AgentTrace';

interface Turn {
  id: number;
  question: string;
  answer?: string;
  steps?: AgentStep[];
  mode?: ResultMode;
  error?: string;
  loading: boolean;
}

const SUGGESTIONS = [
  'Which jobs am I the strongest match for, and why?',
  'What skills should I add to land a senior frontend role?',
  'How should I tailor my resume for the Northwind Labs role?',
];

export function CopilotChat() {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const nextId = React.useRef(1);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const id = nextId.current++;
    setBusy(true);
    setInput('');
    setTurns((t) => [...t, { id, question: q, loading: true }]);
    try {
      const res = await apiPost<{ mode: ResultMode; steps: AgentStep[]; answer: string }>(
        '/api/agent/copilot',
        { seekerId: getCurrentSeekerId(), question: q },
      );
      setTurns((t) =>
        t.map((x) =>
          x.id === id ? { ...x, loading: false, answer: res.answer, steps: res.steps, mode: res.mode } : x,
        ),
      );
    } catch (err) {
      setTurns((t) =>
        t.map((x) => (x.id === id ? { ...x, loading: false, error: (err as Error).message } : x)),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0">
        {turns.length === 0 ? (
          <Card>
            <CardBody className="space-y-4 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-card">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Ask your Career Copilot</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-ink-faint">
                  A LangGraph agent that reasons over your real profile and the live job feed. It
                  proposes — it never auto-sends. Try one of these:
                </p>
              </div>
              <div className="mx-auto flex max-w-md flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-left text-sm text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-5">
            {turns.map((turn) => (
              <div key={turn.id} className="space-y-3">
                {/* Question */}
                <div className="flex justify-end">
                  <div className="flex max-w-[85%] items-start gap-2.5">
                    <p className="rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
                      {turn.question}
                    </p>
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                {/* Answer */}
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-white">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    {turn.loading && (
                      <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-surface px-4 py-2.5 text-sm text-ink-faint shadow-card ring-1 ring-slate-200">
                        <Spinner size={16} label="Copilot is thinking" />
                        The agent is reasoning over your profile…
                      </div>
                    )}
                    {turn.error && (
                      <Alert tone="error" title="The Copilot hit an error">
                        {turn.error}
                      </Alert>
                    )}
                    {turn.answer && (
                      <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm leading-relaxed text-ink shadow-card ring-1 ring-slate-200">
                        <p className="whitespace-pre-wrap">{turn.answer}</p>
                      </div>
                    )}
                    {turn.steps && turn.steps.length > 0 && (
                      <AgentTrace
                        steps={turn.steps}
                        mode={turn.mode}
                        title="Career Copilot reasoning"
                        defaultOpen={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="mt-5"
        >
          <Textarea
            label="Your question"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="Ask about your matches, skill gaps, or how to tailor an application…"
            hint="Press ⌘/Ctrl + Enter to send."
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" loading={busy} disabled={!input.trim()} leftIcon={<Send className="h-4 w-4" />}>
              Ask Copilot
            </Button>
          </div>
        </form>
      </div>

      {/* Side rail */}
      <aside className="space-y-4">
        <Card>
          <CardBody className="space-y-3">
            <Badge tone="brand" icon={<Sparkles className="h-3 w-3" />}>
              LangGraph agent
            </Badge>
            <h3 className="text-sm font-semibold text-ink">How it works</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>Reads your parsed profile and the live job feed.</li>
              <li>Ranks with the same shared matching brain.</li>
              <li>Shows every step it took — fully transparent.</li>
              <li>Drafts proposals only; nothing is sent for you.</li>
            </ul>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
