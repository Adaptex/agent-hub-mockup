export function applyPlantArtDirection(group, stage) {
  if (!group || !group.userData || !group.userData.growthGroup) return;
  const gg = group.userData.growthGroup;
  if (stage >= 3) {
    gg.scale.set(1.03, 1.03, 1.03);
  } else if (stage === 2) {
    gg.scale.set(1.01, 1.01, 1.01);
  } else {
    gg.scale.set(1, 1, 1);
  }
}
