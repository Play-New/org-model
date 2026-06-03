# Org/ — the app

Working memory for whoever builds this app (you, a future session, contributors).
Read this first when resuming; it is the handoff anchor.

## What this is

A **local-first, browser-only PWA** that helps anyone map their organization from
scratch, guided by an agent, **document-first**, **no backend**. The model is three
things — two structural, one observational:

- **Contracts** — the exchanges with the world: `parties`, what the org gives / gets,
  and `terms` (what must hold, or it breaks).
- **Nodes** — the parts inside that keep them: **core** (delivers a promise),
  **supporting** (serves the core), **platform** (keeps the whole thing standing),
  with dependencies (`keeps` contracts / `relies on` nodes). People and activities
  live inside nodes.
- **Signals** — the observed state: inbound / outbound, tracked over time → a
  contract's **health** (`healthy / strained / broken / unknown`, read off, never
  asserted).

The lens, in one line: *an organization = the promises it keeps to the world + the
parts inside that keep them; the signals tell whether it is holding.* As-is only —
never should-be in the structure; interpretation lives in `canon/ANALYSIS.md`.

The full open spec is **`canon/STRUCTURE.md`** (cites Cicero / Boundaryless + Promise
Theory). The agent doesn't invent a framework per company; it applies that fixed
description and is the **bridge** that contextualizes it from the org's documents
(the system prompt opens on this). The map reveals, on its own: which resource the
org really runs on, single points of failure, core-vs-platform weight, where the
promise is louder than the delivery, and who gets the value vs who pays.

**Generic by design.** Nothing about any specific org is hardcoded: brand (name,
logo), languages, model — all come from the first-run wizard at runtime. (Extracted
on 2026-06-01 from a private working repo into its own repo; the code is generic —
any org can open it.)

## Hard rules (do not break)

1. **The LLM is the only writer.** No UI ever edits the org directly — no inline
   editor, no rename, no "edit raw". Every write goes through a tool
   (`write_contract` / `write_node` / `save_source` / `append_log`) behind a **diff
   card the user confirms**.
2. **Secrets are encrypted, never shown.** The Anthropic API key *and* the GitHub
   token are encrypted at rest (Web Crypto AES-GCM, non-extractable key in
   IndexedDB; only ciphertext stored), shown as blank password fields, and **never
   written into the org**. See `src/config/secret.ts`.
3. **Two storage sources, one interface.** A local folder (File System Access) or a
   GitHub repo (REST, read+write, each save is a commit). Everything sits behind
   `src/storage/adapter.ts`; the agent/map/diff cards don't know the difference.
4. **Vanilla CSS + design tokens only** (`src/styles/tokens.css`). No CSS-in-JS, no
   Tailwind. Custom controls everywhere (no native `<select>`, radios, file inputs).
5. **Anti-rhetoric voice** in all copy. Plain, concrete, no slogans.
6. **Defect-to-test.** Every bug caught by hand becomes a test (see `*.test.ts`).
7. **All UI strings go through i18n** (`src/i18n.tsx`) — one dictionary, six
   languages (en · it · es · fr · de · pt). The interface follows the *chat*
   language (`modelLanguage` is separate). Deliberately kept literal across
   languages: `Org/`, `core`, `supporting`, `platform`, `log`. A guard test asserts
   every key is present in all six.

## Stack

Vite 8 + React 19 + TypeScript, vanilla CSS. Anthropic SDK in the browser (BYOK,
streaming, web-search tool, vision). `@xyflow/react` for the map. `idb-keyval` for
the folder handle / connection / encrypted secrets. PWA via `vite-plugin-pwa`.
Deployed once to GitHub Pages (`.github/workflows/deploy.yml`), opens any org.
Live at https://org.playnew.com.

**Model IDs**: Opus 4.8 (`claude-opus-4-8`) / Sonnet 4.6 (`claude-sonnet-4-6`),
pinned in `agent/anthropic.ts`. From the 4.6 generation on there is **no evergreen
"-latest" alias** — these are pinned snapshots, so "always latest" = bump those two
constants when a newer Opus/Sonnet ships (one place).

## Architecture (no backend)

The app is a static bundle; an org is a set of files; they meet in the browser. The
app never contains an org, an org never contains the app. Both storage sources sit
behind one `StorageAdapter` — a **local folder** (File System Access, handle in
IndexedDB) or a **GitHub repo** (REST Contents + Trees, UTF-8 base64, per-path SHA
cache, 409 retry; each save is a commit). On disk an org is plain markdown:
`contracts/`, `nodes/`, `sources/` (raw documents + chat transcripts, never
hand-edited), `org-model.json` (identity), `log.md` (audit). The map rebuilds from
the files alone; `connect.ts` remembers the source and reconnects silently.

