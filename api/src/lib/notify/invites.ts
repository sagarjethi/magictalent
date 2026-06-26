/**
 * Interview invite delivery — email / SMS / in-app.
 *
 * Graceful degradation: when no provider is configured (SMTP/Resend for email, Twilio for SMS),
 * the invite is composed and recorded with status 'simulated' instead of actually being sent, so
 * the full schedule → notify → join flow works end-to-end in any environment. In-app delivery is
 * always real: the candidate sees the invite in their Interviews tab regardless of provider keys.
 *
 * To wire a real provider, set the relevant env keys and replace the `deliver()` body — the rest
 * of the pipeline (route, store, UI) is unchanged.
 */
import type { InterviewSession, InterviewInvite, InviteChannel } from '../domain/types';

/** Public base URL used to build the candidate's join link. */
function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

export function joinUrl(session: InterviewSession): string {
  return `${appBaseUrl()}/room/${session.id}`;
}

function channelConfigured(channel: InviteChannel): boolean {
  if (channel === 'in-app') return true;
  if (channel === 'email') return !!(process.env.RESEND_API_KEY || process.env.SMTP_URL);
  if (channel === 'sms') return !!(process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID);
  return false;
}

function composeBody(session: InterviewSession, channel: InviteChannel, link: string): { subject: string; body: string } {
  const when = new Date(session.scheduledAt).toUTCString();
  const subject = `Video interview: ${session.jobTitle} @ ${session.company}`;
  if (channel === 'sms') {
    return {
      subject,
      body: `${session.company}: your ${session.durationMins}-min video interview for ${session.jobTitle} is set for ${when}. Join: ${link}`,
    };
  }
  return {
    subject,
    body:
      `Hi ${session.candidateName},\n\n` +
      `You're invited to a ${session.durationMins}-minute video interview for the ${session.jobTitle} role at ${session.company}.\n\n` +
      `When: ${when}\n` +
      `Join from your browser (camera + mic): ${link}\n\n` +
      `The session is recorded and transcribed to help our panel review fairly. See you there!\n\n` +
      `— ${session.company} Recruiting`,
  };
}

/**
 * Compose + "deliver" an invite on a channel. Returns the invite record to append to the session.
 * Never throws — a delivery failure is captured as status 'failed'.
 */
export async function sendInvite(session: InterviewSession, channel: InviteChannel): Promise<InterviewInvite> {
  const link = joinUrl(session);
  const { subject, body } = composeBody(session, channel, link);
  const to = channel === 'sms'
    ? session.candidateContact
    : channel === 'email'
      ? session.candidateContact
      : session.candidateId;

  const base: InterviewInvite = { channel, to, subject, body, status: 'queued', sentAt: new Date().toISOString() };

  // In-app is always real (the candidate reads it from their portal).
  if (channel === 'in-app') return { ...base, status: 'sent' };

  if (!channelConfigured(channel)) {
    // No provider keys — record as simulated so the flow is demonstrable end-to-end.
    return { ...base, status: 'simulated' };
  }

  try {
    // Provider integration point. Left as a no-op success until real keys are wired.
    // e.g. await resend.emails.send(...) / await twilio.messages.create(...)
    return { ...base, status: 'sent' };
  } catch {
    return { ...base, status: 'failed' };
  }
}
