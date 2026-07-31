# Tonal Range Across the Design Suite

**Date**: 2026-07-31
**Status**: Approved, not yet implemented
**Scope**: `grove.html`, `tidal-archive.html`, `vivarium.html`

---

## Problem

All seven flagship designs sit in a near-black band. Measured backgrounds:

| Design | Background |
|---|---|
| constellation-forge | `#030508` |
| tidal-archive | `#020509` |
| vivarium | `#03060a` |
| neural-mesh | `#060612` |
| lantern-garden-v2 | `#07050c` |
| grove | `#0f0d0a` |
| foundry-glass | `#111010` |

The full span is roughly 2%–7% lightness. A suite of seven "distinct art directions" that all share one value key reads as one mood in seven costumes, and it is the single largest reason the set feels templated rather than authored.

### This is a regression, not an absence

Grove was warm cream `#f5f0e8` from the initial commit (`164ebae`) through `187a943^`. Commit `187a943` — *"visual redesign pass for Vivarium and Grove designs"* — flipped it to `#0f0d0a` along with the accent, from botanical green `#5c8a3c` to amber `#f2b544`.

`CLAUDE.md` still documents Grove as **"Background `#f5f0e8` (warm cream), accent `#5c8a3c`"**. Docs and code have disagreed since that commit and nobody noticed.

So the suite *had* exactly one light design and silently lost it. Restoring it is recovering documented intent, not inventing a direction.

---

## Design

### The value ladder

Replace a single cluster (all seven near-black) with a spanned range:

| Design | Key | Background | Approx. lightness | Basis |
|---|---|---|---|---|
| **Grove** | High-key daylight | `#f5f0e8` cream | ~94% | restore documented intent |
| **Vivarium** | Mid-key dawn | `#a2b0a6` sage mist | ~68% | terrarium is a lit object |
| **Tidal Archive** | Spans internally | `#4f9ab8` → `#020508` | ~60% → 2% | activate its own tokens |
| Other four | Low-key | unchanged | 2–7% | concept-locked |

Hex values for Vivarium and Tidal are **starting points to be confirmed visually**, not fixed
requirements — the ladder positions (high / mid / spanning) are what matter and must hold.

**Concept-locked** means the concept requires darkness and a tonal shift would contradict it: Constellation Forge is deep space, Lantern Garden is explicitly a *night* habitat, Neural Mesh is a synaptic void, and Foundry Glass is a forge — kept dark precisely so glowing metal reads. These stay as they are.

### Token architecture (applies to all three)

Each file carries 38–56 hardcoded `rgba()`/hex values in CSS, all authored dark-first. Flipping tone by hunting individual sites is how contrast bugs ship.

Before any tonal change, route each design's chrome through a semantic set:

```
--surface      panel / drawer / masthead fills
--surface-lift raised surfaces
--ink          primary text
--ink-dim      secondary text
--ink-mute     tertiary text / captions
--rule         borders and dividers
```

The tonal decision then lives in one block per design. This is a prerequisite, not a nice-to-have — it is what makes the flip reviewable.

---

## Design 1 — Grove: restore daylight

**Restore only the tonal layer.** Commit `187a943` also introduced composition and typography gains — larger wordmark, bordered nav buttons, pill-shaped stat badges, richer pot/flower/leaf planting. Those stay. **Do not revert the commit.**

Exact restore targets, taken verbatim from `187a943^`:

```css
--bg:          #f5f0e8;
--surface:     #ede8dc;
--surface-lift:#e4ddd0;
--accent:      #5c8a3c;   /* botanical green — amber #f2b544 has poor contrast on cream */
--accent-dim:  rgba(92,138,60,0.22);
--accent-glow: rgba(92,138,60,0.08);
--text:        #2c2423;
--text-dim:    rgba(44,36,35,0.60);
--text-mute:   rgba(44,36,35,0.36);
--border:      rgba(92,138,60,0.12);
--border-mid:  rgba(92,138,60,0.28);
```

`--rose` `#c84040` and `--sun` `#e3a030` are unchanged between versions.

**Scene work** (not covered by token restore):
- `scene.background` `0x0f0d0a` → `0xf5f0e8`, and fog to match — currently tuned to disappear into black.
- `HemisphereLight(0x2d241a, 0x0a0806, 0.22)` is a night rig. Daylight needs a bright sky colour, warmer ground bounce, and materially higher intensity.
- `DirectionalLight` sun `0xffc978 @ 1.65` re-balanced for daylight rather than as the sole source.
- Dust motes are currently bright specks on black; they must be re-tuned or they vanish on cream.

