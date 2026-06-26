/**
 * /api/interview/[id]/chunk — chunked video upload sink.
 *
 * The browser's MediaRecorder emits the recording in chunks; each is POSTed here as a raw binary
 * body. We tally the chunk protocol (count, bytes, mime, duration) on the session — the MVP store
 * records the transfer rather than persisting blobs, which proves the end-to-end pipe and keeps the
 * swap to real object storage (S3/GCS) a single function change.
 *
 * Query params: ?index=<n>&last=<bool>&durationSec=<n>   Body: binary chunk.  Auth-gated.
 */
import { getRepo } from '@/lib/db';
import { ok, fail, requireUser, handleError } from '../../../_helpers';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    requireUser(req);
    const repo = getRepo();
    const session = repo.getInterview(params.id);
    if (!session) return fail(`Interview ${params.id} not found`, 404);

    const url = new URL(req.url);
    const last = url.searchParams.get('last') === 'true';
    const durationSec = Number(url.searchParams.get('durationSec')) || session.recording.durationSec;

    const buf = await req.arrayBuffer();
    const size = buf.byteLength;
    const mimeType = req.headers.get('content-type') || session.recording.mimeType || 'video/webm';

    const recording = {
      chunkCount: session.recording.chunkCount + 1,
      totalBytes: session.recording.totalBytes + size,
      mimeType,
      durationSec,
      complete: last,
      lastChunkAt: new Date().toISOString(),
    };

    const patch = last && session.status === 'in-progress'
      ? { recording, status: 'recorded' as const }
      : { recording };
    const updated = repo.updateInterview(params.id, patch);
    return ok({ recording: updated?.recording, accepted: size });
  } catch (e) {
    return handleError(e);
  }
}
