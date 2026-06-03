import { describe, expect, it } from 'vitest';
import { cleanModel } from './fixtures';
import { buildMap, parseFlowId } from './mapview';

describe('buildMap', () => {
  const { nodes, edges } = buildMap(cleanModel());

  it('emits a flow node per contract and per node', () => {
    expect(nodes).toHaveLength(6); // 2 contracts + 4 nodes
    expect(nodes.filter(n => n.data.kind === 'contract')).toHaveLength(2);
  });

  it('columns nodes by role, contracts furthest right', () => {
    const x = (id: string) => nodes.find(n => n.id === id)!.position.x;
    expect(x('n:admin')).toBeLessThan(x('n:ops')); // platform left of supporting
    expect(x('n:ops')).toBeLessThan(x('n:delivery')); // supporting left of core
    expect(x('n:delivery')).toBeLessThan(x('c:clients')); // core left of contracts
  });

  it('draws keeps and depends edges, none dangling', () => {
    const keeps = edges.filter(e => e.kind === 'keeps');
    const depends = edges.filter(e => e.kind === 'depends');
    expect(keeps).toHaveLength(4); // clients×3 (delivery,bizdev,ops) + partners×1 (bizdev)
    expect(depends).toHaveLength(1); // delivery → ops
    const ids = new Set(nodes.map(n => n.id));
    expect(edges.every(e => ids.has(e.source) && ids.has(e.target))).toBe(true);
  });

  it('round-trips a flow id to a selection', () => {
    expect(parseFlowId('c:clients')).toEqual({ kind: 'contract', id: 'clients' });
    expect(parseFlowId('n:delivery')).toEqual({ kind: 'node', id: 'delivery' });
  });
});
