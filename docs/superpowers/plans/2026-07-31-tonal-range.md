# Tonal Range Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break the design suite out of a single near-black value key by restoring Grove to daylight, activating Tidal Archive's unused depth palette, and moving Vivarium to a mid-key dawn.

**Architecture:** Three independent changes, one per design, shipped as three sequential PRs. Each design's CSS is first routed through a semantic token set so the tonal flip is a single-block change rather than a hunt across 40–56 hardcoded colours. Each 3D scene is re-lit, not merely re-coloured — a background swap without a lighting change produces a washed-out or unreadable scene.

**Tech Stack:** Static HTML + vanilla JS, Three.js 0.169.0 via ESM importmap, GSAP 3.12.2 via CDN. No build step. No test framework.

## Global Constraints

- **No test framework exists in this repo.** Verification is visual and console-based — see the Verification Protocol below. Do not invent a test harness.
- Three.js is **r169**. Punctual lights (`PointLight`, `SpotLight`) are physically correct: intensity is candela and falls off as `intensity / distance²`. `HemisphereLight`/`DirectionalLight`/`AmbientLight` are in lux with no distance falloff.
- Dev server: `npx http-server . -p 5500 --cors -c-1` → `http://localhost:5500`. Port 5500 is intentional; Daily Companion uses 3000.
- Every text/surface pair must meet **WCAG AA**: 4.5:1 for body text, 3:1 for large text (≥24px, or ≥19px bold).
- `main` is protected and requires a PR. Never commit directly to `main`.
- Do **not** run `git revert 187a943` — it contains composition work that must be kept.
- Never widen scope to the other four flagships or the eight 2D archives.
- Preserve the canonical nav order across all designs: `Forge · Archive · Foundry · Lantern · Vivarium · Grove · Mesh`.

---

## Verification Protocol

Referenced by every task. Run the whole protocol before any commit that changes appearance.

**Start the server** (once per session, leave running):

```bash
npx http-server . -p 5500 --cors -c-1
```

**Stop it before any `git pull`/`checkout`** — this repo lives under OneDrive and a running server holds file handles, which causes `error: unable to unlink old '<file>': Invalid argument` and leaves the working tree half-updated.

**Check the console.** Open the page, open DevTools → Console. Expected: no errors except `favicon.ico 404`, which is pre-existing and fine.

**Contrast audit.** Paste into the DevTools console on the page under test. It reports every text node whose contrast against its own background fails WCAG AA:

```js
(() => {
  const lum = (c) => {
    const [r,g,b] = c.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; });
    return 0.2126*r + 0.7152*g + 0.0722*b;
  };
  const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0,3).map(Number);
  const bgOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && !/rgba?\(0, 0, 0, 0\)|transparent/.test(bg)) return parse(bg);
    }
    return [255,255,255];
  };
  const fails = [];
  document.querySelectorAll('body *').forEach(el => {
    if (!el.textContent.trim() || el.children.length) return;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) < 0.1) return;
    const fg = parse(st.color), bg = bgOf(el);
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1,L2) + 0.05) / (Math.min(L1,L2) + 0.05);
    const size = parseFloat(st.fontSize);
    const large = size >= 24 || (size >= 19 && parseInt(st.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need) fails.push({ text: el.textContent.trim().slice(0,32), ratio: +ratio.toFixed(2), need, size });
  });
  console.table(fails);
  return fails.length ? `${fails.length} CONTRAST FAILURES` : 'contrast OK';
})();
```

Expected: `contrast OK`. Any row in the table is a blocker — fix it before committing.

**Screenshot** at 1440×900 and 600×850, in both landing and drawer-open states. Compare against the previous task's screenshot to confirm only the intended thing changed.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `grove.html` | Botanical daylight design — CSS tokens, scene, lighting | 1–4 |
| `tidal-archive.html` | Ocean depth design — depth tokens, scene gradient, fog | 6–8 |
| `vivarium.html` | Terrarium dawn design — CSS tokens, scene, creature effects | 10–15 |
| `CLAUDE.md` | Palette documentation, currently wrong for Grove | 5, 9, 16 |

