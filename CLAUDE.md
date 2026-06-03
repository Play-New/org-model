# Org/ — the app

Working memory for whoever builds this app (you, a future session, contributors).
Read this first when resuming; it is the handoff anchor.

## What this is

A **local-first, browser-only PWA** that helps anyone map their organization from
scratch, guided by an agent, **document-first**, **no backend**. The model is two
things:

- **Contracts** — what the org gives to, and gets from, each outside party.
- **Nodes** — the parts inside that keep those contracts: **core** (delivers a
  promise), **service** (serves the core), **platform** (keeps the whole thing
  standing), with dependencies. Roles / people / activities live inside nodes.

The lens, in one line: *an organization = the promises it keeps to the world + the
parts inside that keep them.* As-is only — never should-be in the structure.

The language the agent applies — what an org is, the contract and its form, the
nodes — is specified openly in **`LANGUAGE.md`** (cites Cicero / Boundaryless +
Promise Theory). The agent doesn't invent a framework per company; it applies that
fixed language and is the **bridge** that contextualizes it to the org from its
documents (the system prompt opens on this). The whole system is **two things**:
*the model* (the language applied to one org) and *the capabilities* that act on it —
mapping now, analysis next (`ANALYSIS.md`, designed not built).

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
   languages: `Org/`, `core`, `service`, `platform`, `log`. A guard test asserts
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

## Run / verify

- `pnpm install`
- `pnpm dev` — open in a Chromium browser (Edge / Chrome; needs File System Access)
- `pnpm test` — unit + engine-level e2e (mocked LLM); **97 tests**
- `pnpm lint` · `pnpm build` (static bundle + PWA)

## State as of 2026-06-02 (all green: tsc · lint · 97 tests · build + PWA)

Done and working:
- Welcome screen ("Welcome to your organization.") → wizard → connect (folder **or**
  GitHub) → 3-pane shell (Org / Chat / Workspace), brand from config, responsive +
  phone bottom-nav. Full 6-language i18n; UI follows the chat language.
- Chat: streaming replies, diff-card gate, vision + **document upload** — text/md
  inline, **PDF via the Anthropic Files API** (upload once, reference by `file_id`,
  no per-request size limit; the files beta is sent only on calls that use it —
  `usesFiles` in `agent/anthropic-map.ts`), and **Office (docx / xlsx / pptx)**
  extracted to text in the browser (mammoth / SheetJS / JSZip, lazy-loaded —
  `ui/extractOffice.ts`). Chat persistence (chats are
  sources), **date→topic titles**, **delete chat** (keeps `log.md`), jump-to-bottom,
  auto-grow composer. The agent works **one stage at a time** (contracts complete
  before nodes) and writes Zeno-style prose: frontmatter + agentic body,
  `org-gives`/`org-gets`, five legal-document `##` sections.
- Map: react-flow, constellation palette (rose / peri / violet), kind columns,
  colour legend, click-to-select.
- Settings dialog; **language-change warning** (existing content won't auto-translate);
  custom keyboard-accessible Select (portalled — no clipping, scrolls, flips).
- Brand mark = a constellation (favicon, welcome, topbar). Welcome screen.
- **GitHub read+write**: `GitHubAdapter` (Contents + Trees API, UTF-8 base64, SHA
  cache, 409 retry), token encrypted, wizard connect UI with token instructions +
  link. Engine e2e over a mocked GitHub (`agent/github-session.test.ts`).

Also done: **settings-side source management** (a shared `SourceConnect` component
drives both the wizard and settings — switch folder / repo / token, reloads onto
the new source) and a **"Disconnect & reset"** action in settings
(`forgetConnection` + `clearApiKey` + `clearGithubToken` + reload).

Pending follow-up (needs you):
- **Analysis capability** (`ANALYSIS.md`) — designed, not built; open product
  questions (granularity, output form, cadence) await alignment.
- **Live browser pass** — a real Anthropic key (and, for GitHub, a repo + a
  fine-grained PAT with Contents: Read and write). The native folder/file pickers
  are OS dialogs — not automatable; the engine is covered deterministically instead.

## Docs map

- `LANGUAGE.md` — the open spec of the language the agent applies (contracts + nodes).
- `ANALYSIS.md` — design of the next capability (commoditization → AI-native).
- `APP-SPEC.md` — the UI surface.
- `AGENT-SPEC.md` — the model + how the agent reasons.
- `ARCHITECTURE.md` — storage (local + GitHub), security, sync.
- `BUILD-LOG.md` — what was built, in order.

## Demo material (local)

A small sample-organization simulation lives in a local folder outside this repo —
an empty `org/` to pick and a few illustrative source documents to upload. Useful
for a walkthrough.
