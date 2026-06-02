/**
 * Drives the guided conversation, with persistence and a proactive opening.
 *
 * - Threads are saved under sources/ (chats are source material) and resumed on
 *   reopen, so they survive a cache clear.
 * - On a fresh session the agent kicks off itself: reads the model, introduces
 *   itself, explains the project, asks the first question (no writes yet).
 * - Write tools pause behind a diff card; the model reloads after each run.
 *
 * The current thread is held in a ref and updated immutably (never mutated).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { runAgent } from '../agent/loop';
import { buildSystemPrompt } from '../agent/prompt';
import { humanizeError } from './errors';
import { isLang, translate } from '../i18n';
import type { ImageBlock, UserBlock } from '../agent/types';
import type { AppConfig } from '../config/config';
import { lint } from '../orgmodel/lint';
import { listSourceIds, loadModel } from '../orgmodel/store';
import type { StorageAdapter } from '../storage/adapter';
import {
  type ChatMessage,
  type ChatThread,
  deleteThread,
  listThreads,
  loadThread,
  newThread,
  saveThread,
  type ThreadMeta,
} from './chatStore';

export type { ChatMessage } from './chatStore';

export interface PendingWrite {
  name: string;
  input: Record<string, unknown>;
  resolve: (ok: boolean) => void;
}

export interface ChatState {
  messages: ChatMessage[];
  busy: boolean;
  pending: PendingWrite | null;
  error: string | null;
  threads: ThreadMeta[];
  currentId: string;
  send: (text: string, images?: ImageBlock[], docs?: { name: string; text: string }[]) => Promise<void>;
  resolvePending: (ok: boolean) => void;
  newChat: () => void;
  openThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
}

const KICKOFF =
  'Session start — the user just opened the app and has not written anything yet. ' +
  'First call read_model. Then open the conversation, in the user’s language, in a few plain, ' +
  'concrete sentences (short paragraphs, no markdown headings, no slogans): ' +
  '(1) introduce yourself in one line — what you do; ' +
  '(2) in one or two sentences say what an organization is here: the promises it keeps to the world, ' +
  'plus the parts inside that keep them. Then name the two things you will write down with them — ' +
  'contracts (what it gives each outside party, and what it gets back) and nodes (core delivers a ' +
  'promise, service serves the core, platform keeps the whole thing standing); ' +
  '(3) say you work from their documents first and ask only where the documents are silent; ' +
  '(4) ask your first question and invite the most useful documents (site, statute, a deck, a client ' +
  'contract, the latest numbers). Keep it short and human. No write tools in this first turn.';

export function useChat(adapter: StorageAdapter, config: AppConfig, onModelChanged: () => void): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ThreadMeta[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingWrite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const thread = useRef<ChatThread | null>(null);
  const booted = useRef(false);
  const streaming = useRef<number | null>(null);

  const persist = useCallback(async () => {
    const t = thread.current;
    if (!t) return;
    const updated: ChatThread = { ...t, updatedAt: new Date().toISOString() };
    thread.current = updated;
    await saveThread(adapter, updated);
    setThreads(await listThreads(adapter));
  }, [adapter]);

  const run = useCallback(
    async (userBlocks: UserBlock[], displayText: string | null) => {
      const t0 = thread.current;
      if (!t0) return;
      const display = displayText != null ? [...t0.display, { role: 'user' as const, text: displayText }] : t0.display;
      thread.current = { ...t0, protocol: [...t0.protocol, { role: 'user', content: userBlocks }], display };
      if (displayText != null) setMessages(display);
      setBusy(true);
      setError(null);
      streaming.current = null;
      try {
        const { AnthropicProvider } = await import('../agent/anthropic');
        const provider = new AnthropicProvider({ apiKey: config.apiKey, model: config.model, webSearch: true });
        const model = await loadModel(adapter);
        const sources = await listSourceIds(adapter);
        const modelJson = JSON.stringify({ contracts: model.contracts, nodes: model.nodes, lint: lint(model, sources) });
        const res = await runAgent({
          provider,
          system: buildSystemPrompt({ config, modelJson }),
          messages: thread.current.protocol,
          ctx: { adapter },
          onDelta: chunk => {
            const cur = thread.current;
            if (!cur) return;
            if (streaming.current == null) {
              const next = [...cur.display, { role: 'assistant' as const, text: chunk }];
              streaming.current = next.length - 1;
              thread.current = { ...cur, display: next };
              setMessages(next);
            } else {
              const next = cur.display.slice();
              const i = streaming.current;
              next[i] = { ...next[i], text: next[i].text + chunk };
              thread.current = { ...cur, display: next };
              setMessages(next);
            }
          },
          onAssistant: full => {
            const cur = thread.current;
            if (!cur || streaming.current == null) return;
            const i = streaming.current;
            const next = cur.display.slice();
            if (full.trim()) next[i] = { ...next[i], text: full };
            else next.splice(i, 1);
            streaming.current = null;
            thread.current = { ...cur, display: next };
            setMessages(next);
          },
          confirm: (name, input) => new Promise<boolean>(resolve => setPending({ name, input, resolve })),
        });
        const cur = thread.current;
        if (cur) thread.current = { ...cur, protocol: res.messages };
      } catch (e) {
        const lang = isLang(config.chatLanguage) ? config.chatLanguage : 'en';
        setError(humanizeError(e, k => translate(lang, k)));
      } finally {
        setBusy(false);
        setPending(null);
        await persist();
        onModelChanged();
      }
    },
    [adapter, config, onModelChanged, persist],
  );

  const startFresh = useCallback(() => {
    thread.current = newThread(Date.now().toString(36), new Date().toISOString());
    setCurrentId(thread.current.id);
    setMessages([]);
    void persist(); // list it right away, with its date label
    void run([{ type: 'text', text: KICKOFF }], null); // proactive opening
  }, [persist, run]);

  const openThread = useCallback(
    async (id: string) => {
      const t = await loadThread(adapter, id);
      if (!t) return;
      thread.current = t;
      setCurrentId(t.id);
      setMessages([...t.display]);
    },
    [adapter],
  );

  const renameThread = useCallback(
    async (id: string, title: string) => {
      const base = id === thread.current?.id ? thread.current : await loadThread(adapter, id);
      if (!base) return;
      const updated: ChatThread = { ...base, title: title.trim() }; // empty reverts to the auto label
      if (id === thread.current?.id) thread.current = updated;
      await saveThread(adapter, updated);
      setThreads(await listThreads(adapter));
    },
    [adapter],
  );

  const deleteChat = useCallback(
    async (id: string) => {
      await deleteThread(adapter, id);
      const metas = await listThreads(adapter);
      setThreads(metas);
      if (id !== thread.current?.id) return;
      // deleted the open chat — fall back to the most recent, else start fresh
      const next = metas[0] ? await loadThread(adapter, metas[0].id) : null;
      if (next) {
        thread.current = next;
        setCurrentId(next.id);
        setMessages([...next.display]);
      } else {
        startFresh();
      }
    },
    [adapter, startFresh],
  );

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void (async () => {
      const metas = await listThreads(adapter);
      setThreads(metas);
      const latest = metas[0] ? await loadThread(adapter, metas[0].id) : null;
      if (latest && latest.display.length > 0) {
        thread.current = latest;
        setCurrentId(latest.id);
        setMessages([...latest.display]);
      } else {
        startFresh();
      }
    })();
  }, [adapter, startFresh]);

  const send = useCallback(
    async (text: string, images: ImageBlock[] = [], docs: { name: string; text: string }[] = []) => {
      const docBlocks = docs.map(d => ({ type: 'text' as const, text: `Documento allegato — ${d.name}:\n\n${d.text}` }));
      const body = text.trim() || (docs.length ? 'Ti allego dei documenti — leggili e usali per mappare.' : '(allegato)');
      const display = text.trim() || (docs.length ? `📎 ${docs.map(d => d.name).join(', ')}` : '(allegato)');
      await run([...docBlocks, { type: 'text', text: body }, ...images], display);
    },
    [run],
  );

  const resolvePending = useCallback((ok: boolean) => {
    setPending(p => {
      p?.resolve(ok);
      return null;
    });
  }, []);

  return {
    messages,
    busy,
    pending,
    error,
    threads,
    currentId,
    send,
    resolvePending,
    newChat: () => startFresh(),
    openThread: id => void openThread(id),
    renameThread: (id, title) => void renameThread(id, title),
    deleteChat: id => void deleteChat(id),
  };
}
