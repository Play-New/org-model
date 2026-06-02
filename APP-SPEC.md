# App spec — the Org/ builder

A local-first, browser-only app. The user opens it, points it at a source (a local
folder or a GitHub repo), and an agent maps their org into **contracts + nodes**
(the model is in AGENT-SPEC.md), guided, documents first. No backend, no install —
a hosted page opened in a Chromium browser (Edge / Chrome), installable as a PWA.

## Welcome

A single intro screen: the `Org/` mark, *"This is your organization."*, and a plain
note that there is no server — everything stays on the user's device or their repo.
Then **Get started** → the wizard.

## First run — the wizard

Blocks until done, editable later in settings:

1. **Languages** — the language you talk to the agent in, and the language the model
   is written in (they can differ).
2. **Identity** — org name (becomes the title / tab) and an optional square logo
   (becomes the header mark and favicon).
3. **Model + key** — Opus (stronger) or Sonnet (faster); your Anthropic key,
   encrypted on your device, never shown, never uploaded.
4. **Source** — a **local folder** (File System Access) or a **GitHub repo** (repo,
   branch, fine-grained token; the screen explains where to get the token). With
   GitHub, read + write — each save is a commit.

## The screen — three panes

- **Left — `Org/`.** The structure as a file tree: contracts, and the nodes grouped
  core / service / platform, each with a fill-state dot. Click an item to open it.
- **Center — the chat.** The agent leads: it opens by itself, asks for documents,
  reads them, asks the gap questions, proposes what to write. Drop a file in (image
  → vision; text/markdown → read as a document), or attach. Replies stream. Chats
  persist (they're saved as sources) and can be renamed or deleted.
- **Right — the workspace.** The map by default (react-flow: contracts and the nodes
  that keep them, with dependencies; a core/service/platform legend), or the file
  viewer for the selected item. On a phone, a bottom nav switches between the three.

## Writing — only the agent, always confirmed

No field in the UI edits the model directly. Every change the agent proposes shows
as a **diff card** — apply / reject. Same for saving a document as a source and for
the one log line each write appends. Nothing reaches the folder/repo without an ok.

## On disk / in the repo

Plain markdown: `contracts/`, `nodes/`, `sources/` (raw documents + chat
transcripts, never hand-edited), `org-model.json` (the org's identity), and a
`log.md` audit. The map is re-buildable from the files alone.

## Tech

- Vite + React + TypeScript. Vanilla CSS with brand tokens (set from the wizard),
  no CSS framework. Custom controls (no native select / radio / file input).
- **Storage**: one `StorageAdapter` over the File System Access API (local folder,
  handle in IndexedDB) or the GitHub REST API (repo; `{owner, repo, branch}` in
  IndexedDB, token encrypted). Chromium only for local.
- **LLM**: Anthropic SDK in the browser (direct, no proxy), streaming, a tool-use
  loop, the web-search tool, vision. The agent's brief is built from AGENT-SPEC.md.
- **Tools the agent calls**: read the model, write a contract, write a node, save a
  source, append the log — run in the browser against the source.
- **Ship**: static build on GitHub Pages, installable as a PWA.

## Not yet

- Settings-side management of the GitHub source (change repo / token).
- A "disconnect & reset" action.
- Live data feeding the contract measures (the later auto-update).
