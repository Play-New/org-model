/**
 * The org-model: two boxes derived from one lens.
 *
 *   "An org is the set of contracts it holds with the world — what it gives and
 *    gets from each outside party — and the machine of resources it orchestrates
 *    to keep them."
 *
 * The definition IS the schema. See canon/STRUCTURE.md for the full spec.
 * This is the in-memory shape; on disk each item is a markdown file with YAML
 * frontmatter under the chosen org folder.
 *
 *   Contracts : the exchanges with the world (gives/gets, conditions, measures)
 *   Nodes     : what the contracts rest on (core/service/platform)
 */

/** A citation back to a source: a file under sources/, or a saved answer. */
export interface Citation {
  sourceId: string; // id of a file under sources/ (incl. saved chat answers)
  locator?: string; // optional §/page/section
}

/**
 * A measure of value on one leg of a contract. Observed, NOT a target —
 * a target is should-be, a measure is as-is. `value` is the observed reading
 * today; it is the attachment point where phase-two live data feeds in.
 */
export interface Measure {
  what: string; // what is measured (e.g. "€ raccolti", "ricerche finanziate")
  value?: string; // the observed value today, once known
  // No per-measure sources: the contract cites its sources once (Contract.sources),
  // and each specific figure is cited inline in the prose note.
}

/* ---------------------------------------------------------------------- */
/* Contracts                                                               */
/* ---------------------------------------------------------------------- */

/** Health is derived from measures + constraints, never asserted on its own. */
export type ContractHealth = 'healthy' | 'strained' | 'broken';

/** A contract with one outside party. Mutual, usually implicit. */
export interface Contract {
  id: string;
  withParty: string; // the outside party
  give: string; // what the org gives them (the promise / give-leg)
  get: string; // what comes back that sustains the org (the fuel / get-leg)
  constraints: string[]; // vincoli — conditions under which the contract holds
  measures: { give: Measure[]; get: Measure[] }; // how you know value flows, both legs
  health?: ContractHealth; // derived by the agent from measures + constraints
  note?: string; // the human-readable prose body (markdown, with inline (source) citations)
  sources: Citation[];
}

/* ---------------------------------------------------------------------- */
/* Nodes — what the contracts rest on                                      */
/* ---------------------------------------------------------------------- */

/** What a node points at — its role in keeping the contracts (Cicero). */
export type Orientation = 'core' | 'service' | 'platform';

/** A node in the machine: a resource the contracts rest on. */
export interface Node {
  id: string;
  name: string;
  orientation: Orientation; // core (delivers a contract) / service / platform
  supports: string[]; // Contract ids this node helps keep
  dependsOn: string[]; // other Node ids this node relies on (core→service→platform)
  composition: string; // what it is made of (incl. key people if any)
  needsToday: string; // conditions it needs right now to stand (beyond the nodes in dependsOn)
  note?: string; // the human-readable prose body (markdown, with inline (source) citations)
  sources: Citation[];
}

/* ---------------------------------------------------------------------- */
/* The whole model                                                         */
/* ---------------------------------------------------------------------- */

export interface OrgModel {
  contracts: Contract[];
  nodes: Node[];
}

export function emptyModel(): OrgModel {
  return { contracts: [], nodes: [] };
}

/* ---------------------------------------------------------------------- */
/* Mechanical readings — the completeness gate                             */
/* The richer readings (which resource commands, fragility, stated-vs-kept) */
/* are agent judgements over free text, not pure functions.                 */
/* ---------------------------------------------------------------------- */

/** Contracts with no core node keeping them — a completeness violation. */
export function uncoveredContracts(m: OrgModel): Contract[] {
  return m.contracts.filter(
    c => !m.nodes.some(n => n.orientation === 'core' && n.supports.includes(c.id)),
  );
}

/** Nodes that support no contract — candidates for "pure overhead", flagged. */
export function orphanNodes(m: OrgModel): Node[] {
  return m.nodes.filter(n => n.supports.length === 0);
}

/** Nodes grouped by orientation — the core/service/platform picture. */
export function byOrientation(m: OrgModel): Record<Orientation, Node[]> {
  const out: Record<Orientation, Node[]> = { core: [], service: [], platform: [] };
  for (const n of m.nodes) out[n.orientation].push(n);
  return out;
}

/** Core vs platform — how much exists just to keep the org running. */
export function coreVsPlatform(m: OrgModel): { core: number; service: number; platform: number } {
  const g = byOrientation(m);
  return { core: g.core.length, service: g.service.length, platform: g.platform.length };
}
