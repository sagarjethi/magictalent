/**
 * AI client — provider-agnostic LLM wrapper with retry, robust JSON parsing, and graceful degradation.
 * Server-only. Callers ALWAYS provide a heuristic fallback so the product works with no API key.
 *
 * Providers (fully configurable, in priority order):
 *   • xAI / Grok  — OpenAI-compatible HTTP API (no SDK dependency, uses fetch)
 *   • Anthropic   — via @anthropic-ai/sdk
 *   • none        — every AI call returns null → callers fall back to deterministic heuristics
 *
 * Configuration knobs (all optional, override at any level):
 *   AI_PROVIDER     'xai' | 'grok' | 'anthropic' | 'claude' | 'none' | 'auto' (default: auto)
 *   AI_MODEL        generic model id override for the active provider
 *   XAI_API_KEY     xAI key; presence selects xAI in auto mode
 *   XAI_MODEL       xAI model id (default: grok-4)
 *   XAI_BASE_URL    xAI base URL (default: https://api.x.ai/v1)
 *   ANTHROPIC_API_KEY / ANTHROPIC_MODEL  Anthropic equivalents (default model: claude-sonnet-4-6)
 *   AI_MAX_TOKENS   hard cap applied to every request (optional)
 */
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export type AiProvider = 'xai' | 'anthropic' | 'none';

const DEFAULT_XAI_MODEL = 'grok-4';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const DEFAULT_XAI_BASE_URL = 'https://api.x.ai/v1';

/** What the operator asked for (env), independent of whether a key is actually present. */
function configuredProvider(): AiProvider | 'auto' {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'xai' || explicit === 'grok' || explicit === 'x') return 'xai';
  if (explicit === 'anthropic' || explicit === 'claude') return 'anthropic';
  if (explicit === 'none' || explicit === 'off') return 'none';
  return 'auto';
}

function keyFor(p: AiProvider): string | undefined {
  if (p === 'xai') return process.env.XAI_API_KEY?.trim() || undefined;
  if (p === 'anthropic') return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
  return undefined;
}

/** Model id for a provider. Precedence: provider-specific env → generic AI_MODEL → built-in default. */
function modelFor(p: AiProvider): string {
  if (p === 'xai') return process.env.XAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || DEFAULT_XAI_MODEL;
  if (p === 'anthropic') return process.env.ANTHROPIC_MODEL?.trim() || process.env.AI_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  return '';
}

/** The provider that will actually be used: respects AI_PROVIDER, falls back to whichever key exists. */
export function activeProvider(): AiProvider {
  const cfg = configuredProvider();
  if (cfg === 'none') return 'none';
  if (cfg === 'xai' || cfg === 'anthropic') return keyFor(cfg) ? cfg : 'none';
  // auto: prefer xAI when its key is present, else Anthropic
  if (keyFor('xai')) return 'xai';
  if (keyFor('anthropic')) return 'anthropic';
  return 'none';
}

export function aiEnabled(): boolean {
  return activeProvider() !== 'none';
}

/** Diagnostic surface for /health and UI badges — never leaks the key. */
export function aiInfo(): { provider: AiProvider; model: string | null } {
  const p = activeProvider();
  return { provider: p, model: p === 'none' ? null : modelFor(p) };
}

function capTokens(maxTokens: number): number {
  const cap = Number(process.env.AI_MAX_TOKENS);
  return Number.isFinite(cap) && cap > 0 ? Math.min(maxTokens, cap) : maxTokens;
}

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

/** Extract the first JSON object/array from a model response, tolerating code fences and prose. */
export function parseJsonResponse(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error('No JSON found in AI response');
  // Walk to the matching close bracket so trailing prose is ignored.
  const open = candidate[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === open) depth++;
    else if (candidate[i] === close) {
      depth--;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1));
    }
  }
  return JSON.parse(candidate.slice(start)); // last resort
}

/** xAI / Grok via the OpenAI-compatible /chat/completions endpoint (no SDK needed). */
async function xaiComplete(system: string, user: string, maxTokens: number): Promise<string> {
  const base = (process.env.XAI_BASE_URL?.trim() || DEFAULT_XAI_BASE_URL).replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelFor('xai'),
      max_tokens: maxTokens,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`xAI ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

async function anthropicComplete(system: string, user: string, maxTokens: number): Promise<string> {
  const res = await anthropic().messages.create({
    model: modelFor('anthropic'),
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
}

/** Single completion against the active provider. Throws if no provider is configured. */
export async function complete(system: string, user: string, maxTokens = 1024): Promise<string> {
  const provider = activeProvider();
  if (provider === 'none') throw new Error('No AI provider configured');
  const tokens = capTokens(maxTokens);
  return withRetry(() =>
    provider === 'xai' ? xaiComplete(system, user, tokens) : anthropicComplete(system, user, tokens),
  );
}

/**
 * Ask the model for JSON and validate it against a zod schema.
 * Returns null on any failure so callers can fall back to a heuristic — never throws to the route.
 */
export async function completeJSON<T>(schema: z.ZodType<T>, system: string, user: string, maxTokens = 1500): Promise<T | null> {
  if (!aiEnabled()) return null;
  try {
    const text = await complete(`${system}\nRespond with ONLY valid JSON. No prose, no code fences.`, user, maxTokens);
    const parsed = parseJsonResponse(text);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
