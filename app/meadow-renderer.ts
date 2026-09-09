import * as THREE from 'three';
import { assetPath } from '@/lib/portfolio';
import { createAnimationLoop } from '@/lib/animation-loop';
import type { MeadowInput } from './meadow-scene';

export type MeadowRenderer = {
  setMotion: (value: boolean) => void;
  dispose: () => void;
};

/** Photo-based depth and a restrained wind displacement; no color-key cutouts. */
export async function mountMeadowRenderer(
  container: HTMLElement,
  input: () => MeadowInput,
  motion: () => boolean,
  onReady: (value: boolean) => void,
  signal: AbortSignal,
): Promise<MeadowRenderer | null> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'low-power',
    });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const textures = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    uImage: { value: null as THREE.Texture | null },
    uCover: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uMotion: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      uniform sampler2D uImage;
      uniform vec2 uCover, uPointer;
      uniform float uTime, uProgress, uMotion;
      varying vec2 vUv;
      void main() {
        vec2 uv = (vUv - .5) * uCover * (.96 - uProgress * .035) + .5;
        float nearField = 1. - smoothstep(.06, .66, uv.y);
        float gust = sin(uv.x * 13. + uTime * .65) * sin(uv.y * 9. - uTime * .43);
        uv.x += uCover.x * nearField * (.0018 * gust * uMotion + uPointer.x * .008);
        uv.y += uCover.y * (nearField * uPointer.y * .004 + uProgress * .008);
        gl_FragColor = texture2D(uImage, uv);
        #include <colorspace_fragment>
      }`,
    depthWrite: false,
    depthTest: false,
  });
  scene.add(new THREE.Mesh(geometry, material));
  let disposed = false,
    visible = false,
    lost = false,
    presented = false;
  let targetProgress = 0,
    previousTime = 0,
    request = 0;
  let width = 1,
    height = 1;
  let cleanListeners = () => {};
  const portrait = window.matchMedia(
    '(max-width: 799px) and (orientation: portrait)',
  );
  const section = container.closest('.meadow-section');
  const animation = createAnimationLoop((elapsed) => {
    if (!uniforms.uImage.value || lost) return;
    const delta = Math.min(50, Math.max(8, elapsed - previousTime));
    previousTime = elapsed;
    const amount = 1 - Math.exp(-delta / 180);
    const point = motion() ? input() : { x: 0, y: 0 };
    uniforms.uPointer.value.lerp(
      new THREE.Vector2(point.x, point.y),
      motion() ? amount : 1,
    );
    uniforms.uProgress.value +=
      ((motion() ? targetProgress : 0) - uniforms.uProgress.value) *
      (motion() ? amount : 1);
    uniforms.uTime.value = elapsed / 1000;
    uniforms.uMotion.value = motion() ? 1 : 0;
    renderer.render(scene, camera);
    if (!presented) {
      presented = true;
      onReady(true);
    }
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener('abort', dispose);
    animation.dispose();
    cleanListeners();
    geometry.dispose();
    material.dispose();
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  }
  signal.addEventListener('abort', dispose, { once: true });
  function cover() {
    const image = uniforms.uImage.value?.image as HTMLImageElement | undefined;
    if (!image) return;
    const imageAspect = image.width / image.height;
    const screenAspect = width / height;
    uniforms.uCover.value.set(
      Math.min(1, screenAspect / imageAspect),
      Math.min(1, imageAspect / screenAspect),
    );
  }
  async function selectImage() {
    const version = ++request;
    const name = portrait.matches ? 'portrait' : 'landscape';
    let texture = textures.get(name);
    try {
      if (!texture) {
        texture = await loader.loadAsync(assetPath(`meadow/${name}.webp`));
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        textures.set(name, texture);
      }
      if (disposed || version !== request) return;
      uniforms.uImage.value = texture;
      cover();
      animation.invalidate();
    } catch {
      if (!disposed && version === request) {
        presented = false;
        onReady(false);
        uniforms.uImage.value = null;
      }
    }
  }
  function progress() {
    targetProgress = section
      ? THREE.MathUtils.clamp(
          -section.getBoundingClientRect().top /
            Math.max(1, section.clientHeight - height),
          0,
          1,
        )
      : 0;
    animation.invalidate();
  }
  function resize() {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.sqrt(4_000_000 / (width * height)),
      ),
    );
    renderer.setSize(width, height, false);
    cover();
    progress();
  }
  function visibility() {
    animation.setVisible(visible && !document.hidden && !lost);
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    presented = false;
    onReady(false);
    visibility();
  }
  function restored() {
    lost = false;
    visibility();
    animation.invalidate();
  }
  const observer = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      visibility();
    },
    { rootMargin: '40px' },
  );
  cleanListeners = () => {
    observer.disconnect();
    intersection.disconnect();
    window.removeEventListener('scroll', progress);
    document.removeEventListener('visibilitychange', visibility);
    portrait.removeEventListener('change', selectImage);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', restored);
  };
  observer.observe(container);
  intersection.observe(container);
  window.addEventListener('scroll', progress, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  portrait.addEventListener('change', selectImage);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);
  animation.setActive(motion());
  resize();
  await selectImage();
  return disposed
    ? null
    : { setMotion: (value) => animation.setActive(value), dispose };
}
