import * as THREE from 'three';
import { assetPath } from '@/lib/portfolio';
import { createAnimationLoop } from '@/lib/animation-loop';
import { meadowJourney } from '@/lib/flower-motion';
import { createMeadowFlowers } from './meadow-flowers';
import type { MeadowInput } from './meadow-scene';

export type MeadowRenderer = {
  setMotion: (value: boolean) => void;
  dispose: () => void;
};

/** Photograph in the distance, independent geometry and spring motion nearby. */
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
      antialias: true,
      powerPreference: 'default',
    });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
  const textures = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const scene = new THREE.Scene();
  const garden = new THREE.Scene();
  garden.fog = new THREE.Fog('#c5d4ae', 12, 26);
  const perspective = new THREE.PerspectiveCamera(46, 1, 0.1, 40);
  perspective.position.set(0, 1.7, 10);
  const sky = new THREE.HemisphereLight('#eaf4ff', '#708342', 2.4);
  const sun = new THREE.DirectionalLight('#fff0d3', 2.8);
  sun.position.set(-5, 8, 5);
  const fill = new THREE.DirectionalLight('#e2f3ff', 0.65);
  fill.position.set(5, 3, -2);
  garden.add(sky, sun, fill);
  const flowers = createMeadowFlowers(
    garden,
    window.matchMedia('(pointer: coarse)').matches || innerWidth < 800,
  );
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
    toneMapped: false,
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
  const surface = container.closest<HTMLElement>('.meadow-sticky');
  const view = new THREE.Vector2();
  const targetView = new THREE.Vector2();
  const lookAt = new THREE.Vector3();
  const lastBrush = { x: 0, y: 0 };
  const nextBrush = { x: 0, y: 0 };
  let brushing = false;
  const animation = createAnimationLoop((elapsed) => {
    if (!uniforms.uImage.value || lost) return;
    const delta = Math.min(50, Math.max(0, elapsed - previousTime));
    previousTime = elapsed;
    const amount = 1 - Math.exp(-delta / 180);
    const point = motion() ? input() : { x: 0, y: 0 };
    targetView.set(point.x, point.y);
    view.lerp(targetView, motion() ? amount : 1);
    uniforms.uPointer.value.copy(view);
    uniforms.uProgress.value +=
      ((motion() ? targetProgress : 0) - uniforms.uProgress.value) *
      (motion() ? amount : 1);
    uniforms.uTime.value = elapsed / 1000;
    uniforms.uMotion.value = motion() ? 1 : 0;
    const journey = meadowJourney(uniforms.uProgress.value);
    perspective.position.set(
      view.x * 0.3,
      1.7 - journey.travel * 0.34 + view.y * 0.13,
      10 - journey.travel * 2.15,
    );
    lookAt.set(view.x * 0.08, 1.46 - journey.travel * 0.68, -1.5);
    perspective.lookAt(lookAt);
    perspective.rotation.z = -view.x * 0.017;
    perspective.updateMatrixWorld();
    flowers.update(
      elapsed / 1000,
      delta / 1000,
      view,
      journey.travel,
      journey.open,
      motion(),
    );
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(garden, perspective);
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
    flowers.dispose();
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
    perspective.aspect = width / height;
    perspective.updateProjectionMatrix();
    flowers.resize(width, height);
    cover();
    progress();
  }
  function visibility() {
    if (!visible || document.hidden) brushing = false;
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
  function brush(event: PointerEvent) {
    if (!motion() || !surface || !visible || lost) return;
    if ((event.target as Element).closest('a, button, nav')) {
      brushing = false;
      return;
    }
    const rect = surface.getBoundingClientRect();
    nextBrush.x = event.clientX - rect.left;
    nextBrush.y = event.clientY - rect.top;
    if (!brushing || event.type === 'pointerdown') {
      lastBrush.x = nextBrush.x;
      lastBrush.y = nextBrush.y;
    }
    flowers.stroke(lastBrush, nextBrush, perspective);
    lastBrush.x = nextBrush.x;
    lastBrush.y = nextBrush.y;
    brushing = true;
  }
  function release() {
    brushing = false;
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
    surface?.removeEventListener('pointerdown', brush);
    surface?.removeEventListener('pointermove', brush);
    surface?.removeEventListener('pointerleave', release);
    surface?.removeEventListener('pointerup', release);
    surface?.removeEventListener('pointercancel', release);
  };
  observer.observe(container);
  intersection.observe(container);
  window.addEventListener('scroll', progress, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  portrait.addEventListener('change', selectImage);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);
  surface?.addEventListener('pointerdown', brush, { passive: true });
  surface?.addEventListener('pointermove', brush, { passive: true });
  surface?.addEventListener('pointerleave', release);
  surface?.addEventListener('pointerup', release);
  surface?.addEventListener('pointercancel', release);
  animation.setActive(motion());
  resize();
  await selectImage();
  return disposed
    ? null
    : {
        setMotion: (value) => {
          brushing = false;
          progress();
          animation.setActive(value);
        },
        dispose,
      };
}
