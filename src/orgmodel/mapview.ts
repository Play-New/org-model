/**
 * Lay the model out for the map: nodes in columns by role (platform → supporting →
 * core → contracts, left to right, the way dependency flows), with edges for
 * keeps (node → contract) and reliesOn (node → node). Pure — no react-flow
 * import — so it's testable; the pane maps these plain objects onto react-flow.
 */

import type { OrgModel } from './model';
import { contractState, type FillState, nodeState } from './viewmodel';

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string; kind: 'contract' | 'node'; archetype?: string; state: FillState };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  kind: 'keeps' | 'depends';
}

const COL: Record<string, number> = { platform: 0, supporting: 1, core: 2, contract: 3 };
const COL_W = 240;
const ROW_H = 92;

const cid = (id: string) => `c:${id}`;
const nid = (id: string) => `n:${id}`;

export function buildMap(model: OrgModel): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const rows: Record<number, number> = {};
  const place = (col: number) => {
    const r = rows[col] ?? 0;
    rows[col] = r + 1;
    return { x: col * COL_W, y: r * ROW_H };
  };

  for (const n of model.nodes) {
    nodes.push({
      id: nid(n.id),
      position: place(COL[n.archetype]),
      data: { label: n.name || n.id, kind: 'node', archetype: n.archetype, state: nodeState(n) },
    });
  }
  for (const c of model.contracts) {
    nodes.push({
      id: cid(c.id),
      position: place(COL.contract),
      data: { label: c.parties || c.id, kind: 'contract', state: contractState(c) },
    });
  }

  const present = new Set(nodes.map(n => n.id));
  const edges: FlowEdge[] = [];
  for (const n of model.nodes) {
    for (const c of n.keeps) {
      if (present.has(cid(c))) edges.push({ id: `s:${n.id}->${c}`, source: nid(n.id), target: cid(c), kind: 'keeps' });
    }
    for (const d of n.reliesOn) {
      if (present.has(nid(d))) edges.push({ id: `d:${n.id}->${d}`, source: nid(n.id), target: nid(d), kind: 'depends' });
    }
  }

  return { nodes, edges };
}

/** Split a flow id back into a selection. */
export function parseFlowId(flowId: string): { kind: 'contract' | 'node'; id: string } {
  const [prefix, ...rest] = flowId.split(':');
  return { kind: prefix === 'c' ? 'contract' : 'node', id: rest.join(':') };
}
