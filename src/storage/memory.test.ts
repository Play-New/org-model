import { describe, expect, it } from 'vitest';
import { MemoryAdapter } from './memory';

describe('MemoryAdapter', () => {
  it('writes, reads, lists and deletes', async () => {
    const a = new MemoryAdapter();
    expect(await a.read('contracts/x.md')).toBeNull();
    await a.write('contracts/x.md', 'hello');
    await a.write('nodes/y.md', 'world');
    expect(await a.read('contracts/x.md')).toBe('hello');
    expect(await a.list('contracts/')).toEqual(['contracts/x.md']);
    await a.delete('contracts/x.md');
    expect(await a.read('contracts/x.md')).toBeNull();
  });

  it('seeds from a record and handles bytes', async () => {
    const a = new MemoryAdapter({ 'sources/a.md': 'seed' });
    expect(await a.read('sources/a.md')).toBe('seed');
    await a.writeBytes('sources/img.png', new Uint8Array([1, 2, 3]));
    expect(await a.readBytes('sources/img.png')).toEqual(new Uint8Array([1, 2, 3]));
    expect((await a.list('sources/')).sort()).toEqual(['sources/a.md', 'sources/img.png']);
  });
});
