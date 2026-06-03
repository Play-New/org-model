import { describe, expect, it } from 'vitest';
import { fromApiContent, toApiMessages, toApiTools, usesFiles } from './anthropic-map';
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

  it('maps a document block by Files-API id (preferred) and by base64 (fallback)', () => {
    const msgs: Message[] = [
      {
        role: 'user',
        content: [
          { type: 'document', fileId: 'file_abc' },
          { type: 'document', mediaType: 'application/pdf', dataBase64: 'JVBER' },
        ],
      },
    ];
    expect(toApiMessages(msgs)[0].content).toEqual([
      { type: 'document', source: { type: 'file', file_id: 'file_abc' } },
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'JVBER' } },
    ]);
  });

  it('maps assistant tool_use to the wire shape', () => {
    const msgs: Message[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 'x', name: 'write_contract', input: { id: 'c' } }] },
    ];
    expect(toApiMessages(msgs)[0].content[0]).toEqual({ type: 'tool_use', id: 'x', name: 'write_contract', input: { id: 'c' } });
  });

  it('flags Files-API usage only when a document carries a fileId', () => {
    const withFile: Message[] = [{ role: 'user', content: [{ type: 'document', fileId: 'file_x' }] }];
    const withBase64: Message[] = [{ role: 'user', content: [{ type: 'document', mediaType: 'application/pdf', dataBase64: 'AA' }] }];
    const plain: Message[] = [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }];
    expect(usesFiles(withFile)).toBe(true);
    expect(usesFiles(withBase64)).toBe(false);
    expect(usesFiles(plain)).toBe(false);
  });

  it('appends web_search + web_fetch server tools when enabled, neither when off', () => {
    const tools: ToolDef[] = [{ name: 'read_model', description: 'd', input_schema: { type: 'object' } }];
    const off = toApiTools(tools, false);
    expect(off).toHaveLength(1);
    expect(off.some(t => t.name === 'web_search')).toBe(false);
    expect(off.some(t => t.name === 'web_fetch')).toBe(false);

    const on = toApiTools(tools, true);
    expect(on).toHaveLength(3);
    expect(on.find(t => t.name === 'web_search')).toMatchObject({ type: 'web_search_20260209', name: 'web_search' });
    expect(on.find(t => t.name === 'web_fetch')).toMatchObject({ type: 'web_fetch_20260209', name: 'web_fetch' });
  });

  it('round-trips thinking blocks: kept on the way in, re-emitted before text on the way out', () => {
    const blocks = fromApiContent([
      { type: 'thinking', thinking: 't', signature: 'sig' },
      { type: 'text', text: 'hi' },
    ]);
    expect(blocks).toEqual([
      { type: 'thinking', thinking: 't', signature: 'sig' },
      { type: 'text', text: 'hi' },
    ]);

    const wire = toApiMessages([{ role: 'assistant', content: blocks }]);
    expect(wire[0].content).toEqual([
      { type: 'thinking', thinking: 't', signature: 'sig' },
      { type: 'text', text: 'hi' },
    ]);
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
