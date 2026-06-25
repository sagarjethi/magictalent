/**
 * Content generation: tailored resume summaries, cover letters, and recruiter outreach.
 * AI path with sensible templated heuristic fallbacks (all work with no API key).
 */
import { z } from 'zod';
import type { CandidateProfile, JobSpec } from '../domain/types';
import { completeJSON, complete, aiEnabled } from '../ai/client';
import { normalize } from './keywords';

function matchedSkills(profile: CandidateProfile, job: JobSpec): string[] {
  const set = new Set(profile.skills.map(normalize));
  return [...job.mustHaveSkills, ...job.niceToHaveSkills].filter((s) => set.has(normalize(s)));
}

/** A tailored professional summary aligning the candidate to a specific job. */
export async function tailorResumeSummary(profile: CandidateProfile, job: JobSpec): Promise<string> {
  if (aiEnabled()) {
    try {
      const text = await complete(
        'You are an expert resume writer. Write a concise 2-3 sentence professional summary ' +
          'tailoring the candidate to the target role. Use only the candidate\'s real skills/experience. No preamble.',
        JSON.stringify({ candidate: { headline: profile.headline, skills: profile.skills, yearsExperience: profile.yearsExperience, seniority: profile.seniority, summary: profile.summary }, job: { title: job.title, mustHaveSkills: job.mustHaveSkills } }),
        400,
      );
      if (text.trim()) return text.trim();
    } catch { /* fall through to heuristic */ }
  }
  const rel = matchedSkills(profile, job);
  const relText = rel.length ? rel.slice(0, 5).join(', ') : profile.skills.slice(0, 5).join(', ');
  return (
    `${profile.seniority.charAt(0).toUpperCase()}${profile.seniority.slice(1)} professional with ${profile.yearsExperience}+ years of experience` +
    `${relText ? `, specializing in ${relText}` : ''}. Seeking the ${job.title} role, bringing proven strengths directly aligned to its core requirements.`
  ).trim();
}

/** A tailored cover letter for a specific job. */
export async function draftCoverLetter(profile: CandidateProfile, job: JobSpec): Promise<string> {
  if (aiEnabled()) {
    try {
      const text = await complete(
        'You are an expert career coach. Write a focused, professional cover letter (3 short ' +
          'paragraphs) for the candidate applying to the role. Use only real candidate data. No placeholders other than [Company].',
        JSON.stringify({ candidate: { name: profile.name, headline: profile.headline, skills: profile.skills, yearsExperience: profile.yearsExperience }, job: { title: job.title, mustHaveSkills: job.mustHaveSkills, summary: job.summary } }),
        700,
      );
      if (text.trim()) return text.trim();
    } catch { /* fall through */ }
  }
  const rel = matchedSkills(profile, job);
  const relText = rel.length ? rel.slice(0, 4).join(', ') : profile.skills.slice(0, 4).join(', ');
  return (
    `Dear Hiring Manager,\n\n` +
    `I am excited to apply for the ${job.title} role at [Company]. As a ${profile.headline || profile.seniority + ' engineer'} ` +
    `with ${profile.yearsExperience}+ years of experience, I bring direct strengths in ${relText || 'the required areas'} that map closely to your requirements.\n\n` +
    `In my work I have consistently delivered measurable impact, and I am confident I can do the same for your team. ` +
    `The role's focus on ${(job.mustHaveSkills[0] ?? 'building great software')} aligns well with my background.\n\n` +
    `I would welcome the chance to discuss how I can contribute. Thank you for your consideration.\n\n` +
    `Sincerely,\n${profile.name || 'The Candidate'}`
  );
}

const OutreachSchema = z.object({ subject: z.string(), body: z.string() });

/** A recruiter's personalized first-touch outreach to a sourced candidate. */
export async function draftOutreach(candidate: CandidateProfile, job: JobSpec): Promise<{ subject: string; body: string }> {
  const ai = await completeJSON(
    OutreachSchema,
    'You are a thoughtful technical recruiter writing a short, personalized first-touch ' +
      'outreach message. Reference the candidate\'s real skills and the role. Warm, concise, ' +
      'no spam. Return {subject, body}. Use [Recruiter] as the sign-off placeholder.',
    JSON.stringify({ candidate: { name: candidate.name, headline: candidate.headline, skills: candidate.skills }, job: { title: job.title, mustHaveSkills: job.mustHaveSkills } }),
  );
  if (ai) return ai;

  const rel = matchedSkills(candidate, job);
  const relText = rel.length ? rel.slice(0, 3).join(', ') : candidate.skills.slice(0, 3).join(', ');
  const firstName = (candidate.name || 'there').split(' ')[0];
  return {
    subject: `${job.title} opportunity — your ${relText || 'background'} caught our eye`,
    body:
      `Hi ${firstName},\n\n` +
      `I came across your profile${candidate.headline ? ` (${candidate.headline})` : ''} and was impressed by your experience` +
      `${relText ? ` with ${relText}` : ''}. We're hiring a ${job.title} and I think it could be a strong fit for your background.\n\n` +
      `Would you be open to a quick chat this week? Happy to share more details.\n\n` +
      `Best,\n[Recruiter]`,
  };
}
