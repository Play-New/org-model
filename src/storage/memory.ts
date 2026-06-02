/**
 * In-memory storage. Used by tests and as a dev fallback before a real folder
 * or repo is connected. Implements the full StorageAdapter contract.
 */

import type { StorageAdapter } from './adapter';

export class MemoryAdapter implements StorageAdapter {
  readonly writable: boolean;
  private text = new Map<string, string>();
  private bytes = new Map<string, Uint8Array>();

  constructor(seed?: Record<string, string>, opts?: { writable?: boolean }) {
    this.writable = opts?.writable ?? true;
    if (seed) for (const [k, v] of Object.entries(seed)) this.text.set(k, v);
  }

  private guard() {
    if (!this.writable) throw new Error('storage is read-only');
  }

  async read(path: string): Promise<string | null> {
    return this.text.has(path) ? this.text.get(path)! : null;
  }

  async write(path: string, content: string): Promise<void> {
    this.guard();
    this.text.set(path, content);
  }

  async list(prefix: string): Promise<string[]> {
    const keys = new Set<string>([...this.text.keys(), ...this.bytes.keys()]);
    return [...keys].filter(k => k.startsWith(prefix)).sort();
  }

  async delete(path: string): Promise<void> {
    this.text.delete(path);
    this.bytes.delete(path);
  }

  async readBytes(path: string): Promise<Uint8Array | null> {
    return this.bytes.has(path) ? this.bytes.get(path)! : null;
  }

  async writeBytes(path: string, bytes: Uint8Array): Promise<void> {
    this.guard();
    this.bytes.set(path, bytes);
  }
}
