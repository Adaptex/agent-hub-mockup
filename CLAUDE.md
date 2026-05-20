# Agent Hub Mockup — Project Context

> **For Claude**: Read this file at the start of every session. Update it at the end of every session
> with new decisions, bugs fixed, and remaining work. Keep it concise — this is a reference, not a log.

---

## What This Project Is

A gamified AI-agent management UI mockup. Agents are visualised as 3D objects that grow as they
absorb knowledge ("learnings"). Multiple design themes share the same data layer.

**USP**: visual growth tied to agent training — no existing platform combines this with knowledge
feeding + reliability scoring + multiple visual themes.

**Server**: `npx http-server . -p 5500 --cors -c-1` → `http://localhost:5500`
Port 5500 is intentional — Daily Companion runs on 3000.

---

## Completed Designs (5 total)

| File | Theme | Status |
|---|---|---|
| `constellation-forge.html` | Dark space — agents as orbiting constellations | ✅ Complete |
| `tidal-archive.html` | Deep ocean — agents as bioluminescent organisms | ✅ Complete |
| `foundry-glass.html` | Industrial glass forge | ✅ Complete |
| `vivarium.html` | Dark forest terrarium — agents as baby creatures that evolve | ✅ Complete, bugs fixed |
| `grove.html` | Warm botanical garden — agents as potted plants that bloom | ✅ Complete, bugs fixed |

All 5 designs share the same data layer (`state-manager.js`, `agents.json`) and navigation links.

---

## Shared Infrastructure

| File | Purpose |
|---|---|
| `state-manager.js` | StateManager class — pub/sub events, localStorage persistence, agent CRUD |
| `agents.json` | Seed agents (loaded by StateManager on first run) |
| `ui-modals.js` | Feed-skill modal + create-agent modal (requires `window._agentHub`) |
| `three-extensions.js` | Three.js utilities (shard lifecycle, stage helpers) |
| `agentHub.mjs` | Node.js CLI — `node agentHub.mjs create|list|feed|export` |
| `.claude/launch.json` | Dev server config: http-server port 5500 |

### StateManager API (CRITICAL — must instantiate correctly)

```js
// CORRECT: window.StateManager is the CLASS, not an instance
const hub = window.StateManager ? new window.StateManager(SEED_AGENTS) : null;

hub.on('agentAdded', cb);
hub.on('learningAdded', cb);    // fires with { agentId, learning, promoted, newStage }
hub.getAgents();                // returns array
hub.addLearning(agentId, { part, quote, context });
hub.addAgent({ id, name, color, bio, specialization });
```

**Bug history**: Both vivarium and grove originally did `const hub = window.StateManager` (class
reference, not instance). `.on()` is a prototype method — calling it on the class throws
`TypeError: hub.on is not a function`. Fixed by adding `new`.

### hexColor() — Numeric Input Guard

`state-manager.js` `addAgent()` converts string hex colors to integers internally. Any design that
calls `hexColor()` must handle numeric input:

```js
function hexColor(hex) {
  if (typeof hex === 'number') return new THREE.Color(hex);
  const n = parseInt(String(hex).replace('#',''), 16);
  return new THREE.Color(isNaN(n) ? 0x5c8a3c : n);
}
```

### ui-modals.js Dependency

The feed-skill and create-agent modals look for `window._agentHub`:
```js
// ui-modals.js line ~265
const hub = window._agentHub;
```
Each design page must set this: `window._agentHub = hub;` after instantiation.
**Known gap**: vivarium.html and grove.html may not set this — the feed/create buttons in the
drawer will silently fail if `window._agentHub` is not set. Verify before claiming modals work.

---

## Agent Data Model

```js
{
  id: 'designer',
  name: 'Designer',
  color: '#c8b4ff',          // string on creation; state-manager converts to integer internally
  status: 'working',         // 'working' | 'idle' | 'sleeping'
  stage: 1,                  // 0–3, derived from XP
  xp: 45,
  learnings: [{ id, part, quote, timestamp, context }],
  specialization: ['design', 'typography'],
  reliability: 0.82,         // 0–1
  bio: '...'
}
```

**XP thresholds** (vivarium/grove): Egg/Seed=0, Baby/Sprout=10, Juvenile/Growing=40, Matured/Bloom=100
**XP thresholds** (constellation-forge): Seed=0, Sprout=25, Bloom=75, Fruit=150

