import * as THREE from 'three';

export function spawnFeedMotes(scene, from, to, colorHex, reducedMotion) {
  if (reducedMotion || !scene || !from || !to) return;
  const count = 26;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = from.x + (Math.random() - 0.5) * 0.8;
    positions[i * 3 + 1] = from.y + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 2] = from.z + (Math.random() - 0.5) * 0.8;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const c = new THREE.Color(colorHex || 0x7eff9a);
  const mat = new THREE.PointsMaterial({
    color: c,
    size: 0.06,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  const start = performance.now();
  const duration = 700;
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const p = geo.attributes.position;
    for (let i = 0; i < count; i += 1) {
      const wobble = (1 - t) * 0.08;
      const sx = p.array[i * 3];
      const sy = p.array[i * 3 + 1];
      const sz = p.array[i * 3 + 2];
      p.array[i * 3] = sx + (to.x - sx) * 0.18 + Math.sin(now * 0.01 + phases[i]) * wobble;
      p.array[i * 3 + 1] = sy + (to.y - sy) * 0.18 + Math.cos(now * 0.012 + phases[i]) * wobble;
      p.array[i * 3 + 2] = sz + (to.z - sz) * 0.18 + Math.sin(now * 0.009 + phases[i] * 0.7) * wobble;
    }
    p.needsUpdate = true;
    mat.opacity = 0.95 * (1 - t);
    mat.size = 0.06 + t * 0.02;
    if (t < 1) requestAnimationFrame(tick);
    else {
      scene.remove(pts);
      geo.dispose();
      mat.dispose();
    }
  }
  requestAnimationFrame(tick);
}
