/**
 * The real LlmProvider: Anthropic Messages API, called directly from the browser
 * (BYOK, no proxy — see ARCHITECTURE.md). Streaming is a UI-layer concern; this
 * returns a full turn, which is what the tool-use loop needs.
 *
 * Not unit-tested (needs a key + network); the pure mapping it relies on is.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ModelChoice } from '../config/config';
import { fromApiContent, toApiMessages, toApiTools } from './anthropic-map';
import type { LlmProvider, ProviderRequest, ProviderTurn } from './types';

// The current latest Opus and Sonnet. From the Claude 4.6 generation on, the
// dateless IDs are pinned snapshots — there is NO evergreen "-latest" alias
// (Anthropic dropped it for stability + prompt caching). So "always latest" means
// bumping these two strings when a newer Opus/Sonnet ships. This is the only place.
const OPUS = 'claude-opus-4-8';
const SONNET = 'claude-sonnet-4-6';

export function modelId(choice: ModelChoice): string {
  return choice === 'opus' ? OPUS : SONNET;
}

export interface AnthropicOptions {
  apiKey: string;
  model: ModelChoice;
  maxTokens?: number;
  webSearch?: boolean;
}

export class AnthropicProvider implements LlmProvider {
  private readonly client: Anthropic;
  private readonly opts: AnthropicOptions;

  constructor(opts: AnthropicOptions) {
    this.client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
    this.opts = opts;
  }

  async run(req: ProviderRequest): Promise<ProviderTurn> {
    const res = await this.client.messages.create({
      model: modelId(this.opts.model),
      max_tokens: this.opts.maxTokens ?? 8192,
      system: req.system,
      // wire shapes are correct; cast isolates us from SDK param-type churn
      messages: toApiMessages(req.messages) as never,
      tools: toApiTools(req.tools, this.opts.webSearch ?? true) as never,
    });
    return {
      content: fromApiContent(res.content as unknown as Array<Record<string, unknown>>),
      stopReason: res.stop_reason ?? '',
    };
  }

  async runStream(req: ProviderRequest, onDelta: (text: string) => void): Promise<ProviderTurn> {
    const stream = this.client.messages.stream({
      model: modelId(this.opts.model),
      max_tokens: this.opts.maxTokens ?? 8192,
      system: req.system,
      messages: toApiMessages(req.messages) as never,
      tools: toApiTools(req.tools, this.opts.webSearch ?? true) as never,
    });
    stream.on('text', (delta: string) => onDelta(delta));
    const final = await stream.finalMessage();
    return {
      content: fromApiContent(final.content as unknown as Array<Record<string, unknown>>),
      stopReason: final.stop_reason ?? '',
    };
  }
}
