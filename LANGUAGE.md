# The Org Language

A public, open specification of the language this system uses to describe **any**
organization. The agent does not invent a framework per company; it applies *this*
language, fixed and shared, and contextualizes it to the organization in front of
it. The language is the constant; the organization is what varies.

> The system is two things: **the model** — this language applied to one org — and
> **the capabilities** that contextualize it — the agent and its tools, which bridge
> the organization's own documents to this language. This file defines the first.

This specification is open source (MIT). Anyone can read it, cite it, or build on
it.

---

## 1. What an organization is

> **An organization is the set of contracts it keeps with the world — what it gives
> to, and gets from, each outside party — together with the internal nodes that keep
> those contracts.**

Two things, and only two, at the structural layer:

- **Contracts** — the exchanges the organization holds with the outside world.
- **Nodes** — the internal parts the contracts rest on.

Everything else (the org chart, the titles, the rituals) is *superstructure* — it
can change without changing what the organization actually is. The contracts and
the nodes are the *structure*: the thing that survives turnover, and the thing AI
makes more, not less, necessary to make explicit.

### Lineage

This language stands on existing work, named openly:

- **Simone Cicero / Boundaryless** — the distinction between an organization's
  *structure* (its topology, its promise chains, its shared context) and its
  *superstructure* (hierarchy, bureaucracy). AI dissolves the superstructure and
  raises the value of an explicit structure. See *Through the Boundary*, "What is an
  organization today?" (boundaryless.io / through-the-boundary.simonecicero.com).
- **Promise Theory (Mark Burgess)** — an organization is best read as a web of
  *promises* made between autonomous parts. A promise is voluntary, and it is only
  real when it is kept. We make the promise two-sided (a contract) because an
  exchange is what sustains the org.
- **Core / service / platform** (Cicero) — the three roles an internal node can
  play in keeping the contracts. See §3.

The analytical layers that *read* this structure (commoditization, value migration,
the move to AI-native) build on Wardley mapping and on Sangeet Paul Choudary's
*Reshuffle*. They are interpretations on top of the structure, never part of it.

---

## 2. The Contract

A contract is a mutual, usually unspoken, exchange with **one** outside party.
Read it like a short legal document — it has parties, two obligations, and terms.

| Field | Meaning |
|---|---|
| **with** | the outside party (kept short — just the party) |
| **org-gives** | what the organization gives that party (the promise it makes) |
| **org-gets** | what comes back to the organization that sustains it |
| **constraints** | the terms: what must hold, or the contract breaks |
| **measures** | how you know value flows, on each leg — observed, never targets |
| **sources** | the documents the contract is drawn from |

A contract's **prose** (what a human reads) is written as a short legal-document
narrative, in this order:

1. **The parties** — who the outside party is, with specifics.
2. **What the org gives** — the promise.
3. **What the org gets back** — what sustains the org.
4. **The terms** — the rules/conditions that hold it together.
5. **How we know** — the measures, with the actual figures.

Health (healthy / strained / broken) is **read off** the measures and constraints,
never asserted on its own.

---

## 3. The Node

A node is an internal part the contracts rest on — people, money, a tool, a brand,
a relationship, a method. Nodes are grouped into a handful (≈10–12), not every task.

| Field | Meaning |
|---|---|
| **name** | what it is |
| **orientation** | its role — **core**, **service**, or **platform** (below) |
| **supports** | the contract ids it helps keep |
| **dependsOn** | the other node ids it relies on |
| **composition** | what it is made of, key people included |
| **needsToday** | what it takes to stand right now |

**The three orientations** (Cicero):

- **core** — delivers a contract directly to the outside world.
- **service** — serves the core; not customer-facing, but the core can't deliver
  without it.
- **platform** — keeps the whole organization standing (legal, finance, HR, the
  shared rails). Overhead in the honest sense — necessary, not differentiating.

---

## 4. Discipline

- **As-is only.** The structure records what is observably true, cited to sources.
  To-be lives in separate interpretations, never in the structure.
- **Cite everything.** Every contract and node points back to the documents it came
  from; specific figures are cited inline in the prose.
- **Documents first.** People flatter themselves; documents don't. Ask only where
  the documents are silent.
- **One language, contextualized.** The agent never changes the language to fit the
  org. It changes the *prose* — the words, the examples, the detail — to fit the
  org, while the shape (contracts, nodes, the five sections, the three orientations)
  stays fixed.

---

## 5. The agent as bridge

The agent's whole job is to be the bridge between two things:

```
  the organization's own context            this language
  (documents, words, numbers)   ──agent──▶  (contracts · nodes)
```

It reads the organization in its own terms and re-expresses it in this language,
keeping every claim cited. It applies §1–§4 exactly; it does not improvise an
ontology. That is what makes one org's map comparable to another's, and what lets
the analytical layers run on top.
