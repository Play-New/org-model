/**
 * The agent's self-improvement loop. It turns lint findings into concrete
 * improvement instructions, then drives the agent (documents first, then ask
 * only in the gaps) round after round until the model lints clean or stops
 * improving. This is how the agent "learns and gets better as it knows the org".
 */

import { lint, type LintFinding } from '../orgmodel/lint';
import { listSourceIds, loadModel } from '../orgmodel/store';
import type { StorageAdapter } from '../storage/adapter';
import { runAgent } from './loop';
import type { LlmProvider, Message } from './types';

export interface ImprovementTask {
  code: string;
  target: string;
  instruction: string;
  priority: number; // 0 = highest
}

const INSTRUCTIONS: Record<string, (t: string) => string> = {
  'gate.uncovered-contract': t =>
    `Contract "${t}" has no core node delivering it. Find which part of the org keeps this promise (the org chart, or ask) and write a core node that keeps it.`,
  'gate.orphan-node': t =>
    `Node "${t}" keeps no contract. Connect it to the contract it serves, or reclassify it (platform nodes are allowed to keep none).`,
  'contract.no-get': t =>
    `Contract "${t}" has no get-leg. Determine what the org gets back from this party (the budget/financials, or ask) and fill it.`,
  'contract.no-give': t => `Contract "${t}" has no give-leg. State what the org gives this party.`,
  'contract.no-signals': t =>
    `Contract "${t}" has no signals. Find how each leg is actually read (reports, or ask). Observed, not targets.`,
  'contract.no-terms': t => `Contract "${t}" records no terms. Identify what must hold for it not to break.`,
  'contract.uncited': t => `Contract "${t}" cites no source. Attach the document(s) it comes from.`,
  'node.no-madeof': t => `Node "${t}" has no made-of. Describe what it is made of, key people included.`,
  'node.no-needs': t => `Node "${t}" has no needs. State what it needs right now to stand.`,
  'node.uncited': t => `Node "${t}" cites no source.`,
};

export function planImprovements(findings: LintFinding[]): ImprovementTask[] {
  return findings
    .map((f): ImprovementTask => {
      const make = INSTRUCTIONS[f.code];
      return {
        code: f.code,
        target: f.target,
        instruction: make ? make(f.target) : `${f.message} (${f.target})`,
        priority: f.level === 'error' ? 0 : f.code.startsWith('gate.') ? 1 : 2,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

export interface ImproveOptions {
  provider: LlmProvider;
  system: string;
  adapter: StorageAdapter;
  maxRounds?: number;
  tasksPerRound?: number;
  onRound?: (round: number, remaining: number) => void;
}

export interface ImproveResult {
  rounds: number;
  clean: boolean;
  remaining: number;
}

async function findingsNow(adapter: StorageAdapter): Promise<LintFinding[]> {
  const model = await loadModel(adapter);
  return lint(model, await listSourceIds(adapter));
}

export async function improveUntilClean(opts: ImproveOptions): Promise<ImproveResult> {
  const max = opts.maxRounds ?? 5;
  const perRound = opts.tasksPerRound ?? 5;
  let prev = Infinity;

  for (let round = 1; round <= max; round++) {
    const findings = await findingsNow(opts.adapter);
    opts.onRound?.(round - 1, findings.length);
    if (findings.length === 0) return { rounds: round - 1, clean: true, remaining: 0 };
    if (findings.length >= prev) return { rounds: round - 1, clean: false, remaining: findings.length }; // no progress
    prev = findings.length;

    const tasks = planImprovements(findings).slice(0, perRound);
    const instruction = [
      'Improve the org model. Address these gaps — documents first, then ask only in the gaps:',
      ...tasks.map(t => `- ${t.instruction}`),
    ].join('\n');
    const messages: Message[] = [{ role: 'user', content: [{ type: 'text', text: instruction }] }];
    await runAgent({ provider: opts.provider, system: opts.system, messages, ctx: { adapter: opts.adapter } });
  }

  const remaining = (await findingsNow(opts.adapter)).length;
  return { rounds: max, clean: remaining === 0, remaining };
}
