import { describe, expect, it } from 'vitest';
import { cleanModel, KNOWN_SOURCES } from './fixtures';
import { errors, isClean, lint } from './lint';
import type { OrgModel } from './model';

describe('lint', () => {
  it('a complete model lints clean', () => {
    expect(lint(cleanModel(), KNOWN_SOURCES)).toEqual([]);
  });

  it('does not flag platform nodes as overhead', () => {
    const findings = lint(cleanModel(), KNOWN_SOURCES);
    expect(findings.find(f => f.target === 'admin')).toBeUndefined();
  });

  it('flags an empty give-leg, a dangling dependency, and an uncovered contract', () => {
    const m: OrgModel = {
      contracts: [
        { id: 'x', withParty: 'X', give: '', get: 'cash', constraints: [], measures: { give: [], get: [] }, sources: [] },
      ],
      nodes: [
        { id: 'n', name: 'N', orientation: 'service', supports: ['x'], dependsOn: ['ghost'], composition: '', needsToday: '', sources: [] },
      ],
    };
    const f = lint(m, new Set());
    const codes = f.map(x => x.code);
    expect(codes).toContain('contract.no-give');
    expect(codes).toContain('node.bad-dependency');
    expect(codes).toContain('gate.uncovered-contract'); // 'n' is service, not core
    expect(isClean(f)).toBe(false);
    expect(errors(f).length).toBeGreaterThan(0);
  });

  it('flags a citation to a missing source', () => {
    const m = cleanModel();
    m.contracts[0].sources.push({ sourceId: 'does-not-exist' });
    const f = lint(m, KNOWN_SOURCES);
    expect(f.find(x => x.code === 'contract.bad-citation')).toBeTruthy();
  });
});
