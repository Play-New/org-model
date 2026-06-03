/**
 * The tool-use loop. Send the conversation to the provider; if it asks to use
 * tools, run them, feed the results back, and repeat; stop when it answers with
 * text (no tool calls) or the turn cap is hit.
 *
 * Provider-agnostic and storage-agnostic, so it's fully testable with a
 * MockProvider + MemoryAdapter.
 */

import { runTool, TOOL_DEFS, type ToolContext } from './tools';
import { isToolUse, textOf, type LlmProvider, type Message, type ToolResultBlock } from './types';

/** Tools that change the model — gated behind the user's confirm (the diff card). */
const NEEDS_CONFIRM = new Set(['write_contract', 'write_node', 'save_source', 'append_log']);

export interface RunOptions {
  provider: LlmProvider;
  system: string;
  messages: Message[];
  ctx: ToolContext;
  maxTurns?: number;
  /** Called before each tool runs — the UI uses this for the diff card. */
  onToolUse?: (name: string, input: Record<string, unknown>) => void;
  /** Streamed text deltas as the assistant writes (when the provider streams). */
  onDelta?: (text: string) => void;
  /** Final assistant text for the turn — finalizes the streamed message. */
  onAssistant?: (text: string) => void;
  /** Gate write tools: resolve true to apply, false to reject. */
  confirm?: (name: string, input: Record<string, unknown>) => Promise<boolean>;
}

export interface RunResult {
  messages: Message[];
  turns: number;
  hitCap: boolean;
}

export async function runAgent(opts: RunOptions): Promise<RunResult> {
  const messages = [...opts.messages];
  const max = opts.maxTurns ?? 16;

  for (let turn = 1; turn <= max; turn++) {
    const req = { system: opts.system, messages, tools: TOOL_DEFS };
    let out;
    if (opts.provider.runStream) {
      out = await opts.provider.runStream(req, d => opts.onDelta?.(d));
    } else {
      out = await opts.provider.run(req);
      const t = textOf(out.content);
      if (t) opts.onDelta?.(t);
    }
    opts.onAssistant?.(textOf(out.content));
    messages.push({ role: 'assistant', content: out.content });

    const toolUses = out.content.filter(isToolUse);
    if (toolUses.length === 0) {
      return { messages, turns: turn, hitCap: false };
    }

    const results: ToolResultBlock[] = [];
    for (const tu of toolUses) {
      opts.onToolUse?.(tu.name, tu.input);
      if (NEEDS_CONFIRM.has(tu.name)) {
        // Fail-closed: a write tool runs only if a confirm callback approves it.
        // With no confirm wired, the write is rejected — this enforces the
        // "LLM is the only writer, behind a confirm" rule even when a caller forgets
        // to pass confirm.
        const ok = opts.confirm ? await opts.confirm(tu.name, tu.input) : false;
        if (!ok) {
          results.push({ type: 'tool_result', tool_use_id: tu.id, content: 'rejected: the user did not approve this change' });
          continue;
        }
      }
      try {
        const content = await runTool(tu.name, tu.input, opts.ctx);
        results.push({ type: 'tool_result', tool_use_id: tu.id, content });
      } catch (e) {
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: String(e), is_error: true });
      }
    }
    messages.push({ role: 'user', content: results });
  }

  return { messages, turns: max, hitCap: true };
}

export { TOOL_DEFS };
