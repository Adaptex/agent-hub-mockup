# Neural Mesh — Design Specification

**Date**: 2026-05-20  
**File to build**: `neural-mesh.html`  
**Status**: Approved — ready for implementation  

---

## 1. Concept & Metaphor

**Neural Mesh** renders each AI agent as a living neural node in an organic brain. Agents are
nodes in a synaptic network — connected, breathing, and pulsing with learned knowledge. The
dominant metaphor is biological: a mind growing, forming connections, deepening memory.

This is not a digital dashboard. It is a living organism.

**Palette**: Synaptic violet — deep space background (`#060612`), violet nodes (`#7b6fff`),
lavender connections (`#a78bfa`), pale trace highlights (`#c4b5fd`), star-field environment.

**What makes it distinct from `constellation-forge.html`**: Nodes are not astronomical objects
orbiting in space — they are neurons. Connections are not visual decoration — they carry signal
pulses (small glowing particles that travel the edge length, like a nerve impulse firing). The
mesh feels biological, not mechanical.

---

## 2. First-Run Configurator

On first load (no localStorage key `neural-mesh-config`), the page shows a full-screen 4-step
card picker before rendering the scene. On subsequent loads, the scene renders immediately with
the saved config. A `⚙` button in the masthead reopens the configurator at any time.

Each of the 4 choices produces **real rendering differences** — not cosmetic tweaks.

### Step 1 — Layout

| Option | Rendering Behaviour |
|---|---|
| **Radial orbit** *(chosen)* | Agents evenly spaced on a fixed-radius circle around a central hub point. Positions are deterministic from agent index. |
| Free-floating | Agents drift slowly with per-agent velocity vectors, wrapping within bounds. |
| Force-directed | Physics sim — nodes repel each other, edges attract connected nodes, reaches equilibrium. |

### Step 2 — Growth mechanic

| Option | Rendering Behaviour |
|---|---|
| **Orbiting motes** *(chosen)* | Each learning = one tiny glowing point in an elliptical orbit around its node. More learnings = denser mote cloud. |
| Pulse & grow | On each learning, node emits a ring-pulse (expanding RingGeometry opacity fade) and scales up 5%. |
| New tendrils | Each learning sprouts a new CatmullRomCurve3 line from the node, curving into empty space and fading at the tip. |

### Step 3 — Stage progression

| Option | Rendering Behaviour |
|---|---|
| **Both size + colour** *(chosen)* | Nodes grow larger AND shift colour across stages. Stage 0: small grey `#4a4a6a`. Stage 1: medium muted violet `#7b6fff`. Stage 2: large bright violet. Stage 3: large white-hot core `#e8e0ff` with intense bloom. |
| Size only | All nodes remain grey; radius scales with stage. |
| Colour only | All nodes stay the same radius; colour shifts with stage. |

### Step 4 — Palette

| Option | Rendering Behaviour |
|---|---|
| **Synaptic violet** *(chosen)* | `#7b6fff` base, `#a78bfa` connections, `#060612` background, violet point lights. |
| Technical cyan | `#00d4ff` base, `#80eaff` connections, `#040f1a` background, cyan point lights. |
| Cyberpunk neon | `#ff2d78` base, `#ff80b0` connections, `#0a0005` background, pink/magenta point lights. |

### Configurator UX

- Full-screen overlay, `#060612` background, centred card grid
- Step indicator: `1 / 4`, `2 / 4` etc. at top
- Each step: headline question + 3 cards (preview SVG mockup + name + 1-line description)
- Selected card gains a violet glow border (`box-shadow: 0 0 0 2px #7b6fff`)
- "Continue" button advances. "Back" returns to previous step. No skip.
- On step 4 confirm: config written to `localStorage.setItem('neural-mesh-config', JSON.stringify(config))`, overlay fades out (GSAP 0.4s), scene initialises.
- Config shape: `{ layout: 'radial'|'floating'|'force', growth: 'motes'|'pulse'|'tendrils', stages: 'both'|'size'|'colour', palette: 'violet'|'cyan'|'neon' }`

---

## 3. Scene Architecture

**Stack**: Three.js 0.169.0 (ESM importmap), GSAP 3.12.2 (CDN)  
**Renderer**: `WebGLRenderer` antialias, `#060612` clear colour, full-viewport, shadow maps off.  
**Camera**: `PerspectiveCamera(60, aspect, 0.1, 1000)` at `(0, 0, 22)` looking at origin.  
**Controls**: `OrbitControls` — zoom clamped `[8, 40]`, auto-rotate off, damping 0.08.

### Environment