## Run / verify

- `pnpm install`
- `pnpm dev` — open in a Chromium browser (Edge / Chrome; needs File System Access)
- `pnpm test` — unit + engine-level e2e (mocked LLM); **108 tests**
- `pnpm lint` · `pnpm build` (static bundle + PWA)

## State (code green as of 2026-06-03: tsc · lint · 108 tests · build + PWA)

Done and working:
- Welcome screen → wizard → connect (folder **or** GitHub) → 3-pane shell (Org / Chat
  / Workspace), brand from config, responsive + phone bottom-nav. Full 6-language
  i18n; UI follows the chat language.
- Chat: streaming replies, diff-card gate, vision + **document upload** — text/md
  inline, **PDF via the Anthropic Files API** (upload once, reference by `file_id`;
  the files beta is sent only on calls that use it — `usesFiles` in
  `agent/anthropic-map.ts`), and **Office (docx / xlsx / pptx)** extracted to text in
  the browser (mammoth / SheetJS / JSZip, lazy-loaded — `ui/extractOffice.ts`). Chat
  persistence (chats are sources), date→topic titles, delete chat (keeps `log.md`),
  jump-to-bottom, auto-grow composer. The agent works **one stage at a time**
  (contracts complete before nodes) and writes cited Zeno-style prose.
- Map: react-flow, constellation palette (rose / peri / violet), kind columns, colour
  legend, click-to-select.
- **Agent harness** (`agent/`): tool-use loop with a **fail-closed** confirm gate (a
  write runs only if a confirm approves it); tools `read_model` / `write_contract` /
  `write_node` / `save_source` / `append_log` + server-side **web_search + web_fetch**
  (`web_*_20260209`); **prompt caching** (one breakpoint on system+tools, one rolling
  on the conversation) and **adaptive thinking** (thinking blocks + signatures
  round-trip through the loop) in `agent/anthropic.ts`; `maxRetries: 4` backoff.
- Two model-wide actions in the Org/ pane header: **Improve** (`agent/autoresearch.ts`
  — lint→fix rounds, each write behind the diff card) and **Review**
  (`agent/review.ts` — **semantic lint**: the LLM flags incoherence the deterministic
  lint can't see; read-only, posts findings to chat).
- Settings dialog; language-change warning; custom keyboard-accessible Select
  (portalled). Settings-side source management (shared `SourceConnect`) +
  "Disconnect & reset". Constellation brand mark (favicon · welcome · topbar).
- **GitHub read+write**: `GitHubAdapter`, token encrypted, wizard connect UI. Engine
  e2e over a mocked GitHub (`agent/github-session.test.ts`).

The model matches `canon/STRUCTURE.md`: contracts (`parties` · org-gives · org-gets ·
`terms` · `signals` outbound/inbound → `health` healthy/strained/broken/unknown),
nodes (`archetype` core/supporting/platform · `keeps` · `relies-on` · `made-of` ·
`needs`). Parsers still read the old keys, so older org files keep loading. Kept
light: `parties` is a single counterpart and a `signal` is one observed value with
the trajectory in prose — full multi-party + time-series are later.

Pending follow-up (needs you):
- **Analysis capability** (`canon/ANALYSIS.md`) — designed, not built; open product
  questions (granularity, output form, cadence) await alignment.
- **Batched commits** — today each write is its own commit; a per-turn commit (Git
  Data API: blobs → tree → commit) would be tidier. Not needed to ship.
- **Live browser pass** — a real Anthropic key (and, for GitHub, a fine-grained PAT
  with Contents: Read and write). The native folder/file pickers are OS dialogs, not
  automatable; the engine is covered deterministically instead.

## Docs map

- **`canon/STRUCTURE.md`** — the open spec of the model: contracts · nodes · signals.
- **`canon/ANALYSIS.md`** — design of the next capability (commoditization → AI-native).
- **`README.md`** — the public entry.

Agent behavior is the system prompt (`src/agent/prompt.ts`); the UI surface and
storage details live in the code, not in a separate spec.

## Demo material (local)

A small sample-organization simulation lives in a local folder outside this repo —
an empty `org/` to pick and a few illustrative source documents to upload. Useful
for a walkthrough.
