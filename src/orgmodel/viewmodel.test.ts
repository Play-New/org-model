import { describe, expect, it } from 'vitest';
import { cleanModel } from './fixtures';
import { emptyModel } from './model';
import { buildSidebar, contractState, nodeState } from './viewmodel';

describe('viewmodel', () => {
  it('marks a complete contract and node as done', () => {
    const m = cleanModel();
    expect(contractState(m.contracts[0])).toBe('done');
    for (const n of m.nodes) expect(nodeState(n)).toBe('done');
  });

  it('marks a blank contract empty and a half-filled one partial', () => {
    expect(contractState({ id: 'x', withParty: '', give: '', get: '', constraints: [], measures: { give: [], get: [] }, sources: [] })).toBe('empty');
    expect(contractState({ id: 'x', withParty: 'X', give: 'a', get: 'b', constraints: [], measures: { give: [], get: [] }, sources: [] })).toBe('partial');
  });

  it('treats a platform node without supports as not-incomplete on that axis', () => {
    const base = { id: 'p', name: 'P', supports: [], dependsOn: [], composition: 'c', needsToday: 'n', sources: [{ sourceId: 's' }] };
    expect(nodeState({ ...base, orientation: 'platform' })).toBe('done');
    expect(nodeState({ ...base, orientation: 'core' })).toBe('partial'); // core needs a contract
  });

  it('groups the sidebar into contracts and nodes by orientation', () => {
    const s = buildSidebar(cleanModel());
    expect(s.contracts).toHaveLength(2);
    expect(s.core.map(i => i.id)).toEqual(['delivery', 'bizdev']);
    expect(s.service.map(i => i.id)).toEqual(['ops']);
    expect(s.platform.map(i => i.id)).toEqual(['admin']);
    const empty = buildSidebar(emptyModel());
    expect(empty.contracts).toHaveLength(0);
    expect(empty.core).toHaveLength(0);
  });
});
