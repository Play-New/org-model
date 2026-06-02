# Build log

What's built, in order. Standard: nothing lands unless it typechecks, lints, and
its tests pass. Current status at the bottom.

## Foundations

- **Model** (`orgmodel/`) — `model.ts` (Contract + Node + the readings),
  `serializer.ts` (model ↔ markdown+YAML, round-trip tested), `lint.ts`
  (completeness + citations), `mapview.ts` / `viewmodel.ts` (pure layout + sidebar),
  `store.ts` (load/save through any adapter). All tested.
- **Storage** — one `StorageAdapter` (`storage/adapter.ts`) with an in-memory
  adapter for tests, a local-folder adapter (`localfs.ts`, File System Access +
  handle in IndexedDB), and a GitHub adapter (see below).
- **Agent** (`agent/`) — message protocol, in-browser tools (read_model,
  write_contract, write_node, save_source, append_log + read-only guard), the
  tool-use loop with a confirm gate, the Anthropic provider (BYOK, streaming,
  web-search, vision), the autoresearch lint→fix driver, and the system prompt
  builder. Tested with a MockProvider + MemoryAdapter, including an engine-level
  end-to-end session.
- **App** — wizard → connect → three-pane shell (`Org/` files · chat · workspace),
  brand from config, design tokens. Files pane with fill-state dots; chat with the
  diff-card gate, vision, document upload; react-flow map. Code-split, PWA.

## Identity & storage

- **Secrets encrypted at rest** (`config/secret.ts`) — the Anthropic key and the
  GitHub token live encrypted in IndexedDB (non-extractable AES-GCM), shown as blank
  password fields, never written into the org.
- **Org identity** (`config/orgSettings.ts`) → `org-model.json` in the source, so it
  travels with the data; only the key/token stay on the device.
- **GitHub read + write** (`storage/github.ts`) — Contents + Trees API, UTF-8
  base64, per-path SHA cache, one-shot retry on a 409 conflict, read-only guard.
  `app/connect.ts` handles both sources (folder / repo) and reconnects silently.
  Wizard storage step: source toggle + GitHub connect (repo / branch / token) with
  inline token instructions and a link. Engine e2e commits a contract + node to a
  mocked repo and reads them back.

## Experience

- Streaming replies; chat persistence (chats are sources) with **date→topic titles**
  and **delete** (the `log.md` audit is left intact); document upload — text/md and
  images (vision), and **PDF via the Anthropic Files API** (upload once, reference by
  `file_id`, no per-request size limit; files beta sent only on calls that use it).
- The open language spec (`LANGUAGE.md`) the agent applies, and the agent prompt
  wired to it (the agent as the bridge org→language); analysis layer designed in
  `ANALYSIS.md`.
- Welcome screen; a **constellation** brand mark (favicon · welcome · topbar);
  custom, keyboard-accessible controls (the Select is portalled — no clipping,
  scrolls, flips up; drawn radios; custom file uploader).
- Map colour legend; message fade-in; phone bottom-nav (Org / Chat / Map).
- Language-change warning (existing content won't auto-translate); explicit
  "no server — your device" copy on Welcome and the key step.

## History note

GitHub support was briefly removed and then reinstated as full read+write — the
current state is the latter. The app was extracted from a private working repo into
its own public repo (`Play-New/org`) on 2026-06-01; the code is generic.

## Status (2026-06-02)

`tsc` clean · `eslint` clean · **97 tests** · `vite build` clean · PWA
generated · deployed at https://play-new.github.io/org/.

The one thing tests can't cover is the live agent loop — it needs a real Anthropic
key (and, for GitHub, a repo + a fine-grained PAT with Contents: read+write). The
native folder/file pickers are OS dialogs, not automatable; the engine is covered
deterministically instead.

Open follow-ups and the resume handoff live in **CLAUDE.md**.

## Run

- `pnpm dev` — the app
- `pnpm test` — the suite
