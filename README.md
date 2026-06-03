# Org/

**This is your organization** — the promises it keeps to the world, and the parts
inside that keep them. A local-first, browser-only app that maps any organization
into a model of **contracts** (what it gives and gets from each outside party) and
**nodes** (core / service / platform, with dependencies), guided by an agent,
documents first. No backend.

**Live:** https://org.playnew.com · open in Chrome or Edge.

## What it does

You point it at a folder (or a GitHub repo), drop in your documents, and talk to an
agent. It writes a model of your org as plain markdown files — and **every write is
a diff card you confirm**. The result is a durable, navigable picture of how the
organization actually works, that you own and can keep.

## Where your data lives (read this)

**There is no server.** Everything runs in your browser. Nothing you write is
uploaded to us — your documents and model stay on **your computer** (or **your own
GitHub repo**), and your Anthropic key (and GitHub token, if used) are **encrypted
on your device**, never shown, never stored in the org. It's bring-your-own-key:
the only network calls are the ones the agent makes to Anthropic on your behalf.

## Use it

Nothing to install — just open **https://org.playnew.com** in Chrome or
Edge. On first run a short wizard asks for languages · org name · logo · your
Anthropic key · model, then you choose a **source** — a local folder, or a **GitHub
repo** (read + write, where each save is a commit). It's bring-your-own-key and runs
entirely in your browser.

## Run locally (to develop)

You only need this to modify the code:

- `pnpm install`
- `pnpm dev` — open in a Chromium browser (Edge / Chrome; needs File System Access)

## Verify

- `pnpm test` — unit + engine-level end-to-end with a mocked LLM (97 tests)
- `pnpm lint`
- `pnpm build` — static bundle + PWA (manifest + service worker), code-split

## Deploy

Push to `main` → the GitHub Pages workflow tests, builds, and deploys. The live
site is rebuilt automatically.

## Stack

Vite + React + TypeScript, vanilla CSS with design tokens. Storage behind one
`StorageAdapter`: the File System Access API (a local folder) **or** the GitHub
REST API (a repo, read + write). LLM via the Anthropic SDK in the browser (BYOK, no
proxy; key encrypted at rest), with the web-search tool and vision. react-flow for
the map. Installable as a PWA.

## The model

The agent does not invent a framework per company. It applies **one shared, public
description** of any organization — its contracts, the nodes that keep them, and the
signals that read their health — and contextualizes it from your documents. It's
specified, open and citeable, in **[canon/STRUCTURE.md](canon/STRUCTURE.md)** (built
on Simone Cicero / Boundaryless and Promise Theory). Interpreting the map —
commoditization, value migration — is the next capability, designed in
**[canon/ANALYSIS.md](canon/ANALYSIS.md)**.

## Docs

- **[canon/STRUCTURE.md](canon/STRUCTURE.md)** — the open spec: what an organization is (contracts · nodes · signals), and the agent as the bridge to it.
- **[canon/ANALYSIS.md](canon/ANALYSIS.md)** — design of the next capability: reading commoditization → AI-native over the map. *Status: design.*
- **CLAUDE.md** — resume handoff: current state, the hard rules, open follow-ups.
