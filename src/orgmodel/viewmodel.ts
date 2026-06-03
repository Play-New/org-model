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
    c.terms.length > 0,
    c.signals.outbound.length + c.signals.inbound.length > 0,
    c.sources.length > 0,
  ]);
}

export function nodeState(n: Node): FillState {
  return score([
    n.madeOf.trim() !== '',
    n.needs.trim() !== '',
    n.sources.length > 0,
    n.archetype === 'platform' ? true : n.keeps.length > 0,
  ]);
}

export type ItemKind = 'contract' | 'node';

export interface SidebarItem {
  kind: ItemKind;
  id: string;
  label: string;
  state: FillState;
  archetype?: Node['archetype'];
}

export interface SidebarModel {
  contracts: SidebarItem[];
  core: SidebarItem[];
  supporting: SidebarItem[];
  platform: SidebarItem[];
}

export function buildSidebar(model: OrgModel): SidebarModel {
  const contracts: SidebarItem[] = model.contracts.map(c => ({
    kind: 'contract',
    id: c.id,
    label: c.parties || c.id,
    state: contractState(c),
  }));

  const byArch = (a: Node['archetype']): SidebarItem[] =>
    model.nodes
      .filter(n => n.archetype === a)
      .map(n => ({ kind: 'node', id: n.id, label: n.name || n.id, state: nodeState(n), archetype: a }));

  return { contracts, core: byArch('core'), supporting: byArch('supporting'), platform: byArch('platform') };
}

/** Count of items not yet complete — drives the "needs work" hint. */
export function incompleteCount(items: SidebarItem[]): number {
  return items.filter(i => i.state !== 'done').length;
}