- Star-field: 800 Points, random sphere distribution radius 80, size 0.06, white
- AmbientLight: `#1a0a2e`, intensity 0.4
- PointLight per node: agent colour, intensity scales with stage (0.3 to 2.5), distance 12

No fog. The void of space is the background.

### Node Geometry (per agent)

```
THREE.Group (nodeGroup)
├── coreMesh       SphereGeometry(r, 20, 20) — r = 0.35 + stage * 0.22
│                  MeshStandardMaterial, colour + emissive tinted by stage
├── glowMesh       SphereGeometry(r * 1.6) transparent, emissive, low opacity (0.15-0.4 by stage)
├── moteGroup      THREE.Points — orbiting learning motes (growth=motes only)
└── labelSprite    CSS2DObject — agent name + stage label (below node)
```

### Connections (edges)

One `THREE.Line` per unique agent pair. Geometry: `CatmullRomCurve3` with mid-point lifted
`z += 0.8` for a gentle curve, 40 segments. Material: `LineBasicMaterial`, colour `#a78bfa`,
opacity 0.35, transparent.

**Signal pulses**: For each connection, a small `SphereGeometry(0.06)` travels the curve
parameter `t` from 0 to 1 over 1800ms (GSAP), then disappears. Pulses fire stochastically
with a random interval of 3–9s per connection.

### Radial Layout

```js
const R = 5.5;
agents.forEach((a, i) => {
  const angle = (i / agents.length) * Math.PI * 2;
  a.node.position.set(Math.cos(angle) * R, Math.sin(angle) * R, 0);
});
```

Central hub: `SphereGeometry(0.18)` at origin, emissive `#7b6fff`, faint glow mesh.
Connections from hub to every node always exist (thin, low opacity).

### Orbiting Motes

Each learning creates one mote particle added to the node's `moteGroup`.

```js
// per frame, per mote
const t = elapsed * mote.speed + mote.phase;
mote.position.set(
  Math.cos(t) * mote.rx,
  Math.sin(t * 0.7) * mote.ry,
  Math.sin(t * 1.3) * mote.rz
);
```

Mote radii: `rx = 0.55-0.95`, `ry = 0.35-0.65`, `rz = 0.2-0.5` (randomised on creation).
Mote colour: agent colour, emissive, point size 3px. Max 30 motes per node (oldest recycled).

---

## 4. Stage Progression

| Stage | XP | Node radius | Core colour | Glow opacity | Poetic label |
|---|---|---|---|---|---|
| **Dormant** | 0-9 | 0.35 | `#4a4a6a` grey | 0.10 | *Dormant* |
| **Awakened** | 10-39 | 0.57 | `#7b6fff` violet | 0.20 | *Awakened* |
| **Flowing** | 40-99 | 0.79 | `#a78bfa` bright violet | 0.30 | *Flowing* |
| **Radiant** | 100+ | 1.01 | `#e8e0ff` white-hot | 0.45 | *Radiant* |

XP = `agent.learnings.length * 10` (thresholds: 0 / 10 / 40 / 100 — same as vivarium/grove).

### Stage Promotion Animation

1. Node core scales 1 to 1.4 to 1.0 (GSAP spring, 700ms)
2. Glow mesh intensity spikes then settles to new stage level
3. 12 mote-like particles burst outward from node (GSAP stagger, fade out 900ms)
4. DOM overlay: poetic text fades in/scales up, visible 1200ms, then fades out
5. Node label updates to new stage

---

## 5. Copy Voice — Poetic

| Element | Copy |
|---|---|
| Wordmark | **Neural Mesh** |
| Masthead lede | *a mind taking shape* |
| Drawer — learnings section header | *memories woven* |
| Drawer — specialisation | *drawn to* |
| Drawer — reliability | *faithfulness* |
| Sleeping node tooltip | *this mind lies still, waiting to be fed* |
| Stage 0 label | *Dormant* |
| Stage 1 label | *Awakened* |
| Stage 2 label | *Flowing* |
| Stage 3 label | *Radiant* |
| Promotion overlay (0 to 1) | *[Name] stirs. A mind awakens.* |
| Promotion overlay (1 to 2) | *[Name] flows. Thoughts find their paths.* |
| Promotion overlay (2 to 3) | *[Name] radiates. The mesh is complete.* |
| Empty state (no agents) | *The mesh is silent. Add a mind to begin.* |
| Configurator headline | *Shape your mesh* |

---

## 6. Agent Detail Drawer

Right-side panel, 380px wide, slides in from right (GSAP `x: 380 to 0`, 0.35s `power2.out`).
Closes on backdrop click or Escape key.

### Drawer Sections

