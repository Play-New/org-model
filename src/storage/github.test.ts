import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromBase64, GitHubAdapter, type GitHubRepoRef, parseRepoRef, toBase64 } from './github';

const ref: GitHubRepoRef = { owner: 'acme', repo: 'org', branch: 'main' };
const enc = (s: string) => toBase64(new TextEncoder().encode(s));
const res = (status: number, data: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => data }) as unknown as Response;

afterEach(() => vi.unstubAllGlobals());

describe('parseRepoRef', () => {
  it('parses owner/repo, URLs, .git, and tree refs', () => {
    expect(parseRepoRef('acme/org')).toEqual(ref);
    expect(parseRepoRef('https://github.com/acme/org')).toEqual(ref);
    expect(parseRepoRef('acme/org.git')).toEqual(ref);
    expect(parseRepoRef('acme/org/tree/dev')).toEqual({ owner: 'acme', repo: 'org', branch: 'dev' });
    expect(parseRepoRef('not a repo')).toBeNull();
  });
});

describe('base64 UTF-8', () => {
  it('round-trips non-ASCII content', () => {
    const s = 'Però — città, naïve, 5×1000 €';
    expect(new TextDecoder().decode(fromBase64(toBase64(new TextEncoder().encode(s))))).toBe(s);
  });
});

describe('GitHubAdapter', () => {
  it('reads and decodes UTF-8 content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(200, { sha: 'abc', content: enc('città') })));
    expect(await new GitHubAdapter(ref, 't').read('contracts/x.md')).toBe('città');
  });

  it('returns null for a missing file', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(404, {})));
    expect(await new GitHubAdapter(ref, 't').read('nope.md')).toBeNull();
  });

  it('creates a new file: no sha, content as UTF-8 base64, on the branch', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return init?.method === 'PUT' ? res(200, { content: { sha: 'new' } }) : res(404, {});
      }),
    );
    await new GitHubAdapter(ref, 't').write('nodes/n.md', 'ciào');
    const put = calls.find(c => c.init?.method === 'PUT');
    const body = JSON.parse(put?.init?.body as string);
    expect(body.sha).toBeUndefined();
    expect(body.branch).toBe('main');
    expect(new TextDecoder().decode(fromBase64(body.content))).toBe('ciào');
  });

  it('updates with the sha learned from a prior read', async () => {
    const calls: { init?: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        calls.push({ init });
        return init?.method === 'PUT' ? res(200, { content: { sha: 'v2' } }) : res(200, { sha: 'v1', content: enc('old') });
      }),
    );
    const a = new GitHubAdapter(ref, 't');
    await a.read('contracts/c.md'); // learns sha v1
    await a.write('contracts/c.md', 'new');
    const put = calls.find(c => c.init?.method === 'PUT');
    expect(JSON.parse(put?.init?.body as string).sha).toBe('v1');
  });

  it('retries once on a 409 conflict', async () => {
    let puts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') {
          puts += 1;
          return puts === 1 ? res(409, {}) : res(200, { content: { sha: 'z' } });
        }
        return res(200, { sha: 'fresh' });
      }),
    );
    await new GitHubAdapter(ref, 't').write('log.md', 'x');
    expect(puts).toBe(2);
  });

  it('lists blobs under a prefix from the recursive tree', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/branches/')) return res(200, { commit: { commit: { tree: { sha: 'T' } } } });
        if (url.includes('/git/trees/'))
          return res(200, {
            tree: [
              { type: 'blob', path: 'org-model.json' },
              { type: 'blob', path: 'contracts/a.md' },
              { type: 'tree', path: 'contracts' },
              { type: 'blob', path: 'nodes/b.md' },
            ],
          });
        return res(404, {});
      }),
    );
    const a = new GitHubAdapter(ref, 't');
    expect(await a.list('contracts/')).toEqual(['contracts/a.md']);
    expect((await a.list('')).length).toBe(3);
  });

  it('refuses to write when read-only', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(200, {})));
    await expect(new GitHubAdapter(ref, 't', { writable: false }).write('x.md', 'y')).rejects.toThrow(/read-only/);
  });
});
