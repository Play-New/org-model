/**
 * Serialize the model to/from markdown files with YAML frontmatter.
 *
 * Frontmatter is the source of truth (parsed back on read). The body is a
 * generated, human-readable rendering for git diffs and the file viewer — it is
 * never parsed back. Round-trip identity holds on the frontmatter:
 * parse(serialize(x)) deep-equals x.
 *
 * Uses js-yaml (robust nesting for measures) rather than the slim slice-1 parser.
 */

import yaml from 'js-yaml';
import type {
  Citation,
  Contract,
  ContractHealth,
  Measure,
  Node,
  Orientation,
} from './model';

/* ----------------------------- citations ------------------------------ */

/** On disk a citation is a string: `sourceId` or `sourceId §locator`. */
function citationToStr(c: Citation): string {
  return c.locator ? `${c.sourceId} §${c.locator}` : c.sourceId;
}

function strToCitation(s: string): Citation {
  const i = s.indexOf('§');
  if (i === -1) return { sourceId: s.trim() };
  return { sourceId: s.slice(0, i).trim(), locator: s.slice(i + 1).trim() };
}

function citationsToStr(cs: Citation[]): string[] {
  return cs.map(citationToStr);
}

function strToCitations(v: unknown): Citation[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map(strToCitation);
}

/* ------------------------------ measures ------------------------------- */

interface MeasureOnDisk {
  what: string;
  value?: string;
}

function measureToDisk(m: Measure): MeasureOnDisk {
  const out: MeasureOnDisk = { what: m.what };
  if (m.value !== undefined) out.value = m.value;
  return out;
}

function diskToMeasure(v: unknown): Measure {
  const o = (v ?? {}) as Record<string, unknown>;
  const m: Measure = { what: typeof o.what === 'string' ? o.what : '' };
  if (typeof o.value === 'string') m.value = o.value;
  return m;
}

function diskToMeasures(v: unknown): Measure[] {
  return Array.isArray(v) ? v.map(diskToMeasure) : [];
}

/* --------------------------- frontmatter I/O --------------------------- */

function frontmatter(obj: Record<string, unknown>): string {
  const y = yaml.dump(obj, { lineWidth: 100, noRefs: true, sortKeys: false }).trimEnd();
  return `---\n${y}\n---\n`;
}

export function splitFrontmatter(md: string): { data: Record<string, unknown>; body: string } {
  if (!md.startsWith('---')) return { data: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: md };
  const block = md.slice(3, end);
  const body = md.slice(end + 4).replace(/^\r?\n/, '');
  const data = (yaml.load(block) as Record<string, unknown>) ?? {};
  return { data, body };
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/* ------------------------------ contracts ------------------------------ */

export function contractToMarkdown(c: Contract): string {
  const data: Record<string, unknown> = {
    id: c.id,
    type: 'contract',
    with: c.withParty,
    'org-gives': c.give,
    'org-gets': c.get,
    constraints: c.constraints,
    measures: {
      'org-gives': c.measures.give.map(measureToDisk),
      'org-gets': c.measures.get.map(measureToDisk),
    },
    ...(c.health ? { health: c.health } : {}),
    sources: citationsToStr(c.sources),
  };
  // The body is the agent's prose (Zeno-style: headings + inline (source) citations).
  return `${frontmatter(data)}\n${(c.note ?? '').trim()}\n`;
}

export function parseContract(md: string): Contract {
  const { data, body } = splitFrontmatter(md);
  const measures = (data.measures ?? {}) as Record<string, unknown>;
  const note = body.trim();
  return {
    id: str(data.id),
    withParty: str(data.with),
    give: str(data['org-gives'] ?? data.gives),
    get: str(data['org-gets'] ?? data.gets),
    constraints: strArray(data.constraints),
    measures: {
      give: diskToMeasures(measures['org-gives'] ?? measures.gives),
      get: diskToMeasures(measures['org-gets'] ?? measures.gets),
    },
    ...(typeof data.health === 'string'
      ? { health: data.health as ContractHealth }
      : {}),
    ...(note ? { note } : {}),
    sources: strToCitations(data.sources),
  };
}

/* -------------------------------- nodes -------------------------------- */

export function nodeToMarkdown(n: Node): string {
  const data: Record<string, unknown> = {
    id: n.id,
    type: 'node',
    name: n.name,
    orientation: n.orientation,
    supports: n.supports,
    dependsOn: n.dependsOn,
    composition: n.composition,
    needsToday: n.needsToday,
    sources: citationsToStr(n.sources),
  };
  return `${frontmatter(data)}\n${(n.note ?? '').trim()}\n`;
}

export function parseNode(md: string): Node {
  const { data, body } = splitFrontmatter(md);
  const orientation = str(data.orientation);
  const note = body.trim();
  return {
    id: str(data.id),
    name: str(data.name),
    orientation: (['core', 'service', 'platform'].includes(orientation)
      ? orientation
      : 'service') as Orientation,
    supports: strArray(data.supports),
    dependsOn: strArray(data.dependsOn),
    composition: str(data.composition),
    needsToday: str(data.needsToday),
    ...(note ? { note } : {}),
    sources: strToCitations(data.sources),
  };
}

/** Detect whether a markdown file holds a contract or a node. */
export function itemType(md: string): 'contract' | 'node' | 'unknown' {
  const { data } = splitFrontmatter(md);
  if (data.type === 'contract') return 'contract';
  if (data.type === 'node') return 'node';
  return 'unknown';
}
