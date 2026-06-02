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
import type { DocumentBlock, ImageBlock, UserBlock } from '../agent/types';
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
  send: (
    text: string,
    images?: ImageBlock[],
    docs?: { name: string; text: string }[],
    pdfs?: { name: string; file: File }[],
  ) => Promise<void>;
  resolvePending: (ok: boolean) => void;
  newChat: () => void;
  openThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
}

const KICKOFF =
  'Session start — the user just opened a chat and has not written yet. First call read_model, then ' +
  'open in the user’s language, plain and short (no markdown headings, no slogans), ADAPTING to what ' +
  'the model already contains:\n' +
  '- If the model is EMPTY (no contracts and no nodes): introduce yourself in ONE line (what you do), ' +
  'name in one line the two things you build together — contracts and nodes — say you work from their ' +
  'documents first, and ask for the most useful ones (statute, latest financials, a "how we are funded" ' +
  'page, a deck). A few sentences, no lecture on what an organization is.\n' +
  '- If the model ALREADY has content: do NOT introduce yourself and do NOT explain what an organization ' +
  'is — the user has seen it. Just greet in one short line, say where things stand (how many contracts / ' +
  'nodes, what is still missing or unconfirmed), and ask the single most useful next question or propose ' +
  'the next step.\n' +
  'No write tools in this first turn.';

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
        console.error('[org] agent error:', e); // the real cause, for diagnosis in DevTools
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
    async (
      text: string,
      images: ImageBlock[] = [],
      docs: { name: string; text: string }[] = [],
      pdfs: { name: string; file: File }[] = [],
    ) => {
      // Upload PDFs to the Files API first, then reference them by id — keeps the
      // request small so large documents go through. Failures surface like any other.
      const pdfBlocks: DocumentBlock[] = [];
      if (pdfs.length) {
        setBusy(true);
        setError(null);
        try {
          const { AnthropicProvider } = await import('../agent/anthropic');
          const provider = new AnthropicProvider({ apiKey: config.apiKey, model: config.model });
          for (const p of pdfs) pdfBlocks.push({ type: 'document', fileId: await provider.uploadFile(p.file) });
        } catch (e) {
          console.error('[org] upload error:', e);
          const lang = isLang(config.chatLanguage) ? config.chatLanguage : 'en';
          setError(humanizeError(e, k => translate(lang, k)));
          setBusy(false);
          return;
        }
      }
      const docBlocks = docs.map(d => ({ type: 'text' as const, text: `Documento allegato — ${d.name}:\n\n${d.text}` }));
      const names = [...docs.map(d => d.name), ...pdfs.map(p => p.name)];
      const hasFiles = names.length > 0 || images.length > 0;
      const body = text.trim() || (hasFiles ? 'Ti allego dei documenti — leggili e usali per mappare.' : '(allegato)');
      const display = text.trim() || (names.length ? `📎 ${names.join(', ')}` : '(allegato)');
      await run([...docBlocks, ...pdfBlocks, { type: 'text', text: body }, ...images], display);
    },
    [run, config],
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
