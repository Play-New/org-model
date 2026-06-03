# The Analysis Layer — commoditization → AI-native

**Status: design, not built.** This is the second capability the system grows once
the map exists. The first capability *builds* the structure (contracts + nodes);
this one *reads* it. Nothing here edits the structure — analysis is an
interpretation, produced on demand, frozen, kept separate.

> Recall the frame: the system is **the model** (this org's contracts + nodes) plus
> **the capabilities** that act on it. Mapping is the first capability. **Analysis is
> the second.** Both are the agent applying a fixed method to a specific org.

---

## 1. The question it answers

Once an organization is mapped, the map is the input to one reading:

> **Where is the value the org captures being commoditized — especially by AI — and
> what moves take it toward being AI-native rather than AI-assisted?**

Two sub-questions, one per axis:

1. **How strong is the commoditization pressure?** Which nodes and contracts are
   sliding from "differentiating" toward "anyone can do this now"?
2. **What is the move?** When a layer commoditizes, value migrates to an adjacent
   one. Where does it go here, and what would the org build to sit in the core of
   the new arrangement instead of the edge of the old one?

---

## 2. The two axes

**A. Evolution / commoditization (Wardley).** Every node sits somewhere on a path:
*genesis → custom-built → product → commodity*. Things drift rightward over time;
**AI is a force that drags them rightward faster** — work that was custom and
defensible last year is a prompt away this year. The analysis places each node on
this axis, with evidence, and marks how hard AI is pulling.

**B. The reshuffle (Choudary).** When a layer commoditizes, scarcity — and the
value — moves to an adjacent layer (often: from the activity to the data, the
distribution, the trust, the orchestration). The move is to **relocate to the new
scarcity** and to put AI in the *core* of how the contract is kept, not bolted onto
the side. "AI-native" means the contract would not exist in its current form
without AI doing the load-bearing work.

---

## 3. What it produces

A report (a frozen artifact, like a dated reading), never a structure edit. For
**each node and each contract**, drawn entirely from the map + its sources:

| Field | Meaning |
|---|---|
| **position** | where it sits: genesis / custom / product / commodity (cited) |
| **ai_pressure** | how exposed to being done or undercut by AI: low / medium / high (cited) |
| **verdict** | differentiating · at-risk · already-commodity |
| **migration** | where the value is moving (the adjacent layer that gains scarcity) |
| **move** | the concrete AI-native direction — what to build, what to drop, what to defend |

And an **org-level read**:

- the overall strength of the commoditization effect (how much of what the org
  captures is sliding toward commodity);
- the contracts most exposed (the promises AI can soon keep more cheaply);
- the one or two repositioning moves with the most leverage.

---

## 4. Discipline

- **Interpretation, not structure.** Frozen at creation, cited to the map and its
  sources, kept out of `org/`. The structure stays as-is and observable; this is a
  reading on top of it.
- **Honest, not flattering.** It must be willing to say "this is already a
  commodity" about something the org is proud of. The value of the reading is in the
  uncomfortable calls, made with evidence.
- **Every claim traces back.** A verdict points to the node/contract it judges and
  the source behind the judgment. No free-floating opinion.
- **The map is the floor.** Analysis is only as good as the structure under it — so
  it runs after the contracts and nodes are settled, not during mapping.

---

## 5. How it runs in the app (sketch)

- A capability the agent performs on request ("analyze the map") — same loop, same
  tools, a different method prompt that reads the model and writes a report.
- The report renders in the workspace as its own document; it is saved as an
  artifact (so it can be revisited and compared over time), never as a node.
- It composes with the map: re-running after the structure changes produces a new,
  separately-dated reading. The structure is the truth; readings accumulate beside
  it.

---

## 6. Lineage

- **Wardley mapping** — evolution axis, commoditization as the default drift.
- **Sangeet Paul Choudary, *Reshuffle*** — value migration when a layer
  commoditizes; the discipline of relocating to the new scarcity.
- Continuous with the parent template's analytical playbooks (`ai-exposure`,
  `value-map`, `reshuffle`): the same readings, brought into the app as an on-demand
  capability over the contracts-and-nodes structure.

---

## 7. Open questions (for alignment)

- **Granularity:** analyze per node, per contract, or both? (Draft assumes both, led
  by nodes since the move is usually a node-level build/drop.)
- **Output form:** a single org-level report, or one card per node plus a summary?
- **Cadence:** purely on demand, or a standing "re-read when the map changes" prompt?
- **AI-pressure evidence:** lean on the agent's web_search for "is AI eating this
  category" signals, or keep it strictly to what the org's own documents show?
