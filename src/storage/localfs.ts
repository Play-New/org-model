/**
 * Read and write an org in a local folder via the File System Access API.
 * Used by the builder. The chosen folder handle is kept in IndexedDB so the
 * connection survives a refresh (re-granting permission needs a user gesture).
 *
 * Chromium only (Edge / Chrome). Not unit-tested — the API needs a real browser
 * and a user gesture; it is exercised by the e2e suite and by hand.
 */

import { del, get, set } from 'idb-keyval';
import type { StorageAdapter } from './adapter';

const HANDLE_KEY = 'org-folder-handle';

function splitPath(path: string): { dir: string; name: string } {
  const i = path.lastIndexOf('/');
  return i === -1 ? { dir: '', name: path } : { dir: path.slice(0, i), name: path.slice(i + 1) };
}

export class LocalFSAdapter implements StorageAdapter {
  readonly writable = true;
  private readonly root: FileSystemDirectoryHandle;

  constructor(root: FileSystemDirectoryHandle) {
    this.root = root;
  }

  /** The chosen folder's name, for display in the wizard. */
  get name(): string {
    return this.root.name;
  }

  /** Prompt the user to choose a folder, and remember it. */
  static async pick(): Promise<LocalFSAdapter> {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await set(HANDLE_KEY, handle);
    return new LocalFSAdapter(handle);
  }

  /** Restore the previously chosen folder, if any. Permission may need re-granting. */
  static async restore(): Promise<LocalFSAdapter | null> {
    const handle = await get<FileSystemDirectoryHandle>(HANDLE_KEY);
    return handle ? new LocalFSAdapter(handle) : null;
  }

  static async forget(): Promise<void> {
    await del(HANDLE_KEY);
  }

  /** Check / request permission. requestPermission must run inside a user gesture. */
  async ensurePermission(mode: 'read' | 'readwrite' = 'readwrite'): Promise<boolean> {
    const opts = { mode } as FileSystemHandlePermissionDescriptor;
    if ((await this.root.queryPermission(opts)) === 'granted') return true;
    return (await this.root.requestPermission(opts)) === 'granted';
  }

  private async dir(path: string, create = false): Promise<FileSystemDirectoryHandle | null> {
    let h: FileSystemDirectoryHandle = this.root;
    for (const part of path.split('/').filter(Boolean)) {
      try {
        h = await h.getDirectoryHandle(part, { create });
      } catch {
        return null;
      }
    }
    return h;
  }

  async read(path: string): Promise<string | null> {
    const bytes = await this.readBytes(path);
    return bytes ? new TextDecoder().decode(bytes) : null;
  }

  async readBytes(path: string): Promise<Uint8Array | null> {
    const { dir, name } = splitPath(path);
    const d = await this.dir(dir);
    if (!d) return null;
    try {
      const fh = await d.getFileHandle(name);
      const file = await fh.getFile();
      return new Uint8Array(await file.arrayBuffer());
    } catch {
      return null;
    }
  }

  async write(path: string, content: string): Promise<void> {
    await this.writeChunk(path, content);
  }

  async writeBytes(path: string, bytes: Uint8Array): Promise<void> {
    // copy into a fresh ArrayBuffer-backed view so the type is BlobPart-safe
    await this.writeChunk(path, new Blob([new Uint8Array(bytes)]));
  }

  private async writeChunk(path: string, data: FileSystemWriteChunkType): Promise<void> {
    const { dir, name } = splitPath(path);
    const d = await this.dir(dir, true);
    if (!d) throw new Error(`cannot create directory for ${path}`);
    const fh = await d.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(data);
    await w.close();
  }

  async delete(path: string): Promise<void> {
    const { dir, name } = splitPath(path);
    const d = await this.dir(dir);
    if (d) await d.removeEntry(name);
  }

  async list(prefix: string): Promise<string[]> {
    const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    const d = await this.dir(base);
    if (!d) return [];
    const out: string[] = [];
    await this.walk(d, base, out);
    return out.sort();
  }

  private async walk(dir: FileSystemDirectoryHandle, path: string, out: string[]): Promise<void> {
    for await (const [name, handle] of dir.entries()) {
      const p = path ? `${path}/${name}` : name;
      if (handle.kind === 'file') out.push(p);
      else await this.walk(handle as FileSystemDirectoryHandle, p, out);
    }
  }
}
