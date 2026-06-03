/**
 * The org-model: two boxes derived from one lens.
 *
 *   "An org is the set of contracts it holds with the world — what it gives and
 *    gets from each outside party — and the internal nodes that keep them."
 *
 * The definition IS the schema. See canon/STRUCTURE.md for the full spec.
 * This is the in-memory shape; on disk each item is a markdown file with YAML
 * frontmatter under the chosen org folder.
 *
 *   Contracts : the exchanges with the world (org-gives/org-gets, terms, signals)
 *   Nodes     : what the contracts rest on (core/supporting/platform)
 */

/** A citation back to a source: a file under sources/, or a saved answer. */
export interface Citation {
  sourceId: string; // id of a file under sources/ (incl. saved chat answers)
  locator?: string; // optional §/page/section
}

/**
 * A signal on one leg of a contract. Observed, NOT a target — a target is
 * should-be, a signal is as-is. `value` is the observed reading today; it is the
 * attachment point where phase-two live data feeds in.
 */
export interface Signal {
  what: string; // what is read (e.g. "€ raised", "research funded")
  value?: string; // the observed value today, once known
  // No per-signal sources: the contract cites its sources once (Contract.sources),
  // and each specific figure is cited inline in the prose note.
}

/* ---------------------------------------------------------------------- */
/* Contracts                                                               */
/* ---------------------------------------------------------------------- */

/** Health is read off signals + terms, never asserted on its own. */
export type ContractHealth = 'healthy' | 'strained' | 'broken' | 'unknown';

/** A contract with one outside party. Mutual, usually implicit. */
export interface Contract {
  id: string;
  parties: string; // the outside party (the org is implicit)
  give: string; // what the org gives them (the promise / give-leg)
  get: string; // what comes back that sustains the org (the fuel / get-leg)
  terms: string[]; // what must hold, or the contract breaks
  signals: { outbound: Signal[]; inbound: Signal[] }; // how you read each leg
  health?: ContractHealth; // read by the agent off signals + terms
  note?: string; // the human-readable prose body (markdown, with inline (source) citations)
  sources: Citation[];
}

/* ---------------------------------------------------------------------- */
/* Nodes — what the contracts rest on                                      */
/* ---------------------------------------------------------------------- */

/** What a node points at — its role in keeping the contracts (Cicero). */
export type Archetype = 'core' | 'supporting' | 'platform';

/** A node: an internal part the contracts rest on. */
export interface Node {
  id: string;
  name: string;
  archetype: Archetype; // core (delivers a contract) / supporting / platform
  keeps: string[]; // Contract ids this node helps keep
  reliesOn: string[]; // other Node ids this node relies on (core→supporting→platform)
  madeOf: string; // what it is made of (incl. key people if any)
  needs: string; // conditions it needs right now to stand (beyond the nodes in reliesOn)
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
    c => !m.nodes.some(n => n.archetype === 'core' && n.keeps.includes(c.id)),
  );
}

/** Nodes that keep no contract — candidates for "pure overhead", flagged. */
export function orphanNodes(m: OrgModel): Node[] {
  return m.nodes.filter(n => n.keeps.length === 0);
}

/** Nodes grouped by archetype — the core/supporting/platform picture. */
export function byArchetype(m: OrgModel): Record<Archetype, Node[]> {
  const out: Record<Archetype, Node[]> = { core: [], supporting: [], platform: [] };
  for (const n of m.nodes) out[n.archetype].push(n);
  return out;
}

/** Core vs platform — how much exists just to keep the org running. */
export function coreVsPlatform(m: OrgModel): { core: number; supporting: number; platform: number } {
  const g = byArchetype(m);
  return { core: g.core.length, supporting: g.supporting.length, platform: g.platform.length };
}
