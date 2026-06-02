/**
 * End-to-end (mocked LLM): drive a realistic guided session through the whole
 * engine — provider → tool-use loop → diff-card confirm gate → tools → adapter →
 * store → lint → sidebar + map view models. Deterministic, no browser, no network.
 *
 * Browser-level Playwright is constrained by the File System Access native folder
 * picker (not automatable without a dedicated test seam) and the live LLM; this
 * covers the same flow at the engine level, and CI runs the full suite.
 */

import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config/config';
import { lint } from '../orgmodel/lint';
import { buildMap } from '../orgmodel/mapview';
import { listSourceIds, loadModel } from '../orgmodel/store';
import { buildSidebar } from '../orgmodel/viewmodel';
import { MemoryAdapter } from '../storage/memory';
import { listThreads, newThread, saveThread, threadTitle } from '../app/chatStore';
import { runAgent } from './loop';
import { MockProvider } from './mock';
import { buildSystemPrompt } from './prompt';
import type { Message, ProviderTurn } from './types';

describe('guided session, end to end (mocked LLM)', () => {
  it('maps a tiny org from a conversation into a clean, viewable model', async () => {
    const adapter = new MemoryAdapter();

    // The agent: save the source, write a complete contract + the core node that
    // keeps it, log it — all in one turn — then finish.
    const scripted: ProviderTurn[] = [
      {
        stopReason: 'tool_use',
        content: [
          { type: 'text', text: 'Recording the clients contract and the delivery node.' },
          { type: 'tool_use', id: 's', name: 'save_source', input: { id: 'site', content: 'home page' } },
          {
            type: 'tool_use',
            id: 'c',
            name: 'write_contract',
            input: {
              id: 'clients',
              with: 'Clients',
              gives: 'delivered work',
              gets: 'fees',
              constraints: ['agreed scope'],
              measures: { gives: [{ what: 'projects', sources: ['site'] }], gets: [{ what: 'revenue', sources: ['site'] }] },
              sources: ['site'],
            },
          },
          {
            type: 'tool_use',
            id: 'n',
            name: 'write_node',
            input: { id: 'delivery', name: 'Delivery', orientation: 'core', supports: ['clients'], composition: 'designers', needsToday: 'staff', sources: ['site'] },
          },
          { type: 'tool_use', id: 'l', name: 'append_log', input: { line: 'mapped clients + delivery' } },
        ],
      },
      { stopReason: 'end_turn', content: [{ type: 'text', text: 'Done — clients is covered by delivery.' }] },
    ];

    const confirmed: string[] = [];
    const messages: Message[] = [{ role: 'user', content: [{ type: 'text', text: 'map my studio' }] }];

    const res = await runAgent({
      provider: new MockProvider(scripted),
      system: buildSystemPrompt({ config: { ...defaultConfig(), orgName: 'Studio' } }),
      messages,
      ctx: { adapter },
      confirm: async name => {
        confirmed.push(name);
        return true; // user approves each diff card
      },
    });

    expect(res.hitCap).toBe(false);
    // every write went through the diff-card gate, in order
    expect(confirmed).toEqual(['save_source', 'write_contract', 'write_node', 'append_log']);

    // the model on disk is complete and lints clean
    const model = await loadModel(adapter);
    const sources = await listSourceIds(adapter);
    expect(model.contracts.map(c => c.id)).toEqual(['clients']);
    expect(model.nodes.map(n => n.id)).toEqual(['delivery']);
    expect(lint(model, sources)).toEqual([]);
    expect(await adapter.read('log.md')).toContain('mapped clients + delivery');

    // the UI view models reflect it
    const sidebar = buildSidebar(model);
    expect(sidebar.contracts[0]).toMatchObject({ id: 'clients', state: 'done' });
    expect(sidebar.core[0]).toMatchObject({ id: 'delivery', state: 'done' });

    const map = buildMap(model);
    expect(map.nodes).toHaveLength(2);
    expect(map.edges.filter(e => e.kind === 'supports')).toHaveLength(1);
  });

  it('rejecting the diff card leaves nothing written', async () => {
    const adapter = new MemoryAdapter();
    const scripted: ProviderTurn[] = [
      { stopReason: 'tool_use', content: [{ type: 'tool_use', id: 'c', name: 'write_contract', input: { id: 'x', with: 'X', gives: 'a', gets: 'b' } }] },
      { stopReason: 'end_turn', content: [{ type: 'text', text: 'understood' }] },
    ];
    await runAgent({
      provider: new MockProvider(scripted),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'go' }] }],
      ctx: { adapter },
      confirm: async () => false,
    });
    expect((await loadModel(adapter)).contracts).toHaveLength(0);
  });

  it('survives a reopen: model and chats persist, titles derive (date → topic)', async () => {
    const adapter = new MemoryAdapter();

    // 1) the agent writes one contract, the user approves it
    await runAgent({
      provider: new MockProvider([
        { stopReason: 'tool_use', content: [{ type: 'tool_use', id: 'c', name: 'write_contract', input: { id: 'clients', with: 'Clients', gives: 'work', gets: 'fees' } }] },
        { stopReason: 'end_turn', content: [{ type: 'text', text: 'done' }] },
      ]),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'map it' }] }],
      ctx: { adapter },
      confirm: async () => true,
    });

    // 2) a brand-new session, before the user has said anything: titled by date
    const fresh = newThread('sess1', '2026-06-01T09:30:00Z');
    await saveThread(adapter, fresh);
    expect(threadTitle(fresh)).toMatch(/^\d{1,2} \w{3}, \d{2}:\d{2}$/);

    // 3) once the user speaks, the title becomes the topic
    const talked = { ...fresh, display: [{ role: 'user' as const, text: 'map our donors' }] };
    await saveThread(adapter, talked);

    // 4) reopen the folder (new adapter over the same bytes — React state is gone)
    const seed: Record<string, string> = {};
    for (const p of await adapter.list('')) {
      const c = await adapter.read(p);
      if (c != null) seed[p] = c;
    }
    const reopened = new MemoryAdapter(seed);

    // the model is still there and still clean to render
    const model = await loadModel(reopened);
    expect(model.contracts.map(c => c.id)).toEqual(['clients']);

    // the chat is still there, now titled by what the user said
    const threads = await listThreads(reopened);
    expect(threads.map(t => t.id)).toEqual(['sess1']);
    expect(threads[0].title).toBe('map our donors');
  });
});
