/**
 * Chat persistence. Each conversation is a thread saved as `chats/<id>.json` in
 * the org folder, so history travels with the model. A thread keeps both the
 * human-facing messages and the raw protocol messages (to resume the agent).
 */

import type { Message } from '../agent/types';
import type { StorageAdapter } from '../storage/adapter';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  display: ChatMessage[];
  protocol: Message[];
}

export interface ThreadMeta {
  id: string;
  title: string;
  updatedAt: string;
}

// Chats live under sources/ — a conversation is source material for ingestion and
// must be citeable. They survive a cache clear because they're in the org folder.
export const CHATS_DIR = 'sources/';
const PREFIX = 'chat-';
const path = (id: string) => `${CHATS_DIR}${PREFIX}${id}.json`;

// A new thread carries no title (empty). The displayed name is derived: the first
// thing the user said, or — before they've said anything — the date it was opened,
// so fresh sessions are distinguishable instead of all reading "New session".
export function newThread(id: string, now: string): ChatThread {
  return { id, title: '', createdAt: now, updatedAt: now, display: [], protocol: [] };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A short, human date for an untitled session, e.g. "31 May, 14:46". */
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'New session';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The name to show: a manual title if set, else the first user line, else the date. */
export function threadTitle(t: ChatThread): string {
  if (t.title.trim()) return t.title.trim();
  const text = t.display.find(m => m.role === 'user')?.text.trim();
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text;
  return dateLabel(t.createdAt);
}

export async function saveThread(a: StorageAdapter, t: ChatThread): Promise<void> {
  // Store only an explicit (manual) title; the rest is derived at display time.
  await a.write(path(t.id), `${JSON.stringify(t, null, 2)}\n`);
}

export async function loadThread(a: StorageAdapter, id: string): Promise<ChatThread | null> {
  const json = await a.read(path(id));
  if (!json) return null;
  try {
    return JSON.parse(json) as ChatThread;
  } catch {
    return null;
  }
}

/** Remove a chat transcript. The org's log.md (the write audit) is untouched —
 *  deleting a conversation does not rewrite history. */
export async function deleteThread(a: StorageAdapter, id: string): Promise<void> {
  await a.delete?.(path(id));
}

export async function listThreads(a: StorageAdapter): Promise<ThreadMeta[]> {
  const out: ThreadMeta[] = [];
  for (const p of await a.list(CHATS_DIR)) {
    if (!p.startsWith(`${CHATS_DIR}${PREFIX}`) || !p.endsWith('.json')) continue;
    const json = await a.read(p);
    if (!json) continue;
    try {
      const t = JSON.parse(json) as ChatThread;
      out.push({ id: t.id, title: threadTitle(t), updatedAt: t.updatedAt });
    } catch {
      // skip unreadable thread
    }
  }
  return out.sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
}