All three designs are single self-contained HTML files. That is the established pattern here — do not split them into modules.

**Deviation from the spec, deliberate:** the spec calls for the semantic token refactor on all three
designs. This plan applies it to Grove (Task 1) and Vivarium (Task 10) only. Tidal Archive's *chrome
stays dark* — only its 3D scene changes — so inverting its chrome tokens would be churn with no
tonal payoff. Tidal's four `--depth-*` tokens already are its colour source of truth, which is the
property the refactor exists to create. If Tidal's chrome is ever lightened, do the refactor then.

---

# PR 1 — Grove: restore daylight

### Task 1: Route Grove's hardcoded colours through tokens

Prerequisite for the flip. **No visual change** — this task must look identical before and after.

**Files:**
- Modify: `grove.html` (CSS block, `:root` at ~line 8)

**Interfaces:**
- Produces: the token names `--bg`, `--surface`, `--surface-lift`, `--text`, `--text-dim`, `--text-mute`, `--border`, `--border-mid`, `--accent`, `--accent-dim`, `--accent-glow` as the single source of colour truth for Task 2.

- [ ] **Step 1: Inventory the hardcoded values**

```bash
grep -nE "rgba?\([0-9]|#[0-9a-fA-F]{3,6}" grove.html | grep -v ":root" | grep -vE "^\s*[0-9]+:\s*//" > /tmp/grove-colors.txt
wc -l < /tmp/grove-colors.txt
```

Expected: roughly 56 lines. Review the file — each line is a candidate.

- [ ] **Step 2: Replace each hardcoded chrome colour with its token**

Work through the list. For each CSS declaration that sets a chrome colour, substitute the token that already matches it. Example — the masthead panel currently reads:

```css
background: rgba(24,20,16,0.86);
```

Since `--surface` is already `rgba(24,20,16,0.86)`, this becomes:

```css
background: var(--surface);
```

Rules for this pass:
- Only replace where the literal already equals the token value, or differs only in alpha. Do **not** change any rendered colour in this task.
- If a literal has no matching token and is used more than once, add a token for it.
- Leave colours inside GLSL shader strings and `THREE.Color(...)` calls alone — those are scene, handled in Task 3.
- Leave the four `--accent`/`--rose`/`--sun` semantic hues alone.

- [ ] **Step 3: Verify nothing moved**

Run the Verification Protocol. Screenshot at 1440×900.

Expected: **pixel-identical** to before this task. If anything shifted, a substitution changed a value — find it and revert that one.

- [ ] **Step 4: Confirm the inventory shrank**

```bash
grep -cE "rgba?\([0-9]|#[0-9a-fA-F]{3,6}" grove.html
```

Expected: substantially lower than the Step 1 count. Remaining hits should be inside `:root`, shader strings, or `THREE.Color` calls.

- [ ] **Step 5: Commit**

```bash
git checkout -b session-9/grove-daylight
git add grove.html
git commit -m "refactor(grove): route chrome colours through semantic tokens

No visual change. Prerequisite for the daylight restore — makes the
tonal flip a single-block change instead of a 56-site hunt."
```

---

### Task 2: Flip Grove's tokens to daylight

**Files:**
- Modify: `grove.html` `:root` block

**Interfaces:**
- Consumes: the token layer from Task 1.

- [ ] **Step 1: Replace the colour tokens**

In `:root`, replace exactly these eleven declarations. Values are taken verbatim from `187a943^`, the last commit before the regression:

```css
--bg:          #f5f0e8;
--surface:     #ede8dc;
--surface-lift:#e4ddd0;
--accent:      #5c8a3c;
--accent-dim:  rgba(92,138,60,0.22);
--accent-glow: rgba(92,138,60,0.08);
--text:        #2c2423;
--text-dim:    rgba(44,36,35,0.60);
--text-mute:   rgba(44,36,35,0.36);
--border:      rgba(92,138,60,0.12);
--border-mid:  rgba(92,138,60,0.28);
```

Leave `--rose: #d45858` and `--sun: #f0b03f` — these did not change between versions.

