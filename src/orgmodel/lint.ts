/**
 * Lint the model. A clean model returns []. Findings are deterministic and
 * drive both the file-state dots in the UI and the agent's self-improvement
 * loop (each finding is something for autoresearch to go fix).
 *
 * Errors = structurally broken (bad citation, dangling reference). Warnings =
 * incomplete (missing leg, no measures, uncited, completeness-gate gaps).
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
  const ids = c.sources.map(s => s.sourceId);
  for (const m of [...c.measures.give, ...c.measures.get]) {
    for (const s of m.sources) ids.push(s.sourceId);
  }
  return ids;
}

export function lint(m: OrgModel, knownSourceIds: Set<string>): LintFinding[] {
  const out: LintFinding[] = [];
  const add = (level: LintLevel, code: string, target: string, message: string) =>
    out.push({ level, code, target, message });

  const contractIds = new Set(m.contracts.map(c => c.id));
  const nodeIds = new Set(m.nodes.map(n => n.id));

  for (const c of m.contracts) {
    if (!c.withParty.trim()) add('error', 'contract.no-party', c.id, 'contract has no outside party');
    if (!c.give.trim()) add('warn', 'contract.no-give', c.id, 'no give-leg: what does the org give?');
    if (!c.get.trim()) add('warn', 'contract.no-get', c.id, 'no get-leg: how is it sustained?');
    if (c.constraints.length === 0) add('warn', 'contract.no-constraints', c.id, 'no conditions recorded');
    if (c.measures.give.length === 0 && c.measures.get.length === 0)
      add('warn', 'contract.no-measures', c.id, 'no measures on either leg');
    if (c.sources.length === 0) add('warn', 'contract.uncited', c.id, 'contract cites no source');
    for (const id of contractCitations(c))
      if (!knownSourceIds.has(id)) add('error', 'contract.bad-citation', c.id, `cites missing source: ${id}`);
  }

  for (const n of m.nodes) {
    if (!n.name.trim()) add('error', 'node.no-name', n.id, 'node has no name');
    if (!n.composition.trim()) add('warn', 'node.no-composition', n.id, 'no composition recorded');
    if (!n.needsToday.trim()) add('warn', 'node.no-needs', n.id, 'no needs-today recorded');
    if (n.sources.length === 0) add('warn', 'node.uncited', n.id, 'node cites no source');
    for (const d of n.dependsOn)
      if (!nodeIds.has(d)) add('error', 'node.bad-dependency', n.id, `depends on missing node: ${d}`);
    for (const s of n.supports)
      if (!contractIds.has(s)) add('error', 'node.bad-support', n.id, `supports missing contract: ${s}`);
    for (const s of n.sources)
      if (!knownSourceIds.has(s.sourceId)) add('error', 'node.bad-citation', n.id, `cites missing source: ${s.sourceId}`);
  }

  // completeness gate (AGENT-SPEC step 4)
  for (const c of uncoveredContracts(m)) add('warn', 'gate.uncovered-contract', c.id, 'no core node keeps this contract');
  // a core/service node should trace to a contract; platform nodes legitimately do not
  for (const n of m.nodes)
    if (n.supports.length === 0 && n.orientation !== 'platform')
      add('warn', 'gate.orphan-node', n.id, `${n.orientation} node keeps no contract`);

  return out;
}

export function isClean(findings: LintFinding[]): boolean {
  return findings.length === 0;
}

export function errors(findings: LintFinding[]): LintFinding[] {
  return findings.filter(f => f.level === 'error');
}
