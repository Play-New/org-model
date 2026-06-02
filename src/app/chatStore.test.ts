import { describe, expect, it } from 'vitest';
import { MemoryAdapter } from '../storage/memory';
import { type ChatThread, deleteThread, listThreads, loadThread, newThread, saveThread, threadTitle } from './chatStore';

function thread(id: string, now: string, userText?: string): ChatThread {
  const t = newThread(id, now);
  if (userText) t.display.push({ role: 'user', text: userText });
  return t;
}

describe('chatStore', () => {
  it('derives the displayed title', () => {
    // an untitled, empty session falls back to its creation date — not a shared placeholder
    expect(threadTitle(newThread('a', '2026-05-31T14:46:00Z'))).toMatch(/^\d{1,2} \w{3}, \d{2}:\d{2}$/);
    // the first user line wins once there is one
    expect(threadTitle(thread('a', 't', 'map my studio'))).toBe('map my studio');
    expect(threadTitle(thread('a', 't', 'x'.repeat(60)))).toHaveLength(49); // 48 + ellipsis
    // a manual title beats both
    expect(threadTitle({ ...newThread('a', '2026-05-31T14:46:00Z'), title: 'Kickoff' })).toBe('Kickoff');
  });

  it('saves and reloads a thread; the title derives at read time', async () => {
    const a = new MemoryAdapter();
    const t = thread('001', '2026-06-01T10:00:00Z', 'hello');
    t.protocol.push({ role: 'user', content: [{ type: 'text', text: 'hello' }] });
    await saveThread(a, t);
    const back = await loadThread(a, '001');
    expect(back?.title).toBe(''); // nothing manual is stored
    expect(back && threadTitle(back)).toBe('hello'); // derived from the first user line
    expect(back?.display).toEqual([{ role: 'user', text: 'hello' }]);
    expect(back?.protocol).toHaveLength(1);
  });

  it('persists a manual title verbatim', async () => {
    const a = new MemoryAdapter();
    await saveThread(a, { ...thread('003', '2026-06-01T10:00:00Z', 'hello'), title: 'Onboarding' });
    const back = await loadThread(a, '003');
    expect(back?.title).toBe('Onboarding');
    expect(back && threadTitle(back)).toBe('Onboarding');
  });

  it('deletes a chat transcript but leaves other files (e.g. the log) intact', async () => {
    const a = new MemoryAdapter();
    await a.write('log.md', '# audit\n- a write happened\n');
    await saveThread(a, thread('001', '2026-06-01T10:00:00Z', 'one'));
    await saveThread(a, thread('002', '2026-06-01T11:00:00Z', 'two'));
    await deleteThread(a, '001');
    expect((await listThreads(a)).map(m => m.id)).toEqual(['002']);
    expect(await a.read('log.md')).toContain('a write happened'); // audit untouched
  });

  it('lists threads most-recent first, with derived titles', async () => {
    const a = new MemoryAdapter();
    await saveThread(a, thread('001', '2026-06-01T10:00:00Z', 'first'));
    await saveThread(a, thread('002', '2026-06-01T12:00:00Z', 'second'));
    const metas = await listThreads(a);
    expect(metas.map(m => m.id)).toEqual(['002', '001']);
    expect(metas[0].title).toBe('second');
  });
});
