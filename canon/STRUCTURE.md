# The Org Structure

A public, open specification of the **structure** every organization has — the
contracts it keeps, the nodes that keep them, and the signals that read their health
— written so the same description fits **any** org. The agent does not invent a
framework per company; it applies *this* fixed, shared description, and is the
**bridge** that contextualizes it to the organization in front of it. The
description is the constant; the organization is what varies.

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

Whether those contracts are being kept is the **observed state** of that structure —
its **signals** (§4): the things you monitor over time to read a contract's health.
The structure is what the organization *is*; the signals are how it is *doing*. Both
describe the org as-is; *interpreting* them is a separate layer (`ANALYSIS.md`).

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
- **Core / supporting / platform** (Cicero) — the three roles an internal node can
  play in keeping the contracts. See §3.

---

## 2. The Contract

A contract is a mutual, usually unspoken, exchange with **one** outside party. Its
structure reads like a short legal document — parties, two obligations, terms.

| Field | Meaning |
|---|---|
| **parties** | who is bound — the organization and the outside party, each with its role |
| **org-gives** | what the organization gives that party — the promise it makes |
| **org-gets** | what comes back that sustains the organization — the consideration |
| **terms** | what must hold, or the contract breaks |
| **sources** | the documents the contract is drawn from |

A contract's **prose** (what a human reads) is written as a short **legal document**,
not a flowing essay: a one-line **title** naming the exchange, then four `##` sections,
in this order —

1. **The parties** — the organization and the outside party, named with specifics and their roles.
2. **What the org gives** — the promise it makes that party.
3. **What the org gets back** — the consideration that sustains the org.
4. **The terms** — the conditions that hold it together, and what breaks it.

Each section is a few tight sentences, with the specifics and figures cited inline.
A lawyer should recognise the shape: a heading, the parties, the obligations, the
terms — not three rolling paragraphs.

Whether the contract is being *kept* is **not** part of its text — a legal document
does not state how you know it is working. That is read from outside, through the
contract's **signals** (§4).

---

## 3. The Node

A node is an internal part the contracts rest on — people, money, a tool, a brand,
a relationship, a method. Nodes are grouped into a handful (≈10–12), not every task.

| Field | Meaning |
|---|---|
| **name** | what it is |
| **archetype** | its role — **core**, **supporting**, or **platform** (below) |
| **keeps** | the contracts it helps the organization keep |
| **relies on** | the other nodes it leans on — the chain of promises |
| **made of** | what it is composed of, key people included |
| **needs** | what it takes to keep standing right now — resources, conditions, single points of failure |
| **sources** | the documents the node is drawn from |

**The three archetypes** (Cicero):

- **core** — delivers a contract directly to the outside world.
- **supporting** — serves the core; not customer-facing, but the core can't deliver
  without it (enabling capabilities — the word is Cicero's, formerly "service").
- **platform** — keeps the whole organization standing (the shared rails: legal,
  finance, HR). Overhead in the honest sense — necessary, not differentiating.

`keeps` points at **contracts**; `relies on` points at **other nodes** — never mix
the two. And `relies on` is the *promise chain*, not a reporting line: this language
has **no hierarchy** (who-reports-to-whom is superstructure, §1), only dependencies.
`needs` is what the node consumes to function and where it is fragile — never another
node (that is `relies on`).

A node's **prose** (what a human reads) is a short profile of the part — the promise
it makes to the rest — in this order:

1. **What it is** — the part, concretely, with its key people.
2. **The archetype** — core / supporting / platform, and where it sits in the chain
   of promises.
3. **What it keeps** — the contracts it helps the organization hold.
4. **What it relies on** — the other parts it leans on.
5. **What it needs to stand** — the resources and conditions it takes right now, and
   where it is fragile.

Every claim is cited to its sources, inline, exactly as in a contract (§2).

---

## 4. Signals

A signal is a thing you **monitor over time** to read whether a contract is being
kept. It is a *reading*, not a clause: it sits **over** a contract, never **inside**
it.

This comes straight from Promise Theory: a promise is only real when it is kept, and
whether it is kept is an *assessment* made from observation. A signal is that
observation — and so it is **observed, never a target**. "Renewed three years
running" is a signal; "reach 95% retention" is a goal, and goals are should-be, which
the structure refuses (§5).

Each contract carries up to two signals, by **direction**:

| Signal | Reads | On |
|---|---|---|
| **outbound** | is the organization delivering its promise? | org-gives |
| **inbound** | is the return actually flowing back? | org-gets |

Some signals are economic (funds raised, days-to-payment, contract value); others are
not (uptime, trust, renewals). Both are signals — the economic ones are simply the
most common.

Each signal is followed **over time**: the trajectory, not a single snapshot, is
where health shows before it breaks. Readings are append-only — you add a new dated
observation, you do not rewrite the history.

**Health** — `healthy / strained / broken / unknown` — is **read off** the signals
and the terms, never asserted on its own. No signals, no evidence: health is
`unknown`, never assumed healthy.

---

## 5. Discipline

- **As-is only.** The structure records what is observably true, cited to sources.
  To-be lives in separate interpretations, never in the structure.
- **Cite everything.** Every contract and node points back to the documents it came
  from; specific figures are cited inline in the prose.
- **Documents first.** People flatter themselves; documents don't. Ask only where
  the documents are silent.
- **One description, contextualized.** The agent never changes it to fit the org. It
  changes the *prose* — the words, the examples, the detail — to fit the org, while
  the shape (contracts, nodes, signals, the contract and node prose, the three
  archetypes) stays fixed.

---

## 6. The agent as bridge

The agent's whole job is to be the bridge between two things:

```
  the organization's own context            this language
  (documents, words, numbers)   ──agent──▶  (contracts · nodes · signals)
```

It reads the organization in its own terms and re-expresses it in this shared
description, keeping every claim cited. It applies §1–§5 exactly; it does not improvise an
ontology. That is what makes one org's map comparable to another's, and what lets
the analytical layers run on top.
