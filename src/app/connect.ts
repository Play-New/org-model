/**
 * Turn a source choice into a live adapter, and remember it so the next launch
 * reconnects without asking. Two sources, one interface:
 *   - a local folder (File System Access; handle in IndexedDB), or
 *   - a GitHub repo (REST API; the {owner, repo, branch} in IndexedDB, the token
 *     encrypted in the secret store).
 * The picker / first connect needs a user gesture or a token; restore is silent.
 */

import { del, get, set } from 'idb-keyval';
import type { StorageAdapter } from '../storage/adapter';
import { GitHubAdapter, type GitHubRepoRef } from '../storage/github';
import { LocalFSAdapter } from '../storage/localfs';
import { getGithubToken, setGithubToken } from '../config/secret';

const CONN_KEY = 'org-model:connection';
export type Conn = { kind: 'local' } | ({ kind: 'github' } & GitHubRepoRef);

/** The remembered source, if any (to prefill the settings source picker). */
export async function getConnection(): Promise<Conn | null> {
  return (await get<Conn>(CONN_KEY)) ?? null;
}

/** Best-effort reconnect without a user gesture. Returns null if a pick is needed. */
export async function restoreAdapter(): Promise<StorageAdapter | null> {
  const conn = await get<Conn>(CONN_KEY);
  if (conn?.kind === 'github') {
    const token = await getGithubToken();
    if (!token) return null;
    const a = new GitHubAdapter({ owner: conn.owner, repo: conn.repo, branch: conn.branch }, token);
    return (await a.check().catch(() => false)) ? a : null;
  }
  // local (the default when nothing — or a stale marker — is stored)
  const local = await LocalFSAdapter.restore();
  if (!local) return null;
  return (await local.ensurePermission('readwrite')) ? local : null;
}

/** Prompt for a folder — must be called from a click handler. */
export async function connectLocalFolder(): Promise<LocalFSAdapter> {
  const a = await LocalFSAdapter.pick();
  await set(CONN_KEY, { kind: 'local' });
  return a;
}

/** Validate a repo + token, persist them on success, and return the adapter. */
export async function connectGithub(ref: GitHubRepoRef, token: string): Promise<GitHubAdapter> {
  const a = new GitHubAdapter(ref, token);
  if (!(await a.check())) {
    throw new Error(
      'Could not reach that repo with this token. Check the name, the branch, and that the token has Contents access to it.',
    );
  }
  await setGithubToken(token);
  await set(CONN_KEY, { kind: 'github', ...ref });
  return a;
}

/** Forget the remembered source (folder handle + GitHub ref). The token is cleared separately. */
export async function forgetConnection(): Promise<void> {
  await del(CONN_KEY);
  await LocalFSAdapter.forget();
}
