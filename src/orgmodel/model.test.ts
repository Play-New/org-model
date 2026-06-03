import { describe, expect, it } from 'vitest';
import { cleanModel } from './fixtures';
import { byArchetype, coreVsPlatform, emptyModel, uncoveredContracts } from './model';

describe('model readings', () => {
  it('empty model is empty', () => {
    expect(emptyModel()).toEqual({ contracts: [], nodes: [] });
  });

  it('every contract in the clean model is covered by a core node', () => {
    expect(uncoveredContracts(cleanModel())).toEqual([]);
  });

  it('groups nodes by archetype', () => {
    const g = byArchetype(cleanModel());
    expect(g.core.map(n => n.id)).toEqual(['delivery', 'bizdev']);
    expect(g.supporting.map(n => n.id)).toEqual(['ops']);
    expect(g.platform.map(n => n.id)).toEqual(['admin']);
  });

  it('counts the core/supporting/platform balance', () => {
    expect(coreVsPlatform(cleanModel())).toEqual({ core: 2, supporting: 1, platform: 1 });
  });
});
