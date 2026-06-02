/**
 * Load and save the model through a StorageAdapter. This is the bridge the
 * agent's tools sit on top of: read the whole model, write one contract or node,
 * enumerate sources. Storage-agnostic (local folder or GitHub).
 */

import type { StorageAdapter } from '../storage/adapter';
import type { Contract, Node, OrgModel } from './model';
import { contractToMarkdown, nodeToMarkdown, parseContract, parseNode } from './serializer';

export const CONTRACTS_DIR = 'contracts/';
export const NODES_DIR = 'nodes/';
export const SOURCES_DIR = 'sources/';

export async function loadModel(a: StorageAdapter): Promise<OrgModel> {
  const contracts: Contract[] = [];
  for (const p of await a.list(CONTRACTS_DIR)) {
    if (!p.endsWith('.md')) continue;
    const md = await a.read(p);
    if (md) contracts.push(parseContract(md));
  }
  const nodes: Node[] = [];
  for (const p of await a.list(NODES_DIR)) {
    if (!p.endsWith('.md')) continue;
    const md = await a.read(p);
    if (md) nodes.push(parseNode(md));
  }
  return { contracts, nodes };
}

export async function saveContract(a: StorageAdapter, c: Contract): Promise<void> {
  await a.write(`${CONTRACTS_DIR}${c.id}.md`, contractToMarkdown(c));
}

export async function saveNode(a: StorageAdapter, n: Node): Promise<void> {
  await a.write(`${NODES_DIR}${n.id}.md`, nodeToMarkdown(n));
}

/** Source ids = source filenames under sources/, without extension. */
export async function listSourceIds(a: StorageAdapter): Promise<Set<string>> {
  const paths = await a.list(SOURCES_DIR);
  return new Set(paths.map(p => p.slice(SOURCES_DIR.length).replace(/\.[^.]+$/, '')).filter(Boolean));
}
