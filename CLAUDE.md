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

## Completed Designs (7 total)

| File | Theme | Status |
|---|---|---|
| `constellation-forge.html` | Dark space — agents as orbiting constellations | ✅ Complete |
| `tidal-archive.html` | Deep ocean — agents as bioluminescent organisms, depth gradient | ✅ Complete |
| `foundry-glass.html` | Industrial glass forge | ✅ Complete |
| `vivarium.html` | Dark forest terrarium — agents as baby creatures that evolve | ✅ Complete, bugs fixed |
| `grove.html` | Warm botanical garden — agents as potted plants that bloom | ✅ Complete, bugs fixed |
| `neural-mesh.html` | Dark synaptic node-graph — agents as living neurons in a mesh | ✅ Complete, Session 6 |
| `lantern-garden-v2.html` | Night garden — agents as glowing paper lanterns (2D DOM/CSS, no Three.js) | ✅ Complete, integrated |

All 7 designs share the same data layer (`state-manager.js`, `agents.json`) and navigation links.

**`index.html` is the design hub** ("Habitat Hub") — a card-list landing page linking the flagship
habitats, with footer links to the archived 2D concepts, the live Vercel deploy, and GitHub.

### Lantern Garden v2 — the only 2D flagship

Unlike the other six, `lantern-garden-v2.html` is pure DOM/CSS (no canvas/SVG/WebGL). Lanterns are
CSS cards whose halo size grows with stage + learnings count (`glow = 36 + stage*18 + learnings*2`).
Stage names: Spark → Kindle → Steady Flame → Guiding Light. Fully wired: `new StateManager(...)`,
`window._agentHub`, `drawer-shared.js` learnings drawer, `ui-modals.js` feed/create modals.
Fonts: Spectral (italic serif) + Inter + JetBrains Mono. Accent `#f3c677` on near-black violet.

---

## 2D Concept Archive (static mockups — NOT wired to StateManager)

Eight pre-3D explorations, present since the initial commit (2026-05-18) but previously
undocumented. All use **hardcoded demo data** — no `state-manager.js`, no localStorage, no nav bar
(except where noted). Most carry "Daily Companion · Agent Hub" branding from the original concept
phase. Verified 2026-07-22: all render without console errors.

| File | Concept | Idea |
|---|---|---|
| `atelier.html` | The Atelier v0.1 | Sculptor's studio — agents as clay "maquettes" on stations, learnings as "marks" |
| `index-v2.html` | The Cultivar v0.2 | Garden plots — agents as SVG plant specimens, growth log detail view |
| `lantern-garden.html` | Lantern Garden v0.1 | Night scene — hanging paper lanterns on wooden stakes (precursor to v2 flagship) |
| `bell-jar-garden.html` | Concept 05 | Victorian collection under glass bell jars, warm paper palette |
| `creatures.html` | Familiars, Concept 06 | Fantasy familiars (kitsune/bird/owl/bug) with Lv/evolution meters |
| `the-forge.html` | Concept 07 | Blacksmith forge — agents as weapons tempered by "hammer strikes" |
| `cultivar-v3.html` | Cultivar v3, Concept 08 | Shelf of potted plants; has "Archive concept" banner linking to `grove.html` |
| `prism-desk.html` | CSS depth study | "No WebGL — pure light & angle" — CSS 3D transforms card flip study |

Keep these as reference/archive. If one is promoted (as lantern-garden was → v2), it must be
rewired to the shared data layer.

---

## Shared Infrastructure

| File | Purpose |
|---|---|
| `state-manager.js` | StateManager class — pub/sub events, localStorage persistence, agent CRUD |
| `agents.json` | Seed agents (loaded by StateManager on first run) |
| `ui-modals.js` | Feed-skill + create-agent modals — exposes `window.AgentModals` (requires `window._agentHub`) |
| `drawer-shared.js` | `window.AgentDrawerShared` — learnings list w/ edit-remove, workspace-markdown copy, toasts. Load after state-manager.js |
| `three-extensions.js` | Three.js utilities (shard lifecycle, stage helpers) |
| `agentHub.mjs` | Node.js CLI — `node agentHub.mjs create|list|feed|export` |
| `index.html` | Design hub landing page (flagship cards + archive footer links) |
| `.claude/launch.json` | Dev server config: http-server port 5500 |

### StateManager API (CRITICAL — must instantiate correctly)

localStorage key: `agent-hub-v1`. A `migrate()` runs on load, normalising old agent shapes.

