import * as THREE from 'three';

export function spawnPollenBurst(scene, from, colorHex, reducedMotion) {
  if (reducedMotion || !scene || !from) return;
  const count = 32;
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    pos[i * 3] = from.x;
    pos[i * 3 + 1] = from.y;
    pos[i * 3 + 2] = from.z;
    const a = Math.random() * Math.PI * 2;
    const r = 0.008 + Math.random() * 0.012;
    vel[i * 3] = Math.cos(a) * r;
    vel[i * 3 + 1] = 0.01 + Math.random() * 0.02;
    vel[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(colorHex || 0x5c8a3c),
    size: 0.03,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  const start = performance.now();
  const duration = 600;
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const p = geo.attributes.position;
    for (let i = 0; i < count; i += 1) {
      p.array[i * 3] += vel[i * 3];
      p.array[i * 3 + 1] += vel[i * 3 + 1];
      p.array[i * 3 + 2] += vel[i * 3 + 2];
      vel[i * 3 + 1] *= 0.94;
    }
    p.needsUpdate = true;
    mat.opacity = 0.8 * (1 - t);
    if (t < 1) requestAnimationFrame(tick);
    else {
      scene.remove(pts);
      geo.dispose();
      mat.dispose();
    }
  }
  requestAnimationFrame(tick);
}
