/**
 * Model provider for the LangGraph agent layer.
 *
 * Returns a chat model for the active provider (xAI/Grok via ChatOpenAI's OpenAI-compatible
 * client, or Anthropic via ChatAnthropic), or null so agents fall back to a deterministic
 * policy that drives the same tool graph (graceful degradation).
 *
 * Provider + model selection is delegated to the AI client (AI_PROVIDER / XAI_* / ANTHROPIC_* /
 * AI_MODEL env), so both the JSON path (completeJSON) and this tool-calling path stay in lockstep.
 */
import 'server-only';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { activeProvider, aiInfo } from '@/lib/ai/client';

const DEFAULT_XAI_BASE_URL = 'https://api.x.ai/v1';
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 1500;

export function agentModelEnabled(): boolean {
  return activeProvider() !== 'none';
}

export function getChatModel(): ChatAnthropic | ChatOpenAI | null {
  const provider = activeProvider();
  const { model } = aiInfo();
  if (provider === 'none' || !model) return null;

  if (provider === 'xai') {
    return new ChatOpenAI({
      model,
      apiKey: process.env.XAI_API_KEY,
      temperature: 0,
      maxTokens: MAX_TOKENS,
      configuration: { baseURL: process.env.XAI_BASE_URL?.trim() || DEFAULT_XAI_BASE_URL },
    });
  }

  return new ChatAnthropic({
    model,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0,
    maxTokens: MAX_TOKENS,
  });
}
