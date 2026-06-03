/**
 * Lint the model. A clean model returns []. Findings are deterministic and
 * drive both the file-state dots in the UI and the agent's self-improvement
 * loop (each finding is something for autoresearch to go fix).
 *
 * Errors = structurally broken (bad citation, dangling reference). Warnings =
 * incomplete (missing leg, no signals, uncited, completeness-gate gaps).
 */

import type { Contract, OrgModel } from './model';
import { uncoveredContracts } from './model';

export type LintLevel = 'error' | 'warn';

export interface LintFinding {
  level: LintLevel;
  code: string;
  target: string; // id of the contract or node
  message: string;
}

function contractCitations(c: Contract): string[] {
  return c.sources.map(s => s.sourceId);
}

export function lint(m: OrgModel, knownSourceIds: Set<string>): LintFinding[] {
  const out: LintFinding[] = [];
  const add = (level: LintLevel, code: string, target: string, message: string) =>
    out.push({ level, code, target, message });

  const contractIds = new Set(m.contracts.map(c => c.id));
  const nodeIds = new Set(m.nodes.map(n => n.id));

  for (const c of m.contracts) {
    if (!c.parties.trim()) add('error', 'contract.no-party', c.id, 'contract has no outside party');
    if (!c.give.trim()) add('warn', 'contract.no-give', c.id, 'no give-leg: what does the org give?');
    if (!c.get.trim()) add('warn', 'contract.no-get', c.id, 'no get-leg: how is it sustained?');
    if (c.terms.length === 0) add('warn', 'contract.no-terms', c.id, 'no terms recorded');
    if (c.signals.outbound.length === 0 && c.signals.inbound.length === 0)
      add('warn', 'contract.no-signals', c.id, 'no signals on either leg');
    if (c.sources.length === 0) add('warn', 'contract.uncited', c.id, 'contract cites no source');
    for (const id of contractCitations(c))
      if (!knownSourceIds.has(id)) add('error', 'contract.bad-citation', c.id, `cites missing source: ${id}`);
  }

  for (const n of m.nodes) {
    if (!n.name.trim()) add('error', 'node.no-name', n.id, 'node has no name');
    if (!n.madeOf.trim()) add('warn', 'node.no-madeof', n.id, 'no made-of recorded');
    if (!n.needs.trim()) add('warn', 'node.no-needs', n.id, 'no needs recorded');
    if (n.sources.length === 0) add('warn', 'node.uncited', n.id, 'node cites no source');
    for (const d of n.reliesOn)
      if (!nodeIds.has(d)) add('error', 'node.bad-dependency', n.id, `relies on missing node: ${d}`);
    for (const s of n.keeps)
      if (!contractIds.has(s)) add('error', 'node.bad-keep', n.id, `keeps missing contract: ${s}`);
    for (const s of n.sources)
      if (!knownSourceIds.has(s.sourceId)) add('error', 'node.bad-citation', n.id, `cites missing source: ${s.sourceId}`);
  }

  // completeness gate
  for (const c of uncoveredContracts(m)) add('warn', 'gate.uncovered-contract', c.id, 'no core node keeps this contract');
  // a core/supporting node should trace to a contract; platform nodes legitimately do not
  for (const n of m.nodes)
    if (n.keeps.length === 0 && n.archetype !== 'platform')
      add('warn', 'gate.orphan-node', n.id, `${n.archetype} node keeps no contract`);

  return out;
}

export function isClean(findings: LintFinding[]): boolean {
  return findings.length === 0;
}

export function errors(findings: LintFinding[]): LintFinding[] {
  return findings.filter(f => f.level === 'error');
}
