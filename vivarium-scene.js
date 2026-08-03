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
  /* Threshold must sit ABOVE the background's luminance or the whole frame
   * blooms. The original 0.15 was tuned for a near-black habitat; against the
   * mid-key dawn background (luminance ~0.41) every pixel exceeded it and the
   * scene saturated to pure white. 0.82 lets only the creature glows bloom. */
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.38,
    0.40,
    0.82
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