```js
// CORRECT: window.StateManager is the CLASS, not an instance
const hub = window.StateManager ? new window.StateManager(SEED_AGENTS) : null;
window._agentHub = hub;         // required by ui-modals.js

// Events
hub.on('agentAdded', cb);       // { agent }
hub.on('learningAdded', cb);    // { agentId, learning, promoted, newStage }
hub.on('learningRemoved', cb);  // { agentId }
hub.on('learningUpdated', cb);  // { agentId }

// Methods
hub.getAgents();                // returns array
hub.findAgent(id);
hub.addLearning(agentId, { part, quote });
hub.removeLearning(agentId, learningId);
hub.updateLearning(agentId, learningId, { part, quote });
hub.addAgent({ id, name, color, bio, specialization });
hub.getTotalLearnings();
hub.getActiveCount();
hub.getStrength(agentLike);
```

### AgentDrawerShared API (drawer-shared.js)

```js
window.AgentDrawerShared.renderLearnings(containerEl, agentId, { hub, stageNames, onChanged });
window.AgentDrawerShared.copyForWorkspace(agent);   // copies markdown to clipboard
window.AgentDrawerShared.showToast(message);
window.AgentDrawerShared.xpProgress(agent);
window.AgentDrawerShared.stageName(agent, names);
window.AgentDrawerShared.buildWorkspaceMarkdown(agent);
```

### AgentModals API (ui-modals.js)

```js
window.AgentModals.openFeedModal(agentId);
window.AgentModals.openCreateModal();
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
**Palette**: Background `#f5f0e8` (warm cream), accent `#456b2b`, fonts: Playfair Display + Lora + JetBrains Mono

> **Grove is the suite's high-key design — the only light one.** Commit `187a943` flipped it to
> near-black `#0f0d0a` with an amber accent and the docs were never updated; restored 2026-07-31.
> If you are changing this palette you are changing the only light design in the set — see
> `docs/superpowers/specs/2026-07-31-tonal-range-design.md`.
>
> Two things that are **not** free to revert to their pre-`187a943` values:
> - **Accent is `#456b2b`, not the documented `#5c8a3c`.** The original green is used at 9–10.5px
>   as *text*, where it scores 3.33:1 and needs 4.5:1. `--accent-rgb` stays the lighter
>   `92,138,60` for tints and edges, where 3:1 suffices — the two roles genuinely differ.
> - **`--text-dim` 0.78 and `--text-mute` 0.70**, not the original 0.60/0.36. The original cream
>   palette was never WCAG AA compliant (3.96 and 2.11 respectively).
>
> **Chrome colours run through channel triplets** (`--ink-rgb`, `--surface-rgb`, `--edge-rgb`,
> `--accent-rgb`) consumed as `rgba(var(--ink-rgb), 0.72)`. Alpha stays at each use site. Change
> the triplets, not the literals.
>
> **The table is a raw `ShaderMaterial`** writing `gl_FragColor` directly — it does not respond to
> lights at all, so its wood colours are final pixel values. Re-lighting the scene will not change
> it; edit `TFRAG`.
>
> **The per-plant `PointLight` constructor intensity is inert** — `animatePlant()` overwrites
> `.intensity` every frame in all three branches. Retune those, not the constructor.

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

All 7 designs include a navigation bar linking to other designs. Nav class names differ by design:

| File | Nav class | Link class |
|---|---|---|
| constellation-forge.html | `.design-nav` | `.design-nav-link` |
| tidal-archive.html | `.hud-nav` | `.hud-nav-link` |
| foundry-glass.html | `.header-nav` | `.header-nav-link` |
| vivarium.html | `.design-nav` | `.design-nav-link` |
| grove.html | `.design-nav` | `.design-nav-link` |
| neural-mesh.html | `.design-nav` | `.design-nav-link` |
| lantern-garden-v2.html | `.design-nav` | plain `a` |

**Canonical nav order** — keep this sequence when adding a design:
`Forge · Archive · Foundry · Lantern · Vivarium · Grove · Mesh`

All 7 designs plus `index.html` link to all 7 flagships (verified 2026-07-22). The current page
carries `.active` / `aria-current="page"`. When adding an 8th design, update all 8 files.

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

## Bugs Fixed in Neural Mesh (Session 8)

Four rendering defects, all found via a visual audit — the page "worked" (no thrown errors on the
first-run path) while showing almost nothing of its own concept.

1. **TDZ crash on the returning-visitor path** — the `// Boot` block sat at ~line 740, *above*
   `const SEED_AGENTS` (~line 900). With a saved config in localStorage it called
   `initScene() → initState()`, which reads `SEED_AGENTS` before its `const` is initialised →
   `ReferenceError: Cannot access 'SEED_AGENTS' before initialization`, and no scene at all.
   First-run masked it: `showConfigurator()` defers `initScene()` until after module evaluation.
   **Fix**: moved the boot block to the very end of the module.