Note `--accent` moves from amber `#f2b544` back to botanical green `#5c8a3c`. This is intentional: amber on cream fails contrast, and green is the documented accent.

- [ ] **Step 2: Run the contrast audit**

Run the Verification Protocol contrast snippet.

Expected: `contrast OK`. The scene will look wrong at this point — that is expected and Task 3 fixes it. Only chrome contrast matters here.

- [ ] **Step 3: Fix any failures**

If the audit lists rows, the usual causes are: a surface still using a dark literal Task 1 missed, or `--text-mute` at 0.36 alpha being too faint on cream. Raise the alpha rather than changing the hue.

Re-run until `contrast OK`.

- [ ] **Step 4: Commit**

```bash
git add grove.html
git commit -m "feat(grove): restore daylight palette

Restores the eleven colour tokens to their pre-187a943 values, including
the botanical green accent. Scene relight follows in the next commit."
```

---

### Task 3: Re-light the Grove scene for daylight

The scene is currently lit as a night rig. A cream background behind night lighting reads as washed-out and flat.

**Files:**
- Modify: `grove.html:302` (scene background), `grove.html:311-322` (lights)

- [ ] **Step 1: Set the scene background to cream**

Replace line 302:

```js
scene.background = new THREE.Color(0xf5f0e8);
```

- [ ] **Step 2: Replace the light rig**

Replace lines 311–322 with:

```js
scene.add(new THREE.HemisphereLight(0xdfe9f2, 0xc9bda6, 1.15));
const sun = new THREE.DirectionalLight(0xfff2dc, 2.4);
sun.position.set(6, 12, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { near:0.5, far:50, left:-14, right:14, top:10, bottom:-10 });
sun.shadow.bias = -0.0005;
scene.add(sun);
// Cool sky bounce from the opposite side, standing in for open shade
const fill = new THREE.DirectionalLight(0xcfe0f0, 0.55);
fill.position.set(-5, 6, -3);
scene.add(fill);
```

Rationale: the hemisphere light carries most of the daylight ambient (bright sky above, warm ground bounce below), the sun is a near-white key, and the fill turns cool because in daylight the fill is sky, not a second warm lamp.

Note: `HemisphereLight` and `DirectionalLight` take lux and have no distance falloff, so these values transfer directly — unlike the `PointLight` in Task 4.

- [ ] **Step 3: Verify the scene**

Run the Verification Protocol. Screenshot at 1440×900.

Expected: plants read as lit objects on a warm cream table; shadows are present but soft; nothing is blown out to pure white. If highlights clip, lower `sun` intensity toward 2.0 rather than dimming the hemisphere.

- [ ] **Step 4: Commit**

```bash
git add grove.html
git commit -m "feat(grove): re-light scene for daylight

Night rig (hemisphere 0.22, warm-on-warm fill) replaced with a daylight
rig: bright sky hemisphere, near-white key, cool sky fill."
```

---

### Task 4: Re-tune Grove's motes and audit the per-plant point light

**Files:**
- Modify: `grove.html:370` (dust motes), `grove.html:483` (pollen), `grove.html:608` (point light)

- [ ] **Step 1: Re-tune the dust motes**

Line 370 draws pale motes at `0xffdba5` / opacity `0.42` — near-invisible against cream. Replace with a darker, denser mote so it reads as floating matter in a sunbeam:

```js
scene.add(new THREE.Points(dmGeo, new THREE.PointsMaterial({ color:0x8a7a5c, size:0.030, transparent:true, opacity:0.34, depthWrite:false })));
```

- [ ] **Step 2: Audit the per-plant point light**

Line 608 reads:

```js
const ptl = new THREE.PointLight(color, 0.20 + stage * 0.18, 2.5 + stage * 0.4);
```

Under r169 physical units this is candela with `1/distance²` falloff. At stage 0 that is 0.20 candela — effectively nothing.

Determine empirically whether it contributes at all. The scene variables live inside a module scope and are not reachable from the console, so test by editing the source directly.

Temporarily set the intensity to a deliberately large value, save, hard-reload, and observe whether the plants change:

```js
const ptl = new THREE.PointLight(color, 12 + stage * 8, 2.5 + stage * 0.4);
```

