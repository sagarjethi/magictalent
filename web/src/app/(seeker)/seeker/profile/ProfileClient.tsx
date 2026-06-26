'use client';

import * as React from 'react';
import { Wand2, Briefcase, MapPin, Layers } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  ModeBadge,
  Alert,
} from '@/components/ui';
import { apiPost, getCurrentSeekerId } from '@/lib/api-client';
import type { SeekerProfile } from '@/lib/domain/types';

export function ProfileClient({ initial }: { initial: SeekerProfile | null }) {
  const [profile, setProfile] = React.useState<SeekerProfile | null>(initial);
  const [name, setName] = React.useState(initial?.name ?? '');
  const [email, setEmail] = React.useState(initial?.email ?? '');
  const [location, setLocation] = React.useState(initial?.profile.location ?? '');
  const [resume, setResume] = React.useState(initial?.rawResume ?? '');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'saved' | 'error'>('idle');
  const [error, setError] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const saved = await apiPost<SeekerProfile>('/api/seeker/profile', {
        id: getCurrentSeekerId(),
        name,
        email: email || '',
        location: location || undefined,
        rawResume: resume,
      });
      setProfile(saved);
      setStatus('saved');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update your profile</CardTitle>
          <p className="text-sm text-ink-faint">
            Paste your resume and our parser structures it into a matcher-ready profile. Confirmation
            over magic — review the parsed result before relying on it.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4" aria-busy={status === 'loading'}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Lee"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                hint="Optional"
              />
            </div>
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote (US) · New York, NY"
              hint="Optional"
            />
            <Textarea
              label="Resume text"
              required
              rows={10}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your full resume here — experience, skills, summary…"
              hint="Plain text works best. We never auto-send anything on your behalf."
            />

            {status === 'error' && (
              <Alert tone="error" title="Couldn't parse your resume">
                {error}
              </Alert>
            )}
            {status === 'saved' && (
              <Alert tone="success" title="Profile updated">
                Your parsed profile is shown on the right.
              </Alert>
            )}

            <Button
              type="submit"
              loading={status === 'loading'}
              disabled={!name || !resume}
              leftIcon={<Wand2 className="h-4 w-4" />}
            >
              {status === 'loading' ? 'Parsing…' : 'Parse & save profile'}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Parsed result */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Parsed profile</CardTitle>
          {profile && <ModeBadge mode="heuristic" />}
        </CardHeader>
        <CardBody>
          {!profile ? (
            <p className="py-8 text-center text-sm text-ink-faint">
              Your structured, matcher-ready profile will appear here after parsing.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-semibold text-ink">{profile.name}</p>
                {profile.profile.headline && (
                  <p className="text-sm text-ink-soft">{profile.profile.headline}</p>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-ink-soft">
                  <Layers className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  <span className="capitalize">{profile.profile.seniority}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-soft">
                  <Briefcase className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  <span>{profile.profile.yearsExperience} yrs experience</span>
                </div>
                {profile.profile.location && (
                  <div className="col-span-2 flex items-center gap-2 text-ink-soft">
                    <MapPin className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                    <span>{profile.profile.location}</span>
                  </div>
                )}
              </dl>

              {profile.profile.summary && (
                <p className="rounded-xl bg-surface-muted px-3.5 py-3 text-sm text-ink-soft">
                  {profile.profile.summary}
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Skills ({profile.profile.skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.profile.skills.length === 0 ? (
                    <span className="text-sm text-ink-faint">No skills detected.</span>
                  ) : (
                    profile.profile.skills.map((s) => (
                      <Badge key={s} tone="brand" size="sm">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {profile.profile.experience.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Experience
                  </p>
                  <ul className="space-y-2.5">
                    {profile.profile.experience.map((x, i) => (
                      <li key={i} className="rounded-xl border border-slate-200 p-3">
                        <p className="text-sm font-medium text-ink">
                          {x.title}
                          {x.company && <span className="text-ink-faint"> · {x.company}</span>}
                        </p>
                        {x.years > 0 && <p className="text-xs text-ink-faint">{x.years} yrs</p>}
                        {x.highlights.length > 0 && (
                          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-ink-soft">
                            {x.highlights.map((h, j) => (
                              <li key={j}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
