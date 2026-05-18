import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createVivariumRenderer(renderer, scene, camera, reducedMotion) {
  if (reducedMotion) {
    return {
      renderFrame() {
        renderer.render(scene, camera);
      },
      onResize() {},
    };
  }

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55,
    0.45,
    0.15
  );
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  return {
    renderFrame() {
      composer.render();
    },
    onResize(width, height) {
      composer.setSize(width, height);
      bloomPass.setSize(width, height);
    },
  };
}