Toggle between that and the original `0.20 + stage * 0.18` a couple of times so you are comparing against something, rather than judging a single frame in isolation.

- [ ] **Step 3: Decide based on what you saw**

- If the exaggerated value visibly changes the plant, the light works and is merely underpowered — keep a rescaled value in the `8 + stage * 6` range.
- If nothing changes even at 12 candela, the light is dead code in this rig. Note it in the commit message and leave it at the rescaled value anyway, since it will matter once daylight ambient is lower.

Do not leave the exaggerated debug value in the file.

- [ ] **Step 4: Verify**

Run the Verification Protocol. Screenshot at 1440×900 and 600×850.

Expected: motes visible against cream; plants read clearly; console clean.

- [ ] **Step 5: Commit**

```bash
git add grove.html
git commit -m "fix(grove): re-tune motes and rescale per-plant point light

Motes were pale-on-black and invisible on cream. Point light used
sub-1.0 candela values, which under r169 physical units contributed
almost nothing."
```

---

### Task 5: Update docs and open the Grove PR

**Files:**
- Modify: `CLAUDE.md` (Grove palette section)

- [ ] **Step 1: Correct the Grove palette line**

`CLAUDE.md` documents Grove as cream — which was true, then wrong, and is now true again. Add a note so the history is not re-litigated:

```markdown
**Palette**: Background `#f5f0e8` (warm cream), accent `#5c8a3c`, fonts: Playfair Display + Lora + JetBrains Mono

> Grove is the suite's **high-key** design. Commit `187a943` flipped it to near-black `#0f0d0a`
> with an amber accent and the docs were never updated; it was restored on 2026-07-31. If you are
> changing this palette, you are changing the only light design in the set — see
> `docs/superpowers/specs/2026-07-31-tonal-range-design.md`.
```

- [ ] **Step 2: Verify one final time**

Run the full Verification Protocol at both viewports, landing and drawer-open.

- [ ] **Step 3: Push and open the PR**

```bash
git add CLAUDE.md
git commit -m "docs: mark Grove as the suite's high-key design"
git push -u origin session-9/grove-daylight
gh pr create --base main --title "Grove: restore daylight palette and re-light scene" --body "Restores Grove to its documented cream palette, reversing an undocumented regression in 187a943, and re-lights the scene for daylight.

Grove was #f5f0e8 from the initial commit through 187a943^. That commit flipped it to #0f0d0a with an amber accent; CLAUDE.md was never updated and has disagreed with the code since.

Composition and typography gains from 187a943 are kept — this restores the tonal layer only, it is not a revert.

Verified: contrast audit passes WCAG AA, console clean, screenshots at 1440x900 and 600x850."
```

---

# PR 2 — Tidal Archive: activate the depth palette

### Task 6: Lift the depth tokens

**Files:**
- Modify: `tidal-archive.html:15-18`

**Interfaces:**
- Produces: `--depth-photic`, `--depth-twilight`, `--depth-midnight`, `--depth-hadal` as the source of truth consumed by Tasks 7 and 8.

- [ ] **Step 1: Branch from updated main**

```bash
git checkout main && git pull --ff-only
git checkout -b session-9/tidal-depth
```

- [ ] **Step 2: Lift the two upper zones**

Replace lines 15–18:

```css
--depth-photic:    #4f9ab8;
--depth-twilight:  #163a5c;
--depth-midnight:  #050d1e;
--depth-hadal:     #020508;
```

`--depth-photic` was `#1a2a4a`, itself a navy. Sunlit shallows are bright; this is what puts the top of the design into a high key. `--depth-twilight` rises from `#0d1a35` so the photic→twilight step is a gradient rather than a hard band. The lower two zones are unchanged — the bottom of the ocean should stay black.

- [ ] **Step 3: Verify the rail inherits it**

Load `http://localhost:5500/tidal-archive.html` and look at `#depth-rail` on the left edge.

Expected: the rail now reads as a genuine gradient from bright cyan to black. The 3D scene is still flat — Task 7.

- [ ] **Step 4: Run the contrast audit**