2. **Connections invisible** — `layoutNodes()` GSAP-tweens node positions over 0.8s, but
   `buildConnections()` runs synchronously on the next line and read `group.position` while every
   node was still at the origin. Every curve was built zero-length and never rebuilt, so the
   entire mesh collapsed into an invisible speck behind the hub.
   **Fix**: `refreshConnectionGeometry()` in the RAF loop re-derives geometry from live positions
   when a node moves (and refreshes `c.curvePoints` so signal pulses follow). Self-quiets once the
   tween settles.
3. **Nodes ignored agent colour** — the core used `STAGE_DATA[stage].color`, so every node at the
   same stage rendered identically violet and the per-agent colour was discarded.
   **Fix**: `coreColorFor(agent, stage)` — agent hue carries identity, stage reads via brightness.
4. **Stage labels never updated** — the CSS2D label was written once in `spawnNode()`, so a
   promoted node kept its original stage text, and the label was swallowed as the core grew.
   **Fix**: `applyStageVisuals()` now rewrites the label text and re-offsets `labelObj`.

**Lesson**: a GSAP tween is async — never read `.position` on the line after `gsap.to()`.

---

## Bugs Fixed in Foundry Glass (Session 8)

The page rendered as a near-black rectangle. Two independent faults, both rooted in three.js
version drift — the file loads **r169** but was authored against older API behaviour.

### Lighting rig was written for the legacy lighting model

three.js r155+ made punctual lights physically correct and **r165 removed the `useLegacyLights`
opt-out**. Intensity is now candela and illuminance falls off as `intensity / distance²`.
The key light was `SpotLight(…, 2.5, …)` positioned 10 units above the bench →
`2.5 / 10² ≈ 0.025`. Effectively zero. That alone was the black screen.

| Light | Was | Now | Unit |
|---|---|---|---|
| Key spot | 2.5 | 260 | candela (scales with distance²) |
| Hover rim point | 1.2 | 34 | candela |
| Forge flash point | 3 | 18 | candela — **also update the fade animation** |
| Backfill directional | 0.15 | 0.9 | lux — no distance falloff, so only a modest lift |

Also added `ACESFilmicToneMapping` @ 1.15 exposure — physical lights produce a wide dynamic
range, and with `NoToneMapping` the spot's hotspot clipped while midtones stayed crushed.

### No scene environment — why "Foundry Glass" showed no glass

The vessels are `MeshPhysicalMaterial` with `transmission` and low `roughness`; glass and polished
metal derive nearly all appearance from reflections. `scene.environment` was never set, so there
was nothing to reflect and they rendered black **regardless of light intensity**.

Note: `RoomEnvironment` works but is a neutral photo studio whose rectangular area lights reflect
as hard white windows — wrong for a forge and an obvious stock-asset tell. Replaced with a
hand-built equirect canvas gradient (cold ceiling → ember horizon → warm floor) via
`PMREMGenerator.fromEquirectangular`, at `environmentIntensity = 0.6`.

### Transmission was configured but never rendered

`transparent: true` diverts a mesh into the alpha-blend queue, but three.js renders transmissive
materials in a **separate pass that samples the opaque framebuffer** — so `transmission: 0.85` was
set and silently ignored, and the vessels read as glossy billiard balls. `depthWrite: false` and
`DoubleSide` compounded it (the vessels are closed solids), and `metalness: 0.15` fought
transmission, since metals do not transmit.

Stage progression previously rode on `opacity` (0.55 → 1), which is incompatible with transmission.
Re-encoded onto physical properties:

| Stage | transmission | roughness | reads as |
|---|---|---|---|
| 0 Forming | 0 (opaque) | 0.95 | raw unworked matter |
| 1 | 0.30 | 0.60 | clouded |
| 2 Crystal | 0.65 | 0.25 | clarifying, faceted |
| 3 | 0.98 | 0.02 | finished glass |

Tint comes from `attenuationColor` — diffuse `color` is largely suppressed at high transmission, so
without it agent identity is lost entirely. `attenuationDistance` needs to be **well above the mesh
radius** (2.4–4.5 for a ~0.65 sphere); short values look dense and muddy.

**Lessons**: (1) punctual light intensities do not survive a three.js major-version jump — rescale
by distance²; (2) `transparent: true` silently disables `transmission`.

---

## Constellation Forge — Cleanup Pass (Session 8)

The audit's strongest design, held back by three fixable things. Net −55 lines.

1. **Intro curtain removed.** A click-through splash (gradient text on black) gated the scene —
   the generic AI default, and a product should not ask permission before showing itself. The
   3D scene is the hero, so it now renders immediately; the entrance survives as a non-blocking
   staged rise-in of title → actions → rail, gated on `prefers-reduced-motion`.
