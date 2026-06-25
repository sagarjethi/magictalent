/**
 * AI client — Anthropic wrapper with retry, robust JSON parsing, and graceful degradation.
 * Server-only. Callers ALWAYS provide a heuristic fallback so the product works with no API key.
 */
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
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

export async function complete(system: string, user: string, maxTokens = 1024): Promise<string> {
  const res = await withRetry(() =>
    client().messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  );
  return res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
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
