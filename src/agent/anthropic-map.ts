/**
 * Pure mapping between our protocol (agent/types.ts) and the Anthropic Messages
 * API wire shape. No SDK import — the wire JSON is stable, so this is testable
 * without the network and robust to SDK type churn. The provider casts these
 * plain objects to the SDK's param types at the single call boundary.
 */

import type { AssistantBlock, Message, ToolDef } from './types';

interface ApiText {
  type: 'text';
  text: string;
}
interface ApiToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}
interface ApiToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}
interface ApiImage {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}
interface ApiDocument {
  type: 'document';
  source: { type: 'base64'; media_type: string; data: string } | { type: 'file'; file_id: string };
}
interface ApiThinking {
  type: 'thinking';
  thinking: string;
  signature?: string;
}
interface ApiRedactedThinking {
  type: 'redacted_thinking';
  data: string;
}
type ApiBlock =
  | ApiText
  | ApiToolUse
  | ApiToolResult
  | ApiImage
  | ApiDocument
  | ApiThinking
  | ApiRedactedThinking;

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: ApiBlock[];
}

export interface ApiTool {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  type?: string;
  max_uses?: number;
}

export function toApiMessages(messages: Message[]): ApiMessage[] {
  return messages.map((m): ApiMessage => {
    if (m.role === 'assistant') {
      // Every block round-trips in its original position. With thinking enabled,
      // an assistant turn that contains tool_use MUST also carry its preceding
      // thinking block(s) + signature, or the API 400s on the next turn.
      return {
        role: 'assistant',
        content: m.content.map((b): ApiBlock => {
          if (b.type === 'text') return { type: 'text', text: b.text };
          if (b.type === 'tool_use') return { type: 'tool_use', id: b.id, name: b.name, input: b.input };
          if (b.type === 'thinking') {
            const t: ApiThinking = { type: 'thinking', thinking: b.thinking };
            if (b.signature !== undefined) t.signature = b.signature;
            return t;
          }
          return { type: 'redacted_thinking', data: b.data };
        }),
      };
    }
    return {
      role: 'user',
      content: m.content.map((b): ApiBlock => {
        if (b.type === 'text') return { type: 'text', text: b.text };
        if (b.type === 'tool_result') {
          const r: ApiToolResult = { type: 'tool_result', tool_use_id: b.tool_use_id, content: b.content };
          if (b.is_error) r.is_error = true;
          return r;
        }
        if (b.type === 'image') return { type: 'image', source: { type: 'base64', media_type: b.mediaType, data: b.dataBase64 } };
        return b.fileId
          ? { type: 'document', source: { type: 'file', file_id: b.fileId } }
          : { type: 'document', source: { type: 'base64', media_type: b.mediaType ?? 'application/pdf', data: b.dataBase64 ?? '' } };
      }),
    };
  });
}

// web_search + web_fetch, paired. These newer (20260209) versions have built-in
// dynamic filtering and need NO beta header. They go together.
const WEB_SEARCH_TOOL: ApiTool = { type: 'web_search_20260209', name: 'web_search', max_uses: 5 };
const WEB_FETCH_TOOL: ApiTool = { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 };

/** Map our client tools to API tools; when `webSearch` is true, also enable the
 *  server-side web search + web fetch tools. */
export function toApiTools(tools: ToolDef[], webSearch = false): ApiTool[] {
  const out: ApiTool[] = tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
  if (webSearch) out.push(WEB_SEARCH_TOOL, WEB_FETCH_TOOL);
  return out;
}

/** True if any user message carries a Files-API document reference (a `fileId`).
 *  The provider sends the files beta header only on these calls, never on plain ones. */
export function usesFiles(messages: Message[]): boolean {
  return messages.some(
    m => m.role === 'user' && m.content.some(b => b.type === 'document' && !!b.fileId),
  );
}

/** Keep the blocks our loop acts on (text, client tool_use) plus thinking blocks
 *  — the latter must round-trip verbatim (signature included) when thinking is on. */
export function fromApiContent(content: Array<Record<string, unknown>>): AssistantBlock[] {
  const out: AssistantBlock[] = [];
  for (const b of content) {
    if (b.type === 'text' && typeof b.text === 'string') {
      out.push({ type: 'text', text: b.text });
    } else if (b.type === 'tool_use' && typeof b.id === 'string' && typeof b.name === 'string') {
      out.push({ type: 'tool_use', id: b.id, name: b.name, input: (b.input ?? {}) as Record<string, unknown> });
    } else if (b.type === 'thinking') {
      out.push({
        type: 'thinking',
        thinking: String(b.thinking ?? ''),
        ...(typeof b.signature === 'string' ? { signature: b.signature } : {}),
      });
    } else if (b.type === 'redacted_thinking') {
      out.push({ type: 'redacted_thinking', data: String(b.data ?? '') });
    }
  }
  return out;
}
