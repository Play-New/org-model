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
type ApiBlock = ApiText | ApiToolUse | ApiToolResult | ApiImage | ApiDocument;

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
      return {
        role: 'assistant',
        content: m.content.map((b): ApiBlock =>
          b.type === 'text'
            ? { type: 'text', text: b.text }
            : { type: 'tool_use', id: b.id, name: b.name, input: b.input },
        ),
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

const WEB_SEARCH_TOOL: ApiTool = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 };

export function toApiTools(tools: ToolDef[], webSearch = false): ApiTool[] {
  const out: ApiTool[] = tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
  if (webSearch) out.push(WEB_SEARCH_TOOL);
  return out;
}

/** Keep only the blocks our loop acts on: text and client tool_use. */
export function fromApiContent(content: Array<Record<string, unknown>>): AssistantBlock[] {
  const out: AssistantBlock[] = [];
  for (const b of content) {
    if (b.type === 'text' && typeof b.text === 'string') {
      out.push({ type: 'text', text: b.text });
    } else if (b.type === 'tool_use' && typeof b.id === 'string' && typeof b.name === 'string') {
      out.push({ type: 'tool_use', id: b.id, name: b.name, input: (b.input ?? {}) as Record<string, unknown> });
    }
  }
  return out;
}