---

## Seed Agents (4 agents in agents.json)

| id | name | color | specialization |
|---|---|---|---|
| designer | Designer | #c8b4ff (violet) | design, typography |
| creative-director | Creative Director | #ffb347 (ember/orange) | writing, brand |
| frontend | Frontend | #7fdecc (mint/teal) | coding, ui |
| qa | QA | #ff8080 (coral) | testing, quality |

---

## Vivarium — Creature Design

**Stack**: Three.js 0.169.0 (importmap ESM), GSAP 3.12.2 CDN, GLSL vertex displacement
**Palette**: Background `#080f08`, accent `#7eff9a`, fonts: EB Garamond + Lora + JetBrains Mono

**Creature types** (deterministic: `hashStr(id, 3) % 4`):
- 0 = Roundling (sphere body, luminous mane at stage 3)
- 1 = Winglet (tapered + wings)
- 2 = Coiler (segmented tail)
- 3 = Stump (blocky, crystal plates)

**Creature names** per type (variant: `hashStr(id, 7) % 4`):
```
Roundling: Flumble, Wicklow, Soffin, Lumble
Winglet:   Aevon, Vispra, Fliver, Caelum
Coiler:    Seelwix, Zophrin, Curlix, Spirael
Stump:     Grocket, Brackum, Thornwick, Cragget
```

**Stage evolution events**: creature hops 2×, eyes flash white, starburst particles, EVOLVED overlay
**Environment**: FogExp2, firefly Points, ground plane with GLSL noise grass, background tree silhouettes
**Camera**: `(0, 4.5, 11)` looking at `(0, 0.5, 0)`, horizontal drag pan ±8 units, scroll zoom 7–16

---

## Grove — Plant Design

**Stack**: Three.js 0.169.0 (importmap ESM), GSAP 3.12.2 CDN, GLSL leaf + wood-grain shaders
**Palette**: Background `#f5f0e8` (warm cream), accent `#5c8a3c`, fonts: Playfair Display + Lora + JetBrains Mono

**Plant types** (deterministic: same hash as vivarium):
- 0 = Rosling (spiral petals)
- 1 = Spire (vertical spike flowers)
- 2 = Drift (trailing/hanging)
- 3 = Cup (wide open face-up)

**Plant names** per type (variant: `hashStr(id, 7) % 4`):
```
Rosling: Petalvine, Rosaleth, Bloome, Velourosa
Spire:   Elmsong, Pinnola, Spirewick, Lanceol
Drift:   Cascala, Driftmere, Veilbloom, Tendrae
Cup:     Cupella, Chalicae, Recelva, Apertum
```

**Stage names**: Dormant (0–9), Emergent (10–39), In Growth (40–99), Established (100+)
**Growth events**: new branch grows via `uReveal` uniform 0→1 (GSAP), leaves scale-pop, bloom burst
**Environment**: warm wood-grain table (GLSL 2D noise), dust motes Points, directional warm light
**Camera**: `(0, 8.5, 7)` overhead table view, OrbitControls polar `[PI/5, PI/2.5]`, azimuth `[-PI/4, PI/4]`

### Bugs Fixed in Grove

1. **Shadow mesh rotation**: Must use `sh.rotation.x = -Math.PI/2` not Object.assign — Three.js
   Euler callbacks break with the latter
2. **Wheel zoom NaN guard**: `const dist = camera.position.length(); if (dist < 0.001) return;`
   prevents `normalize()` on zero vector
3. **drawer innerHTML**: Use `createElement` + `textContent` not `innerHTML` for stage badge
4. **GSAP competing tweens**: `gsap.killTweensOf(drawer)` before each drawer animation
5. **Bloom overlay reopen**: Use `onComplete` callback not `setTimeout(2100)` hardcode

---

## Design Nav Links

All 5 designs include a navigation bar linking to all other designs. Nav class names differ by design:

| File | Nav class | Link class |
|---|---|---|
| constellation-forge.html | `.design-nav` | `.design-nav-link` |
| tidal-archive.html | `.hud-nav` | `.hud-nav-link` |
| foundry-glass.html | `.header-nav` | `.header-nav-link` |
| vivarium.html | `.design-nav` | `.design-nav-link` |
| grove.html | `.design-nav` | `.design-nav-link` |

