# Agent Hub: Build Plan

## Context

Building a gamified AI agent management platform where agents visually evolve as they learn and grow. USP: **visual growth tied to agent training** — no current platform combines this with knowledge feeding + reliability scoring.

Two tracks running in parallel:
- **Track A**: Enhance constellation-forge (the proven 3D wow-factor base) with state, knowledge feeding, and agent management
- **Track B**: Generate entirely new design themes from scratch using UI UX Pro Max + 21st.dev + Framer — not converting existing HTML files, but fresh concepts

**Build workflow**: During Track B, invoke specialized agents:
- `frontend-designer` — layout, visual polish, Tailwind/motion decisions
- `code-reviewer` — before declaring any feature done
- `creative-director` — naming, copy, metaphor, character voice for new designs

**Model**: Claude Sonnet 4.6 (confirmed by user)

---

## User-Confirmed Requirements

| Question | Answer |
|---|---|
| MVP scope | Enhance constellation-forge AND build fresh designs (both) |
| Backend | Hybrid: agents run Claude natively + UI for managing external agents |
| Knowledge feeding | Visual absorption (agent grows) + tracked in composition drawer |
| Agent creation | Both: UI form (quick) + CLI/code-first (advanced) |
| Design strategy | Multiple designs; user can toggle/choose |
| Tools | UI UX Pro Max + 21st.dev + Framer for new designs |

---

## Track A: Enhance Constellation Forge

### Phase A1: State + Data (Week 1)

**New files:**
- `state-manager.js` — StateManager class, pub/sub events, localStorage sync
- `agents.json` — persistent agent store (CLI + browser shared)

**Extended agent data model:**
```js
{
  id, name, color, status, stage,        // existing
  xp: 45,                                 // new: numeric XP
  learnings: [                            // was learningsList
    { id, part, quote, timestamp, context }
  ],
  specialization: ["design", "typography"], // new
  reliability: 0.82,                      // new: success rate
  executionHistory: [{ timestamp, success, output }]
}
```

**Stage thresholds:** Seed (0 XP) → Sprout (25 XP) → Bloom (75 XP) → Fruit (150 XP)

### Phase A2: Knowledge Feeding UX (Week 2)

**Trigger:** "Feed skill" button in agent drawer footer
**Flow:** Modal form → skill category + quote → submit → visual feedback

**Three.js visual feedback on skill add:**
- Agent mesh scales: `1.0 → 1.15` (easing, 0.6s)
- New shard added (1 per learning, max 7; currently 3)
- Emissive intensity increases: `0.38 + (stage - 1) * 0.25`
- Pulse flash at agent position (reuse existing `#pulse-flash`)

**New files:**
- `ui-modals.js` — knowledge feeding modal + agent creation modal
- `three-extensions.js` — shard lifecycle, stage progression animations

### Phase A3: Agent Creation (Week 2)

**UI form** (modal): name, color picker, bio, specialization tags → mesh appears in constellation
**CLI tool**: `node agentHub.mjs create|list|feed|export`

**New file:** `agentHub.mjs` — Node.js ES module CLI, reads/writes `agents.json`

**Modified file:** `constellation-forge.html`
- Remove hardcoded AGENTS array → load from state manager
- Add "New agent" button in masthead
- Add "Feed skill" button in drawer
- Import state-manager.js, ui-modals.js, three-extensions.js

### Phase A4: Backend Skeleton (Week 3, parallel)

Next.js API routes (for Phase B later):
```
/api/agents/route.ts         — CRUD
/api/agents/[id]/learnings   — skill management
/api/agents/[id]/execute     — agent execution (Claude API)
/api/agents/[id]/reliability — score tracking
```

Supabase schema: `agents`, `learnings`, `execution_history`, `reliability_scores` tables

---

## Track B: New Designs from Scratch

### Toolchain
- **UI UX Pro Max** — design tokens, component library (install via skill)
- **21st.dev** — React components (navigation, cards, charts, modals)
- **Framer** — motion, transitions, spring animations

### Process for each new design
1. `creative-director` agent: Name the design theme, define metaphor + voice
2. `frontend-designer` agent: Design layout, color system, 3D/animation approach
3. Build the design (Sonnet handles implementation)
4. `code-reviewer` agent: Review before declaring done
5. Add to design selector in the hub

### Target: 2 New Designs

**Design B1: "Neural Mesh"** (concept to be refined by creative-director)
- Dark background, interconnected node graph (not orbits)
- Framer spring animations for node connections
- 21st.dev cards for agent detail panels
- UI UX Pro Max typography + spacing tokens

**Design B2: TBD by creative-director**
- Fresh metaphor (not space, not garden, not creatures)
- Production-grade 3D if feasible

### Design Toggle

All designs (constellation-forge + new ones) accessible via a selector:
```
[Constellation Forge] [Neural Mesh] [???]
```
Stored in localStorage; persists across sessions.

---

## Implementation Order

1. **Track A Phase A1** — state manager + data model (unblocks all Track A work)
2. **Track A Phase A2** — knowledge feeding UX (core feature, most visual impact)
3. **Track A Phase A3** — agent creation (completes Track A MVP)
4. **Track B B1** — Neural Mesh design (creative-director → frontend-designer → build → review)
5. **Track B B2** — Second new design (repeat process)
6. **Design toggle** — connect all designs in a selector
7. **Track A Phase A4** — backend skeleton (prep for real agent execution)

---

## Critical Files

| File | Status | Purpose |
|---|---|---|
| `constellation-forge.html` | Modify | Add state binding, modals, buttons |
| `state-manager.js` | Create | Core state, pub/sub, localStorage |
| `ui-modals.js` | Create | Knowledge feed + agent creation modals |
| `three-extensions.js` | Create | Shard management, stage progression |
| `agentHub.mjs` | Create | CLI tool |
| `agents.json` | Create | Persistent agent store |
| `neural-mesh.html` | Create | Track B Design B1 |
| `design-b2.html` | Create | Track B Design B2 (name TBD) |

---

## Verification

**Track A:**
1. Add agent via form → mesh appears in constellation, persists on reload
2. Feed skill → agent grows, shard added, learning in drawer, stage progresses if XP threshold crossed
3. CLI: `node agentHub.mjs create` → agent appears in browser
4. Existing interactions unchanged (drag, keyboard nav, reduced-motion)

**Track B:**
1. New design loads without Three.js errors
2. All agent data flows correctly (same data model as Track A)
3. `code-reviewer` passes before declaring done

**Design toggle:**
1. Switching design persists on reload
2. All designs show same agent data

---

## Success Criteria

- Constellation-forge is stateful (agents persist, grow visually)
- Knowledge feeding has clear visual metaphor (agent absorbs, grows)
- 2+ fresh designs built with UI UX Pro Max + 21st.dev + Framer
- User can switch between all designs from a selector
- All designs are production-grade (animations, accessibility, responsive)
- Specialized agents (frontend-designer, code-reviewer, creative-director) invoked at right moments
