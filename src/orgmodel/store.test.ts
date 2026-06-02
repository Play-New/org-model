import { describe, expect, it } from 'vitest';
import { MemoryAdapter } from '../storage/memory';
import { cleanModel } from './fixtures';
import { listSourceIds, loadModel, saveContract, saveNode } from './store';

describe('store round-trip through an adapter', () => {
  it('saves and reloads the whole model unchanged', async () => {
    const a = new MemoryAdapter();
    const m = cleanModel();
    for (const c of m.contracts) await saveContract(a, c);
    for (const n of m.nodes) await saveNode(a, n);

    const back = await loadModel(a);
    const byId = <T extends { id: string }>(xs: T[]) => [...xs].sort((x, y) => x.id.localeCompare(y.id));
    expect(byId(back.contracts)).toEqual(byId(m.contracts));
    expect(byId(back.nodes)).toEqual(byId(m.nodes));
  });

  it('lists source ids without extensions', async () => {
    const a = new MemoryAdapter({
      'sources/site.pdf': 'x',
      'sources/accounts.xlsx': 'x',
      'sources/notes.md': 'x',
    });
    expect(await listSourceIds(a)).toEqual(new Set(['site', 'accounts', 'notes']));
  });
});
