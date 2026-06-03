import { describe, expect, it } from 'vitest';
import { cleanModel } from './fixtures';
import type { Contract } from './model';
import { contractToMarkdown, itemType, nodeToMarkdown, parseContract, parseNode } from './serializer';

describe('serializer round-trip', () => {
  const m = cleanModel();

  it('round-trips every contract through markdown', () => {
    for (const c of m.contracts) {
      expect(parseContract(contractToMarkdown(c))).toEqual(c);
    }
  });

  it('round-trips every node through markdown', () => {
    for (const n of m.nodes) {
      expect(parseNode(nodeToMarkdown(n))).toEqual(n);
    }
  });

  it('preserves a citation locator', () => {
    const c = m.contracts[0];
    const back = parseContract(contractToMarkdown(c));
    expect(back.sources[0]).toEqual({ sourceId: 'site', locator: 'work' });
  });

  it('detects the item type from frontmatter', () => {
    expect(itemType(contractToMarkdown(m.contracts[0]))).toBe('contract');
    expect(itemType(nodeToMarkdown(m.nodes[0]))).toBe('node');
    expect(itemType('no frontmatter here')).toBe('unknown');
  });

  it('round-trips the prose note (the readable body)', () => {
    const c = { ...m.contracts[0], note: '# Private donors\n\nThey fund the research `(site)`.\n\n## What holds it\nIndependence of the committee.' };
    expect(parseContract(contractToMarkdown(c)).note).toBe(c.note);
    const n = { ...m.nodes[0], note: 'Delivers the work `(site)`.' };
    expect(parseNode(nodeToMarkdown(n)).note).toBe(n.note);
  });

  it('round-trips a contract with health: unknown', () => {
    const c: Contract = { ...m.contracts[0], health: 'unknown' };
    expect(parseContract(contractToMarkdown(c))).toEqual(c);
  });

  it('round-trips signals on both legs (what + value)', () => {
    const c: Contract = {
      ...m.contracts[0],
      signals: {
        outbound: [{ what: 'projects shipped', value: '24/yr' }],
        inbound: [{ what: 'revenue', value: '€1.2M' }],
      },
    };
    const back = parseContract(contractToMarkdown(c));
    expect(back.signals).toEqual(c.signals);
  });
});

describe('serializer backward compatibility (old field names)', () => {
  it('parses a contract written with the old keys', () => {
    const old = [
      '---',
      'id: legacy',
      'type: contract',
      'with: Donors',
      'org-gives: research',
      'org-gets: funding',
      'constraints:',
      '  - independence',
      'measures:',
      '  org-gives:',
      '    - what: studies',
      '      value: "12"',
      '  org-gets:',
      '    - what: euros',
      '      value: 1M',
      'sources:',
      '  - site',
      '---',
      '',
      'Prose body.',
      '',
    ].join('\n');
    const c = parseContract(old);
    expect(c.parties).toBe('Donors');
    expect(c.terms).toEqual(['independence']);
    expect(c.signals.outbound).toEqual([{ what: 'studies', value: '12' }]);
    expect(c.signals.inbound).toEqual([{ what: 'euros', value: '1M' }]);
  });

  it('parses a node written with the old keys, mapping service → supporting', () => {
    const old = [
      '---',
      'id: ops',
      'type: node',
      'name: Operations',
      'orientation: service',
      'supports:',
      '  - clients',
      'dependsOn:',
      '  - admin',
      'composition: tooling',
      'needsToday: the toolchain running',
      'sources:',
      '  - org-chart',
      '---',
      '',
      'Prose body.',
      '',
    ].join('\n');
    const n = parseNode(old);
    expect(n.archetype).toBe('supporting');
    expect(n.keeps).toEqual(['clients']);
    expect(n.reliesOn).toEqual(['admin']);
    expect(n.madeOf).toBe('tooling');
    expect(n.needs).toBe('the toolchain running');
  });
});
