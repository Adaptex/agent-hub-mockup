# Agent Hub Mockup

Gamified AI-agent management UI — agents grow visually as you feed skills. Multiple 3D design themes share one browser data layer (`state-manager.js` / `localStorage`).

**Phase 0:** local-only mockup (no backend, no real agent execution). See `CLAUDE.md` and `PLAN.md`.

## Live demo

**Production:** [https://agent-hub-mockup.vercel.app](https://agent-hub-mockup.vercel.app)

Open `/` for the design hub, or jump directly:

| Design | Path |
|--------|------|
| Constellation Forge | `/constellation-forge.html` |
| Tidal Archive | `/tidal-archive.html` |
| Foundry Glass | `/foundry-glass.html` |
| Lantern Garden | `/lantern-garden-v2.html` |
| Vivarium | `/vivarium.html` |
| Grove | `/grove.html` |
| Neural Mesh | `/neural-mesh.html` |

Earlier 2D concept explorations (static mockups, not wired to the shared data layer) are kept as an
archive — see the footer links on `/` or the 2D Concept Archive table in `CLAUDE.md`.

## Local dev

```bash
npx http-server . -p 5500 --cors -c-1
```

Or double-click `start.bat` (Windows).

## Deploy (Vercel)

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import the repository.
3. Framework preset: **Other** (static HTML, no build command).
4. Root directory: `.` — Deploy.

Or CLI (after `npx vercel login`):

```bash
npx vercel --prod
```

## CLI (optional)

```bash
node agentHub.mjs list
node agentHub.mjs create --name "My Agent" --color "#7eff9a"
```
