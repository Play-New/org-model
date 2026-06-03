import { describe, expect, it } from 'vitest';
import { loadModel } from '../orgmodel/store';
import { MemoryAdapter } from '../storage/memory';
import { runTool } from './tools';

describe('tools', () => {
  it('write_contract persists a contract that read_model returns', async () => {
    const a = new MemoryAdapter();
    const out = await runTool(
      'write_contract',
      { id: 'clients', parties: 'Clients', 'org-gives': 'work', 'org-gets': 'fees', sources: ['site'] },
      { adapter: a },
    );
    expect(out).toContain('clients');

    const model = await loadModel(a);
    expect(model.contracts[0]).toMatchObject({ id: 'clients', parties: 'Clients', give: 'work', get: 'fees' });
    expect(model.contracts[0].sources).toEqual([{ sourceId: 'site' }]);

    const read = JSON.parse(await runTool('read_model', {}, { adapter: a }));
    expect(read.contracts).toHaveLength(1);
  });

  it('write_node coerces archetype and persists', async () => {
    const a = new MemoryAdapter();
    await runTool('write_node', { id: 'delivery', name: 'Delivery', archetype: 'core', keeps: ['clients'] }, { adapter: a });
    const model = await loadModel(a);
    expect(model.nodes[0]).toMatchObject({ id: 'delivery', archetype: 'core', keeps: ['clients'] });
  });

  it('append_log prepends most-recent-on-top', async () => {
    const a = new MemoryAdapter();
    await runTool('append_log', { line: 'first' }, { adapter: a });
    await runTool('append_log', { line: 'second' }, { adapter: a });
    expect(await a.read('log.md')).toBe('second\nfirst\n');
  });

  it('save_source writes under sources/', async () => {
    const a = new MemoryAdapter();
    await runTool('save_source', { id: 'chat-1', content: 'an answer' }, { adapter: a });
    expect(await a.read('sources/chat-1.md')).toBe('an answer');
  });

  it('refuses to write through a read-only adapter', async () => {
    const ro = new MemoryAdapter(undefined, { writable: false });
    await expect(runTool('write_contract', { id: 'x', parties: 'X', 'org-gives': 'a', 'org-gets': 'b' }, { adapter: ro })).rejects.toThrow(/read-only/);
  });
});