All link to: `constellation-forge.html`, `tidal-archive.html`, `foundry-glass.html`,
`vivarium.html`, `grove.html`

---

## Fixing Smart/Curly Quotes in JS Files

If the Edit tool introduces curly quotes into JS code (common when the interface auto-converts
straight quotes), use this Node.js one-liner to fix the file:

```
"/c/Program Files/nodejs/node.exe" _fix_quotes.js
```

Where `_fix_quotes.js` (already in the project root) replaces all U+201C/U+201D with U+0022.

Also applies to any new HTML file that shows `SyntaxError: Invalid or unexpected token` — the
likely cause is curly quotes used as JS string delimiters.

---

## Cross-Design localStorage Compatibility

All 5 designs share the same localStorage key via `state-manager.js`. Agents written by one design
may be missing fields expected by another. Always use safe fallbacks:

- `constellation-forge.html` used `a.short` — agents from vivarium/grove don't have this field.
  **Fixed**: `(a.short || a.id || a.name).replace("-", " ")`
- Each design's SEED_AGENTS is only used on first load (no localStorage yet). Subsequent loads read
  whatever is in localStorage — must be defensively coded.

---

## Known Remaining Issues

1. **Duplicate creature/plant names** — 4 agents × 4 types × 4 variants = some hash collisions
   (e.g., two agents get "Cascala" or "Seelwix"). Cosmetic only — inherent to the name space size.
   Fix if needed: expand name arrays or add fallback suffix.
2. **No backend** — PLAN.md Phase A4 describes Next.js API routes + Supabase schema (not started).
   The project is purely frontend localStorage-based for now.

---

## What's Next (Backlog)

| Priority | Item |
|---|---|
| High | Deep visual redesign pass for Vivarium + Grove (art direction currently in progress) |
| High | Track B Phase B1 — Build `neural-mesh.html` (design specced, ready to implement) |
| Medium | Design B2 — second new Track B design (TBD by creative-director) |
| Low | Phase A4 — Next.js backend skeleton + Supabase schema |
| Low | Design toggle selector (localStorage-persisted, visible across all pages) |

## Neural Mesh — Design Decisions (Session 6)

Approach: **A — Upfront configurator**. First-run card-picker (4 screens) saves to localStorage,
mesh renders with chosen settings. Revisitable via settings button.

All 4 choices have real rendering differences (not cosmetic):

| Choice | Options |
|---|---|
| Layout | Radial orbit / Free-floating / Force-directed |
| Growth mechanic | Orbiting motes / Pulse & grow / New tendrils |
| Stage progression | Size + colour / Size only / Colour only |
| Palette | Synaptic violet / Technical cyan / Cyberpunk neon |

**Stack**: Three.js 0.169.0 (importmap ESM), GSAP 3.12.2 CDN
**File**: `neural-mesh.html`

---

## Tech Stack Reference

```html
<!-- Three.js ESM importmap (in every design HTML) -->
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}}</script>

<!-- GSAP CDN (in vivarium + grove) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

<!-- Google Fonts used across designs -->
<!-- EB Garamond, Lora, JetBrains Mono, Playfair Display, Nunito -->
```

**Why GSAP not Framer Motion**: Framer Motion has a hard React dependency bug (#2726) — unusable
in vanilla HTML. GSAP works perfectly via CDN.

**Why importmap not CDN script for Three.js**: ESM imports require the module system; the UMD CDN
build (`three.min.js`) conflicts with OrbitControls ESM addons.

---

## Session History Summary

| Session | Work Done |
|---|---|
| Session 1 | Project scoped, PLAN.md written, constellation-forge stateful (state-manager, ui-modals, three-extensions, agentHub.mjs) |
| Session 2 | Tidal Archive + Foundry Glass new designs built and code-reviewed |
| Session 3 | Vivarium (creature evolution) built, 6 bugs fixed by code-reviewer |
| Session 4 | Grove (plant evolution) built, 5 bugs fixed, StateManager instantiation bug found + fixed in both vivarium & grove, hexColor numeric fix, nav links added to all 5 designs, visual verification via Chrome screenshots confirmed both render |
| Session 5 | Vivarium + Grove visual redesign pass started: stronger palettes, updated stage naming/copy, improved header/drawer styling, cuter Vivarium stage-0/1 traits, richer Grove pot/flower/leaf composition and lighting |
