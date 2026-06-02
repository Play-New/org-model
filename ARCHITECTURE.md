# Architecture — local-first, GitHub-optional

No backend. The app is a static bundle; an org is a set of files. They meet in the
browser.

## Two things, kept apart

- **The app** (this repo) — generic, one static build, deployed once to GitHub
  Pages as an installable PWA. Brand comes from the wizard at runtime, not the code.
- **An org** (the data) — `contracts/`, `nodes/`, `sources/`, and a log. It lives
  either in a local folder or in a GitHub repo. One org per folder/repo.

The app never contains an org; an org never contains the app.

## One app, two sources, one interface

Everything — wizard, chat, agent, the map, diff cards — sits behind a single
`StorageAdapter` (`src/storage/adapter.ts`). The rest of the app never knows where
the bytes are. Two adapters implement it:

```
        ┌──────────── the app · static · GitHub Pages · installable PWA ────────────┐
        │       wizard · chat · agent · the map · diff cards                         │
        │                          StorageAdapter                                   │
        └──────────┬─────────────────────────────────────────────┬──────────────────┘
                   │ local                                        │ github
        File System Access API                              REST Contents + Trees API
                   │                                              │
        a folder on the user's disk                       a repo on github.com
        read + write · fast · private                     read + write · each save = a commit
```

- **Local** (`storage/localfs.ts`) — the user picks a folder; the handle is kept in
  IndexedDB so it survives a refresh. Clearing the browser cache loses no work — the
  work lives in the folder.
- **GitHub** (`storage/github.ts`) — the user gives `owner/repo`, a branch, and a
  fine-grained PAT (Contents: Read and write). Reads via the Contents/Trees API;
  every write is a commit on the branch. UTF-8-safe base64, a per-path SHA cache,
  and a one-shot retry if a concurrent push moves a file under us. The
  `{owner, repo, branch}` is in IndexedDB; the token is encrypted (see below).

`connect.ts` remembers the chosen source and reconnects silently next launch.

## The LLM is always the user's, always client-side

Anthropic SDK in the browser, BYOK. The key — and, on GitHub, the access token —
are encrypted at rest with a non-extractable Web Crypto AES-GCM key (in IndexedDB);
only ciphertext is stored, the key is never exportable, never shown in the UI, and
never written into the org. The page never sees them in transit beyond the calls it
makes on the user's behalf. See `src/config/secret.ts`.

## The LLM is the only writer

No UI edits the org directly. The agent calls tools (`write_contract`,
`write_node`, `save_source`, `append_log`); each pauses behind a diff card the user
confirms. On local that writes a file; on GitHub it makes a commit. Same gate.

## Sync

- **Local**: a folder is usually a git repo, so syncing is plain git done outside
  the app, or just files on disk.
- **GitHub**: the repo *is* the shared source of truth — the agent commits to it,
  others pull/clone. Multiple people see the same living model.

## What this buys

- Work privately and fast on disk, or collaborate through a repo — same app.
- One app to maintain; every org is just another folder/repo it can open.
- The data outlives the browser: plain markdown + YAML, readable and diffable
  without the app.

## Open decisions / next

1. **Settings-side source management** — let settings change the GitHub repo/token,
   not just the local folder.
2. **Disconnect & reset** — one action to forget the source + clear secrets.
3. **Batched commits** — today each write is its own commit; a per-turn commit (Git
   Data API: blobs → tree → commit) would be tidier. Not needed to ship.
