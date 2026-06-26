'use client';

import * as React from 'react';
import {
  Video, VideoOff, Mic, Circle, Square, Sparkles, ArrowLeft, Radio, User, UserCog,
} from 'lucide-react';
import { Button, Badge, Alert, Spinner } from '@/components/ui';
import { apiGet, apiPost, apiPostBinary } from '@/lib/api-client';
import { InterviewReportCard } from '@/components/InterviewReportCard';
import type { InterviewSession, TranscriptSegment } from '@/lib/domain/types';

// The Web Speech API has no DOM lib types; narrow to what we use.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: () => void;
  stop: () => void;
};

const CHUNK_MS = 4000;

export function RoomClient({ interviewId }: { interviewId: string }) {
  const [session, setSession] = React.useState<InterviewSession | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [camOn, setCamOn] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [speaker, setSpeaker] = React.useState<'candidate' | 'interviewer'>('candidate');
  const [transcript, setTranscript] = React.useState<TranscriptSegment[]>([]);
  const [interim, setInterim] = React.useState('');
  const [status, setStatus] = React.useState<string | null>(null);
  const [reporting, setReporting] = React.useState(false);
  const [chunks, setChunks] = React.useState(0);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const chunkIndexRef = React.useRef(0);
  const stoppingRef = React.useRef(false);
  const startTimeRef = React.useRef(0);
  const speakerRef = React.useRef(speaker);
  speakerRef.current = speaker;

  const load = React.useCallback(async () => {
    try {
      const s = await apiGet<InterviewSession>(`/api/interview/${interviewId}`);
      setSession(s);
      setTranscript(s.transcript);
      setChunks(s.recording.chunkCount);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, [interviewId]);

  React.useEffect(() => { void load(); }, [load]);

  // Clean up media on unmount.
  React.useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  }, []);

  async function enableCamera() {
    setStatus(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamOn(true);
    } catch (e) {
      setStatus(`Camera/mic unavailable: ${(e as Error).message}. Check browser permissions.`);
    }
  }

  function startSpeech() {
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike });
    const Recognition = Ctor.SpeechRecognition || Ctor.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('Live transcription not supported in this browser — the call will still record.');
      return;
    }
    const rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        const seg: TranscriptSegment = { speaker: speakerRef.current, text: finalText.trim(), at: new Date().toISOString() };
        setTranscript((prev) => [...prev, seg]);
        setInterim('');
        void apiPost(`/api/interview/${interviewId}/transcript`, { segments: [seg] }).catch(() => undefined);
      }
    };
    rec.onerror = () => undefined;
    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  }

  async function uploadChunk(blob: Blob, last: boolean) {
    if (blob.size === 0 && !last) return;
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idx = chunkIndexRef.current++;
    try {
      await apiPostBinary(`/api/interview/${interviewId}/chunk?index=${idx}&last=${last}&durationSec=${durationSec}`, blob);
      setChunks((c) => c + 1);
    } catch { /* keep recording even if one chunk fails */ }
  }

  async function startRecording() {
    if (!streamRef.current) { await enableCamera(); }
    if (!streamRef.current) return;
    setStatus(null);
    try {
      await apiPost(`/api/interview/${interviewId}/status`, { status: 'in-progress' });
    } catch { /* non-fatal */ }

    chunkIndexRef.current = 0;
    stoppingRef.current = false;
    startTimeRef.current = Date.now();
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorder.ondataavailable = (e) => { void uploadChunk(e.data, stoppingRef.current); };
    recorder.start(CHUNK_MS);
    recorderRef.current = recorder;
    setRecording(true);
    startSpeech();
  }

  function stopRecording() {
    stoppingRef.current = true;
    try { recorderRef.current?.stop(); } catch { /* noop */ }
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setRecording(false);
    setInterim('');
    void load();
  }

  async function generateReport() {
    setReporting(true); setStatus(null);
    try {
      await apiPost(`/api/interview/${interviewId}/report`, {});
      await load();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setReporting(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Alert tone="error">{loadError}</Alert>
        <p className="mt-4 text-sm text-ink-soft">You may need to sign in first. <a className="text-brand-600 underline" href="/login">Go to sign in</a>.</p>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-sm text-ink-soft">
        <Spinner /> Loading interview room…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/recruiter/interviews" className="mb-1 inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </a>
          <h1 className="text-xl font-bold text-ink">{session.jobTitle} · {session.company}</h1>
          <p className="text-sm text-ink-faint">Candidate: {session.candidateName} · {session.durationMins} min</p>
        </div>
        <Badge tone={recording ? 'red' : 'slate'}>
          {recording ? <span className="flex items-center gap-1"><Radio className="h-3.5 w-3.5 animate-pulse" /> Recording</span> : session.status}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Video stage */}
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                <VideoOff className="h-10 w-10" />
                <p className="text-sm">Camera is off</p>
                <Button size="sm" onClick={enableCamera} leftIcon={<Video className="h-4 w-4" />}>Enable camera & mic</Button>
              </div>
            )}
            {recording && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-1 text-xs font-medium text-white">
                <Circle className="h-2.5 w-2.5 fill-current" /> REC · {chunks} chunk(s)
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!recording ? (
              <Button onClick={startRecording} leftIcon={<Circle className="h-4 w-4" />}>Start interview</Button>
            ) : (
              <Button variant="danger" onClick={stopRecording} leftIcon={<Square className="h-4 w-4" />}>End & save</Button>
            )}
            <Button
              variant="ghost"
              loading={reporting}
              onClick={generateReport}
              leftIcon={<Sparkles className="h-4 w-4" />}
              disabled={transcript.length === 0 && chunks === 0}
            >
              Generate AI report
            </Button>
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 p-1 text-xs">
              <button
                onClick={() => setSpeaker('candidate')}
                className={`flex items-center gap-1 rounded px-2 py-1 ${speaker === 'candidate' ? 'bg-brand-600 text-white' : 'text-ink-soft'}`}
              >
                <User className="h-3.5 w-3.5" /> Candidate
              </button>
              <button
                onClick={() => setSpeaker('interviewer')}
                className={`flex items-center gap-1 rounded px-2 py-1 ${speaker === 'interviewer' ? 'bg-brand-600 text-white' : 'text-ink-soft'}`}
              >
                <UserCog className="h-3.5 w-3.5" /> Interviewer
              </button>
            </div>
          </div>

          {status && <Alert tone="warning">{status}</Alert>}
        </div>

        {/* Live transcript */}
        <div className="flex max-h-[70vh] flex-col rounded-2xl border border-slate-200 bg-surface-muted/40">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-ink">
            <Mic className="h-4 w-4 text-brand-600" /> Live transcript
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {transcript.length === 0 && !interim && (
              <p className="text-sm text-ink-faint">Transcript will appear here as people speak. Start the interview to begin capturing.</p>
            )}
            {transcript.map((t, i) => (
              <div key={i} className="text-sm">
                <span className={`mr-1 font-medium ${t.speaker === 'interviewer' ? 'text-accent-600' : 'text-brand-600'}`}>
                  {t.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}:
                </span>
                <span className="text-ink-soft">{t.text}</span>
              </div>
            ))}
            {interim && <p className="text-sm italic text-ink-faint">{interim}…</p>}
          </div>
        </div>
      </div>

      {session.report && (
        <div className="mt-6">
          <InterviewReportCard report={session.report} />
        </div>
      )}
    </div>
  );
}
