/**
 * Semantic review — the deterministic lint (orgmodel/lint.ts) checks structure;
 * this checks SENSE. The LLM reads the model and flags incoherence the lint can't
 * see: a gives/gets that doesn't match the prose, a misclassified archetype, a
 * promise louder than the delivery, a contract with no real return.
 *
 * It does NOT write — it returns findings, like lint, which the UI surfaces and
 * autoresearch can turn into improvement tasks.
 */

import type { OrgModel } from '../orgmodel/model';
import { type LlmProvider, type Message, textOf } from './types';

export interface SemanticFinding {
  target: string; // contract or node id (or 'model' for a whole-model note)
  kind: string; // short slug, e.g. 'gives-gets-mismatch'
  message: string; // one sentence: what is off, and why
}

const REVIEW = [
  'Review this org model for INCOHERENCE — things that are structurally complete but do not make sense. Judge SENSE, not completeness (a separate deterministic lint already checks completeness). Look for:',
  '- a contract whose org-gives / org-gets does not match what its prose note actually describes;',
  '- a node whose archetype (core / supporting / platform) looks wrong for what it does;',
  '- a promise louder than the delivery: org-gives claims more than the prose and signals support;',
  '- a contract with no real return (org-gets empty of substance) — how is it sustained?;',
  '- a node that claims to keep contracts it does not plausibly keep, or dependencies that make no sense.',
  'Return ONLY a JSON array, with nothing around it. Each item: {"target": "<contract-or-node id>", "kind": "<short-slug>", "message": "<one sentence: what is off and why>"}.',
  'If everything is coherent, return [].',
].join('\n');

/** Parse the findings JSON out of the model's reply, tolerantly (it may wrap the
 *  array in prose despite the instruction). Exported for testing. */
export function parseFindings(text: string): SemanticFinding[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map(x => ({
      target: typeof x.target === 'string' ? x.target : '',
      kind: typeof x.kind === 'string' ? x.kind : 'incoherence',
      message: typeof x.message === 'string' ? x.message : '',
    }))
    .filter(f => f.message);
}

/** Ask the LLM to read the model and report incoherence. Read-only — no writes. */
export async function semanticFindings(opts: {
  provider: LlmProvider;
  system: string;
  model: OrgModel;
}): Promise<SemanticFinding[]> {
  const modelJson = JSON.stringify({ contracts: opts.model.contracts, nodes: opts.model.nodes });
  const messages: Message[] = [
    { role: 'user', content: [{ type: 'text', text: `${REVIEW}\n\nTHE MODEL:\n${modelJson}` }] },
  ];
  const turn = await opts.provider.run({ system: opts.system, messages, tools: [] });
  return parseFindings(textOf(turn.content));
}