**Check during implementation**: `PointLight(color, 0.20 + stage*0.18, …)` at grove.html:608. Three.js r155+ made punctual lights physically correct (see the Foundry Glass section in `CLAUDE.md`), so sub-1.0 candela values may already be contributing almost nothing. Verify before assuming the value is meaningful.

---

## Design 2 — Tidal Archive: activate its own depth tokens

The design already defines its answer and ignores it:

```css
--depth-photic:   #1a2a4a;
--depth-twilight: #0d1a35;
--depth-midnight: #050d1e;
--depth-hadal:    #020508;
```

These currently drive one thin decorative rail (`#depth-rail`), while `scene.background` is a flat `0x020509` — hadal black everywhere. The left edge labels PHOTIC / TWILIGHT / MIDNIGHT / HADAL over a scene that renders every zone identically.

**Changes:**
1. Replace the flat scene background with a vertical gradient driven by these four tokens, so depth is visible rather than merely labelled.
2. Interpolate fog colour by camera depth, so descending genuinely darkens. Camera starts at `(0, 100, 480)`, so a Y axis already exists.
3. **Deliberate token changes**: lift `--depth-photic` from `#1a2a4a` to approximately `#4f9ab8`. The
   original is itself a navy; real sunlit shallows are bright, and this is what puts the top of the
   design into a genuinely high key. `--depth-twilight` may also need a modest lift (roughly
   `#163a5c`) so the photic→twilight step doesn't read as a hard band. `--depth-midnight` and
   `--depth-hadal` stay as they are. The rail inherits all of this automatically, so scene and rail
   stay consistent by construction.

This is the only one of the three where the tonal fix and a quality fix are the same fix — Tidal Archive graded 3.5/10 in the audit ("nothing tidal, nothing oceanic; agents tiny and marooned in a void").

---

## Design 3 — Vivarium: dawn terrarium

Most new art direction of the three, and the most re-tuning.

- Background `#03060a` → approximately `#a2b0a6` (desaturated sage mist); scene background and fog to match.
- Chrome inverted to dark-ink-on-light via the token set.
- The floating **black rectangle "trees"** noted in the audit will read far worse against a light background than they did against black. They need to become actual silhouettes or be removed.

**Effects that depend on a black surround** — these are re-tuned, not swapped:
- **Fireflies** are emissive points that only read against darkness. Replace with pollen/dust motes lit by the scene, which read against light.
- **Evolution moment** currently relies on emissive glow and a white eye-flash. On a light background, glow additively blended toward white disappears. Carry the moment with bloom + scale-pop + a brief contrast shift instead.
- **Creature materials** are tuned for a dark surround; check they don't flatten out.

---

## Sequencing

Three separate PRs, in this order. Each is independently valuable and mergeable.

1. **Grove** — restoration, highest confidence, exact target values known.
2. **Tidal Archive** — activates tokens that already exist; also fixes the second-worst design.
3. **Vivarium** — most new art direction, most effect re-tuning.

Rationale: if the direction is wrong we discover it on the restoration rather than three designs deep.

---

## Verification

Per design, before opening its PR:

- Screenshot at **1440×900** and **600×850**, landing and drawer-open.
- Console clean.
- **Contrast is the specific risk of this work.** Every text/surface pair checked against WCAG AA (4.5:1 body, 3:1 large). Dark-first CSS inverted to light is exactly where silent contrast failures ship.
- Grove and Vivarium: confirm the drawer, modals, and stat pills are all legible — they are separate surfaces and easy to miss.
- Tidal Archive: confirm the depth gradient reads across the full camera range, not just at the start position.
- Confirm nav still resolves to all seven flagships (canonical order per `CLAUDE.md`).

---

## Out of scope

- The other four flagships — concept-locked, unchanged.
- The eight 2D concept archives — static mockups not wired to the data layer.
- The monospace-uppercase tic across all fifteen designs, and the three-archives-one-template issue. Both are real audit findings but separate work.
- Light/dark *toggles*. Each design is one art direction, not a themeable shell.

---

## Risks

| Risk | Mitigation |
|---|---|
| Contrast failures shipped silently | WCAG AA check on every pair; screenshot review |
| Grove restore also reverts composition gains | Restore tokens only; never `git revert 187a943` |
| Vivarium effects vanish on a light background | Re-tune fireflies and evolution moment; verify visually |
| Scene lighting rigs assume darkness | Re-light rather than only swapping background colour |
| Docs drift again | Update `CLAUDE.md` palettes in the same PR as each change |
