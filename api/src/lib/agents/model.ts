/**
 * Model provider for the LangGraph agent layer.
 * Returns a ChatAnthropic instance when keyed, or null so agents fall back to a
 * deterministic policy that drives the same tool graph (graceful degradation).
 */
import { ChatAnthropic } from '@langchain/anthropic';

const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

export function agentModelEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getChatModel(): ChatAnthropic | null {
  if (!agentModelEnabled()) return null;
  return new ChatAnthropic({
    model: MODEL,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0,
    maxTokens: 1500,
  });
}
