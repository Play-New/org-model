import { describe, expect, it } from 'vitest';
import { cleanModel } from './fixtures';
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
});