```
[Agent name — Playfair Display 700 italic, large]
[Stage label — Lora italic, small, muted]

--- faithfulness ---
[progress bar, violet fill, value 0-1]

--- drawn to ---
[tag pills: each specialization]

--- memories woven ---
[N memories] (count, small, muted)
[list: last 5 learnings — quote + context, Lora 400]

[Feed a memory]   [Reconfigure]    (buttons)
```

"Feed a memory" opens the existing `ui-modals.js` feed-skill modal (requires `window._agentHub`).

### Drawer Aesthetics

- Background: `#0e0e1a` (deep navy)
- Border-left: `1px solid #2a2a4a`
- Section headers: `letter-spacing: 2px`, `font-size: 10px`, `color: #4a4a7a`, uppercase, Mono
- Agent name: `font-size: 22px`, Playfair Display italic
- Stage label: `font-size: 12px`, Lora italic, `color: #7b6fff`
- Reliability bar: `height: 3px`, `background: #1a1a3a`, fill `#7b6fff`
- Tag pills: `border: 1px solid #3a3a6a`, `color: #a78bfa`, `padding: 2px 8px`, `border-radius: 20px`

---

## 7. Interaction Model

| Action | Behaviour |
|---|---|
| Click node | Camera smoothly shifts to frame node; drawer slides in |
| Click backdrop | Drawer closes, camera returns to neutral |
| Escape | Drawer closes |
| Hover node | Glow brightens slightly (GSAP 0.2s), cursor: pointer |
| Scroll | OrbitControls zoom (distance 8-40) |
| Drag | OrbitControls rotation |
| `learningAdded` event | Node hops slightly, new mote spawns, drawer updates if open |
| `agentAdded` event | New node materialises at radial position (scale 0 to 1, GSAP spring) |
| Reconfigure button | Configurator overlay reopens; on re-confirm, scene re-initialises |

---

## 8. Layout & CSS

**Z-index stack**:
- canvas: 0
- CSS2D labels: 10
- masthead: 20
- agent drawer: 30
- configurator overlay: 40
- promotion overlay: 50

**Masthead** (48px, fixed top):
- Background: `rgba(6, 6, 18, 0.85)` with `backdrop-filter: blur(8px)`
- Left: wordmark **Neural Mesh** (Playfair Display italic) + lede *a mind taking shape* (Lora italic, muted)
- Right: design-nav links + gear icon button

**Fonts** (Google Fonts):
- Playfair Display 700 italic — wordmark, agent name in drawer, promotion overlay
- Lora 400/500 italic — body text, drawer sections, stage labels
- JetBrains Mono 400 — data labels, section headers, stat values

---

## 9. StateManager Wiring

```js
const hub = window.StateManager ? new window.StateManager(SEED_AGENTS) : null;
window._agentHub = hub; // required for ui-modals.js

hub.on('agentAdded', ({ agent }) => spawnNode(agent));
hub.on('learningAdded', ({ agentId, learning, promoted, newStage }) => {
  addMote(agentId);
  if (promoted) triggerPromotion(agentId, newStage);
  if (drawerOpen && drawerAgentId === agentId) refreshDrawer(agentId);
});
```

`hexColor()` must guard for numeric input (same fix as all designs):
```js
function hexColor(hex) {
  if (typeof hex === 'number') return new THREE.Color(hex);
  const n = parseInt(String(hex).replace('#',''), 16);
  return new THREE.Color(isNaN(n) ? 0x7b6fff : n);
}
```

---

## 10. Navigation

Add `neural-mesh.html` link to the design-nav in all 5 existing files:
`constellation-forge.html`, `tidal-archive.html`, `foundry-glass.html`, `vivarium.html`, `grove.html`

---

## 11. Files Changed

| File | Change |
|---|---|
| `neural-mesh.html` | **CREATE** — full design |
| `constellation-forge.html` | Add Neural Mesh link to design-nav |
| `tidal-archive.html` | Add Neural Mesh link to design-nav |
| `foundry-glass.html` | Add Neural Mesh link to design-nav |
| `vivarium.html` | Add Neural Mesh link to design-nav |
| `grove.html` | Add Neural Mesh link to design-nav |

No changes to `state-manager.js`, `ui-modals.js`, `three-extensions.js`, `agents.json`.

---

## 12. Success Criteria

- Scene is visually alive without user interaction (signal pulses firing, motes orbiting)
- "Brain" metaphor is immediately legible — looks biological, not mechanical
- Stage promotion feels meaningful — node clearly changes in both size and colour presence
- Configurator choices produce visible rendering differences
- Shared state: learnings fed in Grove/Vivarium appear as motes in Neural Mesh
- All 6 design-nav links resolve correctly