The zone labels (PHOTIC / TWILIGHT / MIDNIGHT / HADAL) sit on the rail. A brighter photic band may break the label sitting on it.

Expected: `contrast OK`. If the PHOTIC label fails, darken the label rather than the band.

- [ ] **Step 5: Commit**

```bash
git add tidal-archive.html
git commit -m "feat(tidal): lift photic and twilight depth tokens

The photic zone is the sunlit layer but was set to a navy, so the
declared depth range spanned near-black to slightly-less-near-black."
```

---

### Task 7: Drive the scene background from the depth tokens

**Files:**
- Modify: `tidal-archive.html` (scene setup, near `scene.background`)

**Interfaces:**
- Consumes: the four depth tokens from Task 6.

- [ ] **Step 1: Find the flat background**

```bash
grep -n "scene.background\|new THREE.Color(0x020509)" tidal-archive.html
```

- [ ] **Step 2: Replace it with a gradient texture built from the tokens**

Reading the tokens from CSS keeps the rail and the scene consistent by construction — one edit changes both. Insert in place of the flat assignment:

```js
/* Build the scene backdrop from the same --depth-* tokens that drive
 * #depth-rail, so the labelled zones and the rendered water can never
 * drift apart. Previously the scene was flat hadal black while the rail
 * claimed four distinct zones. */
function depthBackdrop() {
  const css = getComputedStyle(document.documentElement);
  const stops = ['--depth-photic', '--depth-twilight', '--depth-midnight', '--depth-hadal']
    .map(n => css.getPropertyValue(n).trim());
  const c = document.createElement('canvas');
  c.width = 2; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0.00, stops[0]);
  grad.addColorStop(0.30, stops[1]);
  grad.addColorStop(0.65, stops[2]);
  grad.addColorStop(1.00, stops[3]);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
scene.background = depthBackdrop();
```

The gradient stops match `#depth-rail`'s existing `0% / 30% / 65% / 100%` so the two read as the same water.

- [ ] **Step 3: Verify**

Run the Verification Protocol. Screenshot at 1440×900.

Expected: the scene reads as water lit from above, descending to black. Agents in the upper region are now silhouetted against light rather than lost in a void.

- [ ] **Step 4: Commit**

```bash
git add tidal-archive.html
git commit -m "feat(tidal): render the depth gradient in the scene

Scene background now derives from the same --depth-* tokens as the rail,
so labelled zones and rendered water cannot drift apart."
```

---

### Task 8: Interpolate fog by camera depth

**Files:**
- Modify: `tidal-archive.html` (fog setup and render loop)

- [ ] **Step 1: Check for existing fog**

```bash
grep -n "Fog\|fog" tidal-archive.html
```

If there is no fog, add one after the background assignment:

```js
scene.fog = new THREE.FogExp2(0x0d1a35, 0.0016);
```

- [ ] **Step 2: Drive the fog colour from camera height**

The camera starts at `(0, 100, 480)`, so a Y axis already exists. In the render loop, before `renderer.render(...)`:

```js
/* Fog tracks the camera's depth so descending genuinely darkens rather
 * than staying one flat blue at every altitude. */
const DEPTH_TOP = 160, DEPTH_BOTTOM = -120;
const fogPhotic = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--depth-twilight').trim());
const fogHadal  = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--depth-hadal').trim());
// ...inside the animation loop:
const t = THREE.MathUtils.clamp((camera.position.y - DEPTH_BOTTOM) / (DEPTH_TOP - DEPTH_BOTTOM), 0, 1);
scene.fog.color.copy(fogHadal).lerp(fogPhotic, t);
```

Hoist the two `THREE.Color` constructions outside the loop — do not allocate per frame.

- [ ] **Step 3: Verify across the camera range**

Load the page and drag/scroll to move the camera through its full vertical range.

Expected: fog lightens as you rise and darkens as you descend, with no banding or sudden jumps. Confirm at both extremes, not just the start position.

- [ ] **Step 4: Commit**

```bash
git add tidal-archive.html
git commit -m "feat(tidal): interpolate fog colour by camera depth"
```

---

### Task 9: Update docs and open the Tidal PR

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Document the depth model**

