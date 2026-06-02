/**
 * Read and write an org in a GitHub repo via the REST Contents + Git Trees APIs.
 * Implements the same StorageAdapter as the local folder, so the agent, the map,
 * and the diff cards work unchanged — the bytes just live in a repo. Each write is
 * a commit (always behind a diff card). Auth is a fine-grained PAT with
 * Contents: read and write; it is stored encrypted (secret.ts), never here.
 */

import type { StorageAdapter } from './adapter';

const API = 'https://api.github.com';

export interface GitHubRepoRef {
  owner: string;
  repo: string;
  branch: string;
}

/** Parse "owner/repo", a full URL, or "owner/repo/tree/branch" into a ref. */
export function parseRepoRef(input: string, fallbackBranch = 'main'): GitHubRepoRef | null {
  const s = input.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
  const m = /^([^/\s]+)\/([^/\s]+)(?:\/tree\/([^/\s]+))?$/.exec(s);
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3] || fallbackBranch };
}

// btoa/atob are Latin1; org content is often non-ASCII (Italian, accents) — go via UTF-8.
export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
export function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class GitHubAdapter implements StorageAdapter {
  readonly writable: boolean;
  private readonly ref: GitHubRepoRef;
  private readonly token: string;
  private readonly shas = new Map<string, string>(); // path → blob sha, for updates/deletes

  constructor(ref: GitHubRepoRef, token: string, opts?: { writable?: boolean }) {
    this.ref = ref;
    this.token = token;
    this.writable = opts?.writable ?? true;
  }

  get repoLabel(): string {
    return `${this.ref.owner}/${this.ref.repo}`;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private contentUrl(path: string): string {
    return `${API}/repos/${this.ref.owner}/${this.ref.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  private guard() {
    if (!this.writable) throw new Error('storage is read-only');
  }

  /** Confirm the token reaches the repo (used at connect time). */
  async check(): Promise<boolean> {
    const r = await fetch(`${API}/repos/${this.ref.owner}/${this.ref.repo}`, { headers: this.headers() });
    return r.ok;
  }

  async readBytes(path: string): Promise<Uint8Array | null> {
    const r = await fetch(`${this.contentUrl(path)}?ref=${encodeURIComponent(this.ref.branch)}`, { headers: this.headers() });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub read ${path}: ${r.status}`);
    const json = await r.json();
    if (Array.isArray(json)) return null; // a directory, not a file
    if (typeof json.sha === 'string') this.shas.set(path, json.sha);
    if (json.content) return fromBase64(json.content);
    if (json.download_url) {
      // file too large for the Contents API to inline — fetch the raw bytes
      const raw = await fetch(json.download_url);
      return new Uint8Array(await raw.arrayBuffer());
    }
    return null;
  }

  async read(path: string): Promise<string | null> {
    const bytes = await this.readBytes(path);
    return bytes ? new TextDecoder().decode(bytes) : null;
  }

  async write(path: string, content: string): Promise<void> {
    await this.put(path, toBase64(new TextEncoder().encode(content)));
  }

  async writeBytes(path: string, bytes: Uint8Array): Promise<void> {
    await this.put(path, toBase64(bytes));
  }

  private async put(path: string, contentB64: string, retry = true): Promise<void> {
    this.guard();
    const sha = this.shas.has(path) ? this.shas.get(path) : await this.fetchSha(path);
    const body = {
      message: `org: update ${path}`,
      content: contentB64,
      branch: this.ref.branch,
      ...(sha ? { sha } : {}),
    };
    const r = await fetch(this.contentUrl(path), { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    if ((r.status === 409 || r.status === 422) && retry) {
      // the file moved under us (someone else pushed) — refresh the sha and retry once
      this.shas.delete(path);
      await this.fetchSha(path);
      return this.put(path, contentB64, false);
    }
    if (!r.ok) throw new Error(`GitHub write ${path}: ${r.status}`);
    const json = await r.json();
    if (json?.content?.sha) this.shas.set(path, json.content.sha);
  }

  private async fetchSha(path: string): Promise<string | undefined> {
    const r = await fetch(`${this.contentUrl(path)}?ref=${encodeURIComponent(this.ref.branch)}`, { headers: this.headers() });
    if (!r.ok) return undefined;
    const json = await r.json();
    const sha = Array.isArray(json) ? undefined : json.sha;
    if (sha) this.shas.set(path, sha);
    return sha;
  }

  async delete(path: string): Promise<void> {
    this.guard();
    const sha = this.shas.has(path) ? this.shas.get(path) : await this.fetchSha(path);
    if (!sha) return; // nothing there
    const body = { message: `org: delete ${path}`, sha, branch: this.ref.branch };
    const r = await fetch(this.contentUrl(path), { method: 'DELETE', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok && r.status !== 404) throw new Error(`GitHub delete ${path}: ${r.status}`);
    this.shas.delete(path);
  }

  async list(prefix: string): Promise<string[]> {
    const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    const br = await fetch(
      `${API}/repos/${this.ref.owner}/${this.ref.repo}/branches/${encodeURIComponent(this.ref.branch)}`,
      { headers: this.headers() },
    );
    if (!br.ok) return [];
    const treeSha = (await br.json())?.commit?.commit?.tree?.sha;
    if (!treeSha) return [];
    const tr = await fetch(
      `${API}/repos/${this.ref.owner}/${this.ref.repo}/git/trees/${treeSha}?recursive=1`,
      { headers: this.headers() },
    );
    if (!tr.ok) return [];
    const json = (await tr.json()) as { tree?: { type: string; path: string }[] };
    return (json.tree ?? [])
      .filter(e => e.type === 'blob' && (base === '' || e.path === base || e.path.startsWith(`${base}/`)))
      .map(e => e.path)
      .sort();
  }
}