2. **Drawer no longer clips the HUD.** Structural, not cosmetic: `.drawer` is a fixed overlay
   while `.ui-root` is `inset: 0`, so nothing reflowed and the drawer slid straight over the
   Ignite button and nav pill. `body.drawer-open` now reserves the drawer width so the HUD
   reflows. Two follow-ons — actions flush left once they wrap (no right edge to hang from, or
   each row rags differently), and below 900px the drawer becomes a full-width sheet because
   there is nowhere to reflow to and a 440px panel left a clipped strip.
3. **Chips rebuilt as a specimen rail.** Each chip carries its star's colour as a luminous dot,
   active state tinted in the same hue — the chip↔star tie is the information the rail should
   carry. Fixes a real bug: the glow was four hardcoded `[data-agent="…"]` rules, so **any
   user-created agent had no colour identity**. Now driven by a `--agent-color` custom property
   set from the agent record. Type lifted off an unreadable 8px.

### CSS ordering trap (hit during this pass)

The mobile drawer rule was first placed *above* the base `.drawer` declaration and silently did
nothing — same specificity, so the later `width: min(440px, 100vw)` won. **Media-query overrides
must sit after the rule they override.** Caught only by screenshotting; the edit itself looked
correct. This file's CSS is long and single-block, so co-locate overrides with their base rule.

---

## Tidal Archive — Depth Model

`--depth-photic` / `-twilight` / `-midnight` / `-hadal` are the **single source of truth** for
three things at once: `#depth-rail`, the 3D scene backdrop, and the fog. Change the tokens, not the
scene — they were allowed to drift apart once already, with the rail claiming four labelled zones
while `scene.background` rendered flat hadal black everywhere.

Two non-obvious constraints:

- **`scene.background` is a texture, so it renders in SCREEN space** and does not move with the
  camera. Depth response comes from `scene.backgroundIntensity`, lerped in the RAF loop. Without
  it the sunlit band stays pinned to the top of the viewport even at hadal depth.
- **The camera's real Y range is +280 → −460**, set by the wheel handler's clamp. Any depth
  interpolation must use those bounds or the lerp saturates before the camera reaches either end.

The four rail labels **cannot share one colour** — photic is a bright band needing dark ink while
the deep bands need light. They are set per-band via `.rail-tick:nth-child(n)`.

---

## Known Remaining Issues

1. **Duplicate creature/plant names** — 4 agents × 4 types × 4 variants = some hash collisions
   (e.g., two agents get "Cascala" or "Seelwix"). Cosmetic only — inherent to the name space size.
   Fix if needed: expand name arrays or add fallback suffix.
2. **No backend** — PLAN.md Phase A4 describes Next.js API routes + Supabase schema (not started).
   The project is purely frontend localStorage-based for now.
3. **Seed-agent divergence** — `lantern-garden-v2.html` defines its own SEED_AGENTS inline
   (ids `creative`/`frontend`, colors `#ff9a4a`/`#62ffc4`) that differ from `agents.json`
   (`creative-director`/`frontend`, `#ffb347`/`#7fdecc`). Harmless in practice (localStorage from
   whichever design loaded first wins), but the seeds should be unified.

---

## What's Next (Backlog)

| Priority | Item |
|---|---|
| High | Deep visual redesign pass for Vivarium + Grove (art direction currently in progress) |
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
| Session 6 | Neural Mesh built: 4-step configurator (localStorage), Three.js radial node graph, CSS2DRenderer labels, CatmullRom connections, stochastic signal pulses, orbiting motes/pulse-ring/tendril growth mechanics, raycasting interaction, GSAP drawer, stage promotion animation + DOM overlay. Feel brief locked: "curiosity + calm, like constellation-forge but synaptic". Design Direction Gate added to global CLAUDE.md. |
| Session 8 (2026-07-29) | Visual audit of all 15 designs from screenshots, graded against a production bar. Fixed 4 Neural Mesh rendering defects (TDZ boot crash, collapsed connection geometry, nodes ignoring agent colour, stale stage labels) — see the Neural Mesh bug section. Audit verdict: Constellation Forge is the strongest. Then rebuilt Foundry Glass: rescaled the whole light rig to physical units, added a hand-built forge environment map + ACES tone mapping, and repaired the glass material so `transmission` actually renders — see the Foundry Glass bug section. Finally cleaned up Constellation Forge: removed the intro gate, made the HUD reflow around the drawer, and rebuilt the agent chips as a colour-carrying specimen rail. |
| Session 7 (2026-07-22) | Review + documentation pass: catalogued the 8 previously undocumented 2D concept archives (all from initial commit), documented Lantern Garden v2 as 7th flagship, documented `drawer-shared.js` / `index.html` hub / expanded StateManager + AgentModals APIs, verified all 9 undocumented pages render error-free, logged seed-agent divergence as a known issue. Fixed the three nav gaps: added Lantern to Neural Mesh's nav, Mesh to Lantern v2's nav, and a Neural Mesh card to the `index.html` hub — all 8 pages now link all 7 flagships in canonical order. |
