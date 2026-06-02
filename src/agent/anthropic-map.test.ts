import { describe, expect, it } from 'vitest';
import { fromApiContent, toApiMessages, toApiTools } from './anthropic-map';
import type { Message, ToolDef } from './types';

describe('anthropic mapping', () => {
  it('maps user blocks (text, tool_result, image) to the wire shape', () => {
    const msgs: Message[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'hi' },
          { type: 'tool_result', tool_use_id: 't1', content: 'ok' },
          { type: 'image', mediaType: 'image/png', dataBase64: 'AAAA' },
        ],
      },
    ];
    expect(toApiMessages(msgs)).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'hi' },
          { type: 'tool_result', tool_use_id: 't1', content: 'ok' },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
        ],
      },
    ]);
  });

  it('maps assistant tool_use to the wire shape', () => {
    const msgs: Message[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 'x', name: 'write_contract', input: { id: 'c' } }] },
    ];
    expect(toApiMessages(msgs)[0].content[0]).toEqual({ type: 'tool_use', id: 'x', name: 'write_contract', input: { id: 'c' } });
  });

  it('appends the web_search server tool when enabled', () => {
    const tools: ToolDef[] = [{ name: 'read_model', description: 'd', input_schema: { type: 'object' } }];
    expect(toApiTools(tools, false)).toHaveLength(1);
    const withSearch = toApiTools(tools, true);
    expect(withSearch).toHaveLength(2);
    expect(withSearch[1]).toMatchObject({ type: 'web_search_20250305', name: 'web_search' });
  });

  it('keeps only text and client tool_use from a response, dropping server blocks', () => {
    const content = [
      { type: 'text', text: 'answer' },
      { type: 'server_tool_use', id: 's', name: 'web_search', input: {} },
      { type: 'web_search_tool_result', tool_use_id: 's', content: [] },
      { type: 'tool_use', id: 'u', name: 'write_node', input: { id: 'n' } },
    ];
    expect(fromApiContent(content)).toEqual([
      { type: 'text', text: 'answer' },
      { type: 'tool_use', id: 'u', name: 'write_node', input: { id: 'n' } },
    ]);
  });
});