Add to the Tidal Archive notes:

```markdown
**Depth model**: `--depth-photic` / `-twilight` / `-midnight` / `-hadal` are the single source of
truth for both `#depth-rail` and the 3D scene backdrop and fog. Change the tokens, not the scene —
they were allowed to drift apart once already (the rail claimed four zones while the scene rendered
flat hadal black).
```

- [ ] **Step 2: Verify and open the PR**

Run the full Verification Protocol at both viewports.

```bash
git add CLAUDE.md
git commit -m "docs: record the Tidal Archive depth model"
git push -u origin session-9/tidal-depth
gh pr create --base main --title "Tidal Archive: render the depth gradient the design already declares" --body "The design defined --depth-photic/-twilight/-midnight/-hadal and used them on one decorative rail while scene.background was flat hadal black — four labelled zones over a scene that rendered them identically.

Scene backdrop and fog now derive from those same tokens, and the photic zone is lifted to an actual sunlit cyan.

This is both the tonal-range fix and a quality fix: the design graded 3.5/10 in the audit for reading as an empty void.

Verified: contrast audit passes, console clean, fog checked across the full camera range."
```

---

# PR 3 — Vivarium: mid-key dawn

Most new art direction and the most re-tuning. Do this last.

### Task 10: Route Vivarium's hardcoded colours through tokens

Same shape as Task 1. **No visual change.**

**Files:**
- Modify: `vivarium.html` (CSS block)

**Interfaces:**
- Produces: the token layer consumed by Task 11.

- [ ] **Step 1: Branch and inventory**

```bash
git checkout main && git pull --ff-only
git checkout -b session-9/vivarium-dawn
grep -cE "rgba?\([0-9]|#[0-9a-fA-F]{3,6}" vivarium.html
```

Expected: roughly 56.

- [ ] **Step 2: Introduce the token set**

Vivarium's `:root` uses `--bg: #03060a`. Add the semantic set alongside it, matching Grove's names so the two files stay learnable:

```css
--surface:      rgba(10,18,14,0.86);
--surface-lift: #16221b;
--text:         #e8f2e6;
--text-dim:     rgba(232,242,230,0.72);
--text-mute:    rgba(232,242,230,0.46);
--border:       rgba(126,255,154,0.16);
--border-mid:   rgba(126,255,154,0.34);
```

Set each to the literal the file already uses, so this step changes nothing visually. Then replace the hardcoded chrome declarations with `var(--…)` references, following the same rules as Task 1 Step 2 — shaders and `THREE.Color` calls untouched.

- [ ] **Step 3: Verify nothing moved**

Run the Verification Protocol. Screenshot at 1440×900.

Expected: **pixel-identical** to before.

- [ ] **Step 4: Commit**

```bash
git add vivarium.html
git commit -m "refactor(vivarium): route chrome colours through semantic tokens

No visual change. Prerequisite for the mid-key flip."
```

---

### Task 11: Flip Vivarium to mid-key dawn

**Files:**
- Modify: `vivarium.html` `:root`

- [ ] **Step 1: Set the dawn palette**

```css
--bg:           #a2b0a6;
--surface:      rgba(244,247,243,0.88);
--surface-lift: #e8ede7;
--text:         #1e2620;
--text-dim:     rgba(30,38,32,0.66);
--text-mute:    rgba(30,38,32,0.42);
--border:       rgba(46,74,54,0.16);
--border-mid:   rgba(46,74,54,0.32);
```

`#a2b0a6` is a desaturated sage mist at roughly 68% lightness — the mid rung between Grove's cream and the dark set. Treat it as a starting point: if it reads muddy against the creature colours, move it along the sage axis rather than toward grey, so it stays a terrarium and not a studio.

- [ ] **Step 2: Contrast audit**

Run the snippet. Expected `contrast OK`. The scene will look wrong until Task 12 — chrome only here.

- [ ] **Step 3: Commit**

```bash
git add vivarium.html
git commit -m "feat(vivarium): mid-key dawn palette"
```

---

### Task 12: Re-light the Vivarium scene

**Files:**
- Modify: `vivarium.html` (scene background, fog, lights)

