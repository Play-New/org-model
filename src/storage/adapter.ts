/**
 * Storage abstraction. The rest of the app never knows whether files live in a
 * local folder (File System Access API) or in a GitHub repo (GitHub API) — it
 * only sees this interface. See app/ARCHITECTURE.md.
 *
 * Paths are POSIX-style, relative to the org root: e.g. `contracts/clients.md`,
 * `nodes/delivery.md`, `sources/site.pdf`.
 */

export interface StorageAdapter {
  /** Whether writes are allowed (local = true; GitHub read-only = false for now). */
  readonly writable: boolean;

  /** File contents, or null if it does not exist. */
  read(path: string): Promise<string | null>;

  /** Create or overwrite a text file. Rejects if !writable. */
  write(path: string, content: string): Promise<void>;

  /** Paths of existing files under a prefix (e.g. `contracts/`), sorted. */
  list(prefix: string): Promise<string[]>;

  /** Remove a file. Optional; rejects if !writable. */
  delete?(path: string): Promise<void>;

  /** Raw bytes, for binary sources (PDF/images). Optional. */
  readBytes?(path: string): Promise<Uint8Array | null>;

  /** Write raw bytes (e.g. an uploaded source). Optional; rejects if !writable. */
  writeBytes?(path: string, bytes: Uint8Array): Promise<void>;
}
