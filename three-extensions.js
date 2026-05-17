/* three-extensions.js — visual feedback for agent growth
 * Classic script loaded before the module. Exposes window._threeExt.
 * Functions receive THREE + scene objects as args (no import needed).
 */
(function () {
  const MAX_SHARDS = 7;
  const BASE_SHARD_COUNT = 3;

  /* Scale-pulse animation when a skill is absorbed */
  function animateSkillAbsorb(mesh, prefersReducedMotion) {
    if (prefersReducedMotion) return;
    const start = performance.now();
    const duration = 600;
    const baseScale = mesh.userData.baseScale || 1.0;

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      // ease out elastic-ish: scale up then settle
      const ease = t < 0.5
        ? 1 + Math.sin(t * Math.PI) * 0.18
        : 1 + Math.sin(t * Math.PI) * 0.06;
      // Don't fight the tick loop's sel/hv multipliers — only set baseScale hint
      mesh.userData.absorbScale = ease;
      if (t < 1) requestAnimationFrame(step);
      else mesh.userData.absorbScale = 1;
    }
    requestAnimationFrame(step);
  }

  /* Add a new shard orbiting the agent mesh */
  function addShardToMesh(mesh, group, THREE, agentColor) {
    const existing = mesh.userData.shards || [];
    if (existing.length >= MAX_SHARDS) return;

    const s = existing.length;
    const geo = new THREE.TetrahedronGeometry(0.08 + s * 0.015, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: agentColor,
      emissive: agentColor,
      emissiveIntensity: 0.65,
      metalness: 0.6,
      roughness: 0.3,
    });
    const shard = new THREE.Mesh(geo, mat);

    const cx = mesh.position.x;
    const cy = mesh.userData.baseY;
    const cz = mesh.position.z;
    const ra = 0.95 + s * 0.1;
    shard.position.set(
      cx + Math.cos(s * 2.1) * ra * 0.25,
      cy + 0.35 + s * 0.1,
      cz + Math.sin(s * 1.7) * ra * 0.25
    );
    shard.userData.orbit = { cx, cy, cz, r: ra, speed: 0.4 + s * 0.15, off: s * 2 };
    group.add(shard);
    if (!mesh.userData.shards) mesh.userData.shards = [];
    mesh.userData.shards.push(shard);
  }

  /* Update emissive intensity and ring opacity to reflect new stage */
  function updateStageVisuals(mesh, agent, prefersReducedMotion) {
    const stage = agent.stage || 0;
    // Emissive intensity scales with stage (0→3)
    const newBase = 0.38 + stage * 0.18;
    mesh.userData.baseEmissive = newBase;
    mesh.material.emissiveIntensity = newBase;

    // Ring opacity grows with stage
    if (mesh.userData.ring) {
      const ringOp = 0.28 + stage * 0.12;
      mesh.userData.ring.material.opacity = ringOp;
    }

    // Scale hint: bigger agents at higher stages
    mesh.userData.baseScale = 1 + stage * 0.06;

    if (!prefersReducedMotion) {
      // Brief ring spin boost — use baseSpin so nested calls restore correctly
      if (mesh.userData.ring) {
        const ring = mesh.userData.ring;
        if (!ring.userData.baseSpin) ring.userData.baseSpin = ring.userData.spin;
        ring.userData.spin = ring.userData.baseSpin * 3;
        setTimeout(() => {
          if (ring.parentNode !== undefined) ring.userData.spin = ring.userData.baseSpin;
        }, 800);
      }
    }
  }

  /* Pulse flash at agent screen position */
  function pulseFlashAt(mesh, camera, canvas, prefersReducedMotion) {
    if (prefersReducedMotion) return;
    const pulseEl = document.getElementById("pulse-flash");
    if (!pulseEl) return;

    const pos = mesh.position.clone();
    pos.project(camera);
    const px = ((pos.x + 1) / 2) * 100;
    const py = ((1 - pos.y) / 2) * 100;
    pulseEl.style.setProperty("--px", `${px}%`);
    pulseEl.style.setProperty("--py", `${py}%`);
    pulseEl.classList.add("on");
    setTimeout(() => pulseEl.classList.remove("on"), 400);
  }

  window._threeExt = {
    animateSkillAbsorb,
    addShardToMesh,
    updateStageVisuals,
    pulseFlashAt,
    MAX_SHARDS,
    BASE_SHARD_COUNT,
  };
})();