- [ ] **Step 1: Locate the scene rig**

```bash
grep -nE "scene.background|Fog|Light\(" vivarium.html | head -12
```

- [ ] **Step 2: Set background and fog to dawn**

```js
scene.background = new THREE.Color(0xa2b0a6);
scene.fog = new THREE.FogExp2(0xa2b0a6, 0.028);
```

Fog must match the background or the horizon shows a visible seam.

- [ ] **Step 3: Re-light for dawn**

Replace the existing rig with:

```js
scene.add(new THREE.HemisphereLight(0xd6e4dc, 0x7d8a80, 1.05));
const key = new THREE.DirectionalLight(0xffe8cc, 1.9);
key.position.set(4, 9, 6);
key.castShadow = true;
scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd4e8, 0.5);
rim.position.set(-6, 4, -5);
scene.add(rim);
```

Keep any existing `castShadow`/shadow-camera configuration on the key light — copy it across rather than dropping it.

- [ ] **Step 4: Verify**

Run the Verification Protocol. Screenshot at 1440×900.

Expected: creatures read as lit objects in morning mist; no seam at the horizon; nothing blown out.

- [ ] **Step 5: Check the creature materials specifically**

The creature materials were tuned against a black surround, where any lit surface reads as form. Against mist they can flatten into silhouettes with no interior shading.

Compare each of the four creature types at 1440×900. Expected: rounded forms still read as three-dimensional, with visible shading between lit and shadowed sides.

If a creature reads flat, raise its material `roughness` toward 0.8 so it catches more diffuse gradient, rather than adding another light — the rig is already balanced from Step 3.

- [ ] **Step 6: Commit**

```bash
git add vivarium.html
git commit -m "feat(vivarium): re-light scene for dawn"
```

---

### Task 13: Replace fireflies with pollen motes

Fireflies are emissive points that only read against darkness. On a mid-key background they disappear.

**Files:**
- Modify: `vivarium.html` (firefly Points setup)

- [ ] **Step 1: Locate them**

```bash
grep -nE "firefly|fireflies|Points\(" vivarium.html | head
```

- [ ] **Step 2: Convert to lit pollen**

Emissive-bright-on-black becomes darker-warm-on-light. Replace the firefly `PointsMaterial` with:

```js
new THREE.PointsMaterial({ color: 0x6f7a5e, size: 0.055, transparent: true, opacity: 0.5, depthWrite: false })
```

Keep the existing geometry and drift animation — only the material changes. The motes should read as matter floating in morning light, not as glowing insects.

- [ ] **Step 3: Verify**

Screenshot at 1440×900. Expected: motes clearly visible against the mist, reading as drifting particles.

- [ ] **Step 4: Commit**

```bash
git add vivarium.html
git commit -m "fix(vivarium): fireflies become lit pollen motes

Emissive points only read against black; on a mid-key background they
vanished entirely."
```

---

### Task 14: Re-tune the evolution moment

The stage-promotion animation flashes eyes white and fires an additive starburst. Additive white on a light background is invisible.

**Files:**
- Modify: `vivarium.html` (promotion / evolution animation)

- [ ] **Step 1: Locate it**

```bash
grep -nE "EVOLVED|promot|starburst|flash" vivarium.html | head
```

- [ ] **Step 2: Carry the moment with scale and contrast, not glow**

Replace the white eye-flash and additive burst with a hop plus a scale-pop plus a brief darkening of the creature against the mist — inverse contrast reads on light exactly where additive glow fails:

```js
// Evolution beat: on a light background, additive white is invisible.
// Read the moment through scale and inverse contrast instead of glow.
gsap.timeline()
  .to(group.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.18, ease: 'back.out(3)' })
  .to(group.scale, { x: 1, y: 1, z: 1, duration: 0.42, ease: 'elastic.out(1, 0.5)' })
  .to(bodyMat.color, { r: 0.12, g: 0.16, b: 0.13, duration: 0.14 }, 0)
  .to(bodyMat.color, { r: baseColor.r, g: baseColor.g, b: baseColor.b, duration: 0.5 }, 0.18);
```

