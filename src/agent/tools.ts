/**
 * The tools the agent calls, executed in the browser against a StorageAdapter.
 * These are the only way the model writes anything (the agent leads,
 * the human ratifies — the UI wraps write tools in a diff card before they run).
 *
 * Storage-agnostic: works the same on a local folder or a GitHub repo.
 */

import { lint } from '../orgmodel/lint';
import type { Citation, Contract, Measure, Node } from '../orgmodel/model';
import { listSourceIds, loadModel, saveContract, saveNode, SOURCES_DIR } from '../orgmodel/store';
import type { StorageAdapter } from '../storage/adapter';
import type { ToolDef } from './types';

export interface ToolContext {
  adapter: StorageAdapter;
}

/* ----------------------------- coercion -------------------------------- */

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function cites(v: unknown): Citation[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x): Citation => (typeof x === 'string' ? { sourceId: x } : { sourceId: str((x as Record<string, unknown>)?.sourceId) }))
    .filter(c => c.sourceId);
}

function measures(v: unknown): Measure[] {
  if (!Array.isArray(v)) return [];
  return v.map((raw): Measure => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const m: Measure = { what: str(o.what) };
    if (typeof o.value === 'string') m.value = o.value;
    return m;
  });
}

function toContract(i: Record<string, unknown>): Contract {
  const m = (i.measures ?? {}) as Record<string, unknown>;
  const c: Contract = {
    id: str(i.id),
    withParty: str(i.with ?? i.withParty),
    give: str(i['org-gives'] ?? i.gives ?? i.give),
    get: str(i['org-gets'] ?? i.gets ?? i.get),
    constraints: strArr(i.constraints),
    measures: {
      give: measures(m['org-gives'] ?? m.gives ?? m.give),
      get: measures(m['org-gets'] ?? m.gets ?? m.get),
    },
    sources: cites(i.sources),
  };
  if (typeof i.health === 'string') c.health = i.health as Contract['health'];
  if (str(i.note)) c.note = str(i.note);
  return c;
}

function toNode(i: Record<string, unknown>): Node {
  const o = str(i.orientation);
  const n: Node = {
    id: str(i.id),
    name: str(i.name),
    orientation: (['core', 'service', 'platform'].includes(o) ? o : 'service') as Node['orientation'],
    supports: strArr(i.supports),
    dependsOn: strArr(i.dependsOn),
    composition: str(i.composition),
    needsToday: str(i.needsToday ?? i.needsNow),
    sources: cites(i.sources),
  };
  if (str(i.note)) n.note = str(i.note);
  return n;
}

async function prependLog(a: StorageAdapter, line: string): Promise<void> {
  const prev = (await a.read('log.md')) ?? '';
  await a.write('log.md', prev ? `${line}\n${prev}` : `${line}\n`);
}

/* ------------------------------ dispatch ------------------------------- */

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const a = ctx.adapter;
  const writeGuard = () => {
    if (!a.writable) throw new Error('storage is read-only — cannot write');
  };

  switch (name) {
    case 'read_model': {
      const model = await loadModel(a);
      const sources = await listSourceIds(a);
      return JSON.stringify({ contracts: model.contracts, nodes: model.nodes, lint: lint(model, sources) });
    }
    case 'write_contract': {
      writeGuard();
      const c = toContract(input);
      if (!c.id) throw new Error('contract needs an id');
      await saveContract(a, c);
      return `wrote contract: ${c.id}`;
    }
    case 'write_node': {
      writeGuard();
      const n = toNode(input);
      if (!n.id) throw new Error('node needs an id');
      await saveNode(a, n);
      return `wrote node: ${n.id}`;
    }
    case 'save_source': {
      writeGuard();
      const id = str(input.id);
      if (!id) throw new Error('source needs an id');
      await a.write(`${SOURCES_DIR}${id}.md`, str(input.content));
      return `saved source: ${id}`;
    }
    case 'append_log': {
      writeGuard();
      await prependLog(a, str(input.line));
      return 'logged';
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

/* ----------------------------- schemas --------------------------------- */

const citationsSchema = { type: 'array', items: { type: 'string' }, description: 'source ids' };
const measureSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: { what: { type: 'string' }, value: { type: 'string' } },
    required: ['what'],
  },
};

export const TOOL_DEFS: ToolDef[] = [
  {
    name: 'read_model',
    description: 'Read the whole org model (contracts + nodes) and the current lint findings.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'write_contract',
    description: 'Create or overwrite one contract (an exchange with an outside party).',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        with: { type: 'string', description: 'the outside party (short — just the party name)' },
        'org-gives': { type: 'string', description: 'what the organization gives this party' },
        'org-gets': { type: 'string', description: 'what comes back to the organization from this party' },
        constraints: { type: 'array', items: { type: 'string' }, description: 'the rules/terms that must hold, or the contract breaks' },
        measures: { type: 'object', properties: { 'org-gives': measureSchema, 'org-gets': measureSchema } },
        note: { type: 'string', description: 'human-readable prose body (markdown), like a short legal-document narrative — see the prompt for the required sections. Write it in the model language, with inline (source-id) citations.' },
        sources: citationsSchema,
      },
      required: ['id', 'with', 'org-gives', 'org-gets', 'note'],
    },
  },
  {
    name: 'write_node',
    description: 'Create or overwrite one node (a part the contracts rest on).',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        orientation: { type: 'string', enum: ['core', 'service', 'platform'] },
        supports: { type: 'array', items: { type: 'string' }, description: 'contract ids it keeps' },
        dependsOn: { type: 'array', items: { type: 'string' }, description: 'node ids it relies on' },
        composition: { type: 'string' },
        needsToday: { type: 'string' },
        note: { type: 'string', description: 'human-readable prose body (markdown): a short lead + one or two ## sub-headings, with inline (source-id) citations. This is what a person reads — write it in the model language.' },
        sources: citationsSchema,
      },
      required: ['id', 'name', 'orientation', 'note'],
    },
  },
  {
    name: 'save_source',
    description: 'Save a text source (e.g. an answer worth citing) under sources/.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' }, content: { type: 'string' } },
      required: ['id', 'content'],
    },
  },
  {
    name: 'append_log',
    description: 'Append one line to the audit log (most recent on top).',
    input_schema: {
      type: 'object',
      properties: { line: { type: 'string' } },
      required: ['line'],
    },
  },
];
