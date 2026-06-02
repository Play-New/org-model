/**
 * Derived view data for the UI: per-item fill state (the file-tree dots) and the
 * grouped sidebar. Pure, so it's testable and the UI stays dumb.
 *
 * Fill state mirrors what "complete" means in lint: an item is `done` when it
 * carries everything we'd expect, `empty` when blank, `partial` in between.
 */

import type { Contract, Node, OrgModel } from './model';

export type FillState = 'empty' | 'partial' | 'done';

function score(flags: boolean[]): FillState {
  const n = flags.filter(Boolean).length;
  if (n === 0) return 'empty';
  return n === flags.length ? 'done' : 'partial';
}

export function contractState(c: Contract): FillState {
  return score([
    c.give.trim() !== '',
    c.get.trim() !== '',
    c.constraints.length > 0,
    c.measures.give.length + c.measures.get.length > 0,
    c.sources.length > 0,
  ]);
}

export function nodeState(n: Node): FillState {
  return score([
    n.composition.trim() !== '',
    n.needsToday.trim() !== '',
    n.sources.length > 0,
    n.orientation === 'platform' ? true : n.supports.length > 0,
  ]);
}

export type ItemKind = 'contract' | 'node';

export interface SidebarItem {
  kind: ItemKind;
  id: string;
  label: string;
  state: FillState;
  orientation?: Node['orientation'];
}

export interface SidebarModel {
  contracts: SidebarItem[];
  core: SidebarItem[];
  service: SidebarItem[];
  platform: SidebarItem[];
}

export function buildSidebar(model: OrgModel): SidebarModel {
  const contracts: SidebarItem[] = model.contracts.map(c => ({
    kind: 'contract',
    id: c.id,
    label: c.withParty || c.id,
    state: contractState(c),
  }));

  const byOri = (o: Node['orientation']): SidebarItem[] =>
    model.nodes
      .filter(n => n.orientation === o)
      .map(n => ({ kind: 'node', id: n.id, label: n.name || n.id, state: nodeState(n), orientation: o }));

  return { contracts, core: byOri('core'), service: byOri('service'), platform: byOri('platform') };
}

/** Count of items not yet complete — drives the "needs work" hint. */
export function incompleteCount(items: SidebarItem[]): number {
  return items.filter(i => i.state !== 'done').length;
}
