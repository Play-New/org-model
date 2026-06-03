import { describe, expect, it } from 'vitest';
import { loadModel } from '../orgmodel/store';
import { MemoryAdapter } from '../storage/memory';
import { runAgent } from './loop';
import { MockProvider } from './mock';
import type { LlmProvider, Message, ProviderTurn } from './types';

describe('agent loop', () => {
  it('runs tool calls then stops on a text turn', async () => {
    const adapter = new MemoryAdapter();
    const scripted: ProviderTurn[] = [
      {
        stopReason: 'tool_use',
        content: [
          { type: 'text', text: 'Writing the clients contract.' },
          {
            type: 'tool_use',
            id: 't1',
            name: 'write_contract',
            input: { id: 'clients', with: 'Clients', gives: 'work', gets: 'fees' },
          },
        ],
      },
      { stopReason: 'end_turn', content: [{ type: 'text', text: 'Done.' }] },
    ];

    const seen: string[] = [];
    const messages: Message[] = [{ role: 'user', content: [{ type: 'text', text: 'map my org' }] }];
    const res = await runAgent({
      provider: new MockProvider(scripted),
      system: 'you are the org-model agent',
      messages,
      ctx: { adapter },
      onToolUse: name => seen.push(name),
      confirm: async () => true,
    });

    expect(seen).toEqual(['write_contract']);
    expect(res.hitCap).toBe(false);
    expect(res.turns).toBe(2);

    const model = await loadModel(adapter);
    expect(model.contracts.map(c => c.id)).toEqual(['clients']);

    // a tool_result was fed back to the model
    const toolResult = res.messages.find(
      m => m.role === 'user' && m.content.some(b => b.type === 'tool_result'),
    );
    expect(toolResult).toBeTruthy();
  });

  it('stops at the turn cap if the model never ends', async () => {
    const adapter = new MemoryAdapter();
    const looping: ProviderTurn = {
      stopReason: 'tool_use',
      content: [{ type: 'tool_use', id: 't', name: 'read_model', input: {} }],
    };
    const res = await runAgent({
      provider: new MockProvider([looping]),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'go' }] }],
      ctx: { adapter },
      maxTurns: 3,
    });
    expect(res.hitCap).toBe(true);
    expect(res.turns).toBe(3);
  });

  it('fail-closed: rejects a write tool when no confirm is provided', async () => {
    const adapter = new MemoryAdapter();
    const scripted: ProviderTurn[] = [
      {
        stopReason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'write_node', input: { id: 'n', name: 'N', orientation: 'core' } }],
      },
      { stopReason: 'end_turn', content: [{ type: 'text', text: 'ok' }] },
    ];
    const res = await runAgent({
      provider: new MockProvider(scripted),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'go' }] }],
      ctx: { adapter },
      // no confirm callback — the write must NOT execute
    });
    expect((await loadModel(adapter)).nodes).toHaveLength(0);
    const rejected = res.messages.some(
      m =>
        m.role === 'user' &&
        m.content.some(
          b => b.type === 'tool_result' && b.content === 'rejected: the user did not approve this change',
        ),
    );
    expect(rejected).toBe(true);
  });

  it('fail-closed: rejects a write tool when confirm returns false', async () => {
    const adapter = new MemoryAdapter();
    const scripted: ProviderTurn[] = [
      {
        stopReason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'write_contract', input: { id: 'clients', with: 'C', gives: 'a', gets: 'b' } }],
      },
      { stopReason: 'end_turn', content: [{ type: 'text', text: 'ok' }] },
    ];
    const res = await runAgent({
      provider: new MockProvider(scripted),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'go' }] }],
      ctx: { adapter },
      confirm: async () => false,
    });
    expect((await loadModel(adapter)).contracts).toHaveLength(0);
    const rejected = res.messages.some(
      m => m.role === 'user' && m.content.some(b => b.type === 'tool_result' && b.content.includes('rejected')),
    );
    expect(rejected).toBe(true);
  });

  it('reports assistant text per turn', async () => {
    const texts: string[] = [];
    await runAgent({
      provider: new MockProvider([{ stopReason: 'end_turn', content: [{ type: 'text', text: 'hello' }] }]),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      ctx: { adapter: new MemoryAdapter() },
      onAssistant: t => texts.push(t),
    });
    expect(texts).toEqual(['hello']);
  });

  it('streams text deltas via runStream and finalizes', async () => {
    const turn: ProviderTurn = { stopReason: 'end_turn', content: [{ type: 'text', text: 'hello there' }] };
    const provider: LlmProvider = {
      run: async () => turn,
      runStream: async (_req, onDelta) => {
        onDelta('hello ');
        onDelta('there');
        return turn;
      },
    };
    const deltas: string[] = [];
    let final = '';
    await runAgent({
      provider,
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      ctx: { adapter: new MemoryAdapter() },
      onDelta: d => deltas.push(d),
      onAssistant: t => {
        final = t;
      },
    });
    expect(deltas).toEqual(['hello ', 'there']);
    expect(final).toBe('hello there');
  });
});