Capture `baseColor` as a `THREE.Color` clone of the creature's colour before the timeline runs, or the restore target will be wrong on a second promotion.

Keep the existing `EVOLVED` DOM overlay — it is DOM text and already tokenised, so it inherits the new palette.

- [ ] **Step 3: Verify by triggering a promotion**

Feed a skill to an agent until it crosses a stage threshold (XP thresholds: 10 / 40 / 100).

Expected: the moment is clearly legible against the light background. Console clean.

- [ ] **Step 4: Commit**

```bash
git add vivarium.html
git commit -m "fix(vivarium): evolution beat reads through scale and contrast

Additive white flash was invisible against a light background."
```

---

### Task 15: Replace the black rectangle trees

The audit flagged the background "trees" as literal black rectangles. Against black they read as crude silhouettes; against mist they will read as a bug.

**Files:**
- Modify: `vivarium.html` (background tree geometry)

- [ ] **Step 1: Locate them**

```bash
grep -nE "tree|silhouette|PlaneGeometry|BoxGeometry" vivarium.html | head
```

- [ ] **Step 2: Give them a real silhouette**

Replace the rectangular geometry with a tapered trunk so the shape reads as vegetation, and tint them toward the fog colour so they sit in the mist rather than punching holes in it:

```js
// Tapered trunks tinted toward the fog so they recede into the mist.
// Flat black rectangles read as rendering artefacts on a light background.
const trunkGeo = new THREE.CylinderGeometry(0.06, 0.16, 5.2, 6);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c6b5e, roughness: 0.95, metalness: 0 });
```

Keep the existing placement/scatter logic — only geometry and material change.

- [ ] **Step 3: Verify**

Screenshot at 1440×900. Expected: background growth reads as distant vegetation receding into mist, with no hard black shapes.

- [ ] **Step 4: Commit**

```bash
git add vivarium.html
git commit -m "fix(vivarium): tapered tinted trunks replace black rectangles"
```

---

### Task 16: Update docs and open the Vivarium PR

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Document the value ladder**

Add near the design table:

```markdown
### Tonal range (as of 2026-07-31)

The suite deliberately spans three value keys. Before this, all seven flagships sat between
`#020509` and `#111010` and the set read as one mood in seven costumes.

| Design | Key | Background |
|---|---|---|
| Grove | high | `#f5f0e8` |
| Vivarium | mid | `#a2b0a6` |
| Tidal Archive | spans internally | photic → hadal |
| Constellation Forge, Lantern Garden, Neural Mesh, Foundry Glass | low | unchanged — concept-locked |

The four low-key designs are concept-locked: deep space, an explicitly *night* garden, a synaptic
void, and a forge kept dark so glowing metal reads. Do not "balance" the set by lightening them.
```

Also correct Vivarium's palette line, which still documents `#080f08`.

- [ ] **Step 2: Full verification**

Run the Verification Protocol at both viewports, landing and drawer-open, and trigger one promotion.

- [ ] **Step 3: Open the PR**

```bash
git add CLAUDE.md
git commit -m "docs: record the suite's tonal range and correct Vivarium's palette"
git push -u origin session-9/vivarium-dawn
gh pr create --base main --title "Vivarium: mid-key dawn terrarium" --body "Moves Vivarium to the middle rung of the value ladder, completing the tonal range work.

A terrarium is a lit glass object, so daylight does not contradict the concept the way it would for a night garden or deep space.

Effects that depended on a black surround were re-tuned rather than swapped: fireflies became lit pollen motes, and the evolution beat now reads through scale and inverse contrast instead of an additive white flash that is invisible on light. The background 'trees' were flat black rectangles and are now tapered trunks tinted toward the fog.

Verified: contrast audit passes WCAG AA, console clean, promotion animation checked, screenshots at 1440x900 and 600x850."
```

---

## Done when

- All three PRs merged.
- Backgrounds measure `#f5f0e8`, `#a2b0a6`, and a photic→hadal gradient respectively.
- `CLAUDE.md` documents the value ladder and no longer contradicts any design's actual palette.
- The contrast audit returns `contrast OK` on all three designs.
