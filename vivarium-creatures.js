export function applyCreatureCharm(group, stage) {
  if (!group || !group.userData) return;
  const head = group.userData.headGroup;
  if (head) {
    const scale = stage === 1 ? 1.08 : stage >= 2 ? 1.02 : 1.0;
    head.scale.setScalar(scale);
  }
  if (!group.userData.blinkPhase) {
    group.userData.blinkPhase = Math.random() * Math.PI * 2;
  }
}

export function tickCreatureBlink(group, t) {
  if (!group || !group.userData || !group.userData.headGroup) return;
  const eyes = group.userData.headGroup.children.filter((c) => c.type === 'Group');
  if (!eyes.length) return;
  const blink = Math.max(0.35, Math.abs(Math.sin(t * 0.9 + group.userData.blinkPhase)));
  eyes.forEach((eye) => {
    eye.scale.y += (blink - eye.scale.y) * 0.18;
  });
}
