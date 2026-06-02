/**
 * End-to-end over GitHub (mocked API): the real agent loop writes through a
 * GitHubAdapter into an in-memory fake of the Contents + Trees API, then the model
 * is read back from the same repo. Proves the commit path works with the engine,
 * not just the adapter in isolation. Deterministic, no network.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMap } from '../orgmodel/mapview';
import { loadModel } from '../orgmodel/store';
import { buildSidebar } from '../orgmodel/viewmodel';
import { GitHubAdapter, toBase64 } from '../storage/github';
import { runAgent } from './loop';
import { MockProvider } from './mock';
import type { ProviderTurn } from './types';

// A tiny stateful GitHub: enough of the Contents + Trees API for the adapter.
function fakeGitHub() {
  const files = new Map<string, string>(); // path → text content
  const reply = (status: number, data: unknown) =>
    ({ ok: status >= 200 && status < 300, status, json: async () => data }) as unknown as Response;

  return vi.fn(async (url: string, init?: RequestInit) => {
    const path = decodeURIComponent(new URL(url).pathname);
    const contents = /\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/.exec(path);
    if (contents) {
      const file = contents[1];
      if (init?.method === 'PUT') {
        const body = JSON.parse(init.body as string);
        const bytes = Uint8Array.from(atob(body.content), ch => ch.charCodeAt(0));
        files.set(file, new TextDecoder().decode(bytes));
        return reply(200, { content: { sha: `sha:${file}` } });
      }
      if (init?.method === 'DELETE') {
        files.delete(file);
        return reply(200, {});
      }
      if (!files.has(file)) return reply(404, {});
      return reply(200, { type: 'file', sha: `sha:${file}`, content: toBase64(new TextEncoder().encode(files.get(file)!)) });
    }
    if (path.includes('/branches/')) return reply(200, { commit: { commit: { tree: { sha: 'TREE' } } } });
    if (path.includes('/git/trees/')) return reply(200, { tree: [...files.keys()].map(p => ({ type: 'blob', path: p })) });
    if (/\/repos\/[^/]+\/[^/]+$/.test(path)) return reply(200, {}); // check()
    return reply(404, {});
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('guided session over GitHub (mocked API)', () => {
  it('commits a contract + node, then reads the model back from the repo', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    const adapter = new GitHubAdapter({ owner: 'acme', repo: 'org', branch: 'main' }, 'tok');

    const scripted: ProviderTurn[] = [
      {
        stopReason: 'tool_use',
        content: [
          { type: 'text', text: 'Recording the clients contract and the delivery node.' },
          {
            type: 'tool_use',
            id: 'c',
            name: 'write_contract',
            input: { id: 'clients', with: 'Clients', gives: 'delivered work', gets: 'fees', sources: [] },
          },
          {
            type: 'tool_use',
            id: 'n',
            name: 'write_node',
            input: { id: 'delivery', name: 'Delivery', orientation: 'core', supports: ['clients'], composition: 'designers', needsToday: 'staff', sources: [] },
          },
        ],
      },
      { stopReason: 'end_turn', content: [{ type: 'text', text: 'Done.' }] },
    ];

    const confirmed: string[] = [];
    const res = await runAgent({
      provider: new MockProvider(scripted),
      system: 's',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'map it on github' }] }],
      ctx: { adapter },
      confirm: async name => {
        confirmed.push(name);
        return true; // approve each diff card
      },
    });

    expect(res.hitCap).toBe(false);
    expect(confirmed).toEqual(['write_contract', 'write_node']);

    // the commits are in the repo — read the model back through the adapter
    const model = await loadModel(adapter);
    expect(model.contracts.map(c => c.id)).toEqual(['clients']);
    expect(model.nodes.map(n => n.id)).toEqual(['delivery']);

    // and the view models render it
    expect(buildMap(model).nodes).toHaveLength(2);
    expect(buildSidebar(model).contracts[0]).toMatchObject({ id: 'clients' });
  });
});
