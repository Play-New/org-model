/**
 * The real LlmProvider: Anthropic Messages API, called directly from the browser
 * (BYOK, no proxy — see CLAUDE.md, Architecture). Streaming is a UI-layer concern; this
 * returns a full turn, which is what the tool-use loop needs.
 *
 * Not unit-tested (needs a key + network); the pure mapping it relies on is.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ModelChoice } from '../config/config';
import { fromApiContent, toApiMessages, toApiTools, usesFiles } from './anthropic-map';
import type { LlmProvider, ProviderRequest, ProviderTurn } from './types';

// The current latest Opus and Sonnet. From the Claude 4.6 generation on, the
// dateless IDs are pinned snapshots — there is NO evergreen "-latest" alias
// (Anthropic dropped it for stability + prompt caching). So "always latest" means
// bumping these two strings when a newer Opus/Sonnet ships. This is the only place.
const OPUS = 'claude-opus-4-8';
const SONNET = 'claude-sonnet-4-6';

// Files API: upload a document once, reference it by id — no per-request size
// limit, so large PDFs go through. The beta is sent only on the calls that use it.
const FILES_BETA = 'files-api-2025-04-14';
const filesOpts = { headers: { 'anthropic-beta': FILES_BETA } };

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
    // maxRetries: 4 — the SDK retries 429 / 5xx / overloaded with exponential
    // backoff. The default is 2; bump it for flaky BYOK-from-the-browser calls.
    this.client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true, maxRetries: 4 });
    this.opts = opts;
  }

  /** Upload a document to the Files API; returns its file id for a document block. */
  async uploadFile(file: Blob): Promise<string> {
    const res = await this.client.beta.files.upload({ file } as never, filesOpts);
    return (res as { id: string }).id;
  }

  /**
   * Build the request params shared by run() and runStream() so the two stay
   * identical. Two prompt-caching breakpoints (max 4; render order is
   * tools → system → messages):
   *  (a) system as a one-block array — caches tools + system together;
   *  (b) a rolling breakpoint on the last content block of the last message —
   *      caches the growing conversation prefix.
   * Adaptive thinking is on; with Opus 4.8 the thinking text is empty by default
   * but the block + signature still round-trip (see anthropic-map).
   */
  private params(req: ProviderRequest): Record<string, unknown> {
    const apiMessages = toApiMessages(req.messages);
    const lastMsg = apiMessages[apiMessages.length - 1];
    if (lastMsg && lastMsg.content.length > 0) {
      const lastBlock = lastMsg.content[lastMsg.content.length - 1] as unknown as Record<string, unknown>;
      lastBlock.cache_control = { type: 'ephemeral' };
    }
    return {
      model: modelId(this.opts.model),
      max_tokens: this.opts.maxTokens ?? 32000,
      system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
      thinking: { type: 'adaptive' },
      // wire shapes are correct; cast isolates us from SDK param-type churn
      messages: apiMessages as never,
      tools: toApiTools(req.tools, this.opts.webSearch ?? true) as never,
    };
  }

  async run(req: ProviderRequest): Promise<ProviderTurn> {
    const res = await this.client.messages.create(
      this.params(req) as never,
      usesFiles(req.messages) ? filesOpts : undefined,
    );
    return {
      content: fromApiContent(res.content as unknown as Array<Record<string, unknown>>),
      stopReason: res.stop_reason ?? '',
    };
  }

  async runStream(req: ProviderRequest, onDelta: (text: string) => void): Promise<ProviderTurn> {
    const stream = this.client.messages.stream(
      this.params(req) as never,
      usesFiles(req.messages) ? filesOpts : undefined,
    );
    stream.on('text', (delta: string) => onDelta(delta));
    const final = await stream.finalMessage();
    return {
      content: fromApiContent(final.content as unknown as Array<Record<string, unknown>>),
      stopReason: final.stop_reason ?? '',
    };
  }
}
