import * as THREE from 'three';
import { assetPath } from '@/lib/portfolio';
import { createAnimationLoop } from '@/lib/animation-loop';
import type { DreamInput } from './dream-scene';

export type DreamRenderer = {
  setMotion: (value: boolean) => void;
  dispose: () => void;
};

export async function mountDreamRenderer(
  container: HTMLElement,
  input: () => DreamInput,
  motion: () => boolean,
  onReady: (value: boolean) => void,
  signal: AbortSignal,
): Promise<DreamRenderer | null> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0, 0);
  container.appendChild(renderer.domElement);
  const textures: THREE.Texture[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  let disposed = false;
  let cleanupScene = () => {};
  function dispose() {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener('abort', dispose);
    cleanupScene();
    geometries.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    textures.forEach((item) => item.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  }
  signal.addEventListener('abort', dispose, { once: true });
  const loader = new THREE.TextureLoader();
  async function load(path: string) {
    const texture = await loader.loadAsync(assetPath(`hero/${path}.webp`));
    if (disposed) texture.dispose();
    else {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy(),
      );
      textures.push(texture);
    }
    return texture;
  }
  try {
    const [backTexture, babyTexture, frontTexture, cloudTexture] =
      await Promise.all([
        load('blanket-back'),
        load('baby-layer'),
        load('blanket-front'),
        load('cloud'),
      ]);
    if (disposed || signal.aborted) {
      dispose();
      return null;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    const nest = new THREE.Group();
    scene.add(nest);
    const clock = { value: 0 };
    function layer(
      texture: THREE.Texture,
      depth: number,
      order: number,
      cloth = false,
    ) {
      const geometry = new THREE.PlaneGeometry(1, 1, 48, 48);
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i),
          y = positions.getY(i);
        positions.setZ(
          i,
          Math.exp(-(x * x * 8 + y * y * 7)) * (cloth ? 0.045 : 0.025),
        );
      }
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.035,
      });
      material.onBeforeCompile = (shader) => {
        // Neutral background key: generated RGB plates keep their source pixels;
        // matting happens only in the renderer, preserving warm skin/fleece.
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\ndiffuseColor.a *= smoothstep(0.014, 0.075, diffuseColor.r - diffuseColor.b);',
        );
        if (!cloth) return;
        shader.uniforms.uBreath = clock;
        shader.vertexShader = 'uniform float uBreath;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nfloat fold = smoothstep(-0.5, 0.0, position.y);\ntransformed.z += sin(uBreath * 1.12) * 0.008 * fold;\ntransformed.y += sin(uBreath * 1.12) * 0.002 * fold;',
        );
      };
      material.customProgramCacheKey = () =>
        cloth ? 'dream-fleece-key' : 'dream-baby-key';
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = depth;
      mesh.renderOrder = order;
      nest.add(mesh);
      geometries.push(geometry);
      materials.push(material);
      return { mesh, material, depth };
    }
    const layers = [
      layer(backTexture, -0.095, 2),
      layer(babyTexture, 0.025, 3),
      layer(frontTexture, 0.145, 4, true),
    ];
    const cloudGeometry = new THREE.PlaneGeometry(1, 1 / 3, 16, 5);
    geometries.push(cloudGeometry);
    const clouds = [
      { x: -0.73, y: 0.51, z: -3.8, size: 0.46, roll: -0.07 },
      { x: 0.61, y: 0.35, z: -2.8, size: 0.35, roll: 0.05 },
      { x: 0.4, y: -0.25, z: -0.8, size: 0.62, roll: -0.04 },
      { x: -0.55, y: -0.36, z: 1.35, size: 0.92, roll: 0.08 },
      { x: 0.56, y: -0.4, z: 1.95, size: 1.04, roll: -0.08 },
      { x: -0.1, y: -0.39, z: 2.45, size: 1.55, roll: 0.02 },
    ].map((config, index) => {
      const material = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        depthWrite: false,
        opacity: index < 2 ? 0.83 : 0.98,
      });
      const mesh = new THREE.Mesh(cloudGeometry, material);
      mesh.renderOrder = index < 3 ? 1 : 5 + index;
      scene.add(mesh);
      materials.push(material);
      return { ...config, mesh };
    });
    let width = 1,
      height = 1,
      worldWidth = 1,
      worldHeight = 1;
    let visible = false,
      contextLost = false,
      presented = false;
    let x = 0,
      y = 0,
      progress = 0,
      targetProgress = 0;
    let lastTime = 0;
    const section = container.closest('.dream-section') as HTMLElement | null;
    function updateProgress() {
      targetProgress = section
        ? THREE.MathUtils.clamp(
            -section.getBoundingClientRect().top /
              Math.max(1, section.offsetHeight - height),
            0,
            1,
          )
        : 0;
    }
    const animation = createAnimationLoop((elapsed) => {
      const dt = Math.min(50, Math.max(8, elapsed - lastTime));
      lastTime = elapsed;
      if (motion()) {
        const ease = 1 - Math.exp(-dt / 180);
        const point = input();
        x += (point.x - x) * ease;
        y += (point.y - y) * ease;
        progress += (targetProgress - progress) * (1 - Math.exp(-dt / 100));
      } else {
        x = y = progress = 0;
      }
      clock.value = elapsed / 1000;
      const mobile = width < 800;
      const landscape = width / height > 1.2 && height < 550;
      const nestSize = landscape
        ? Math.min(worldWidth * 0.48, worldHeight * 0.83)
        : mobile
          ? Math.min(
              worldWidth * 0.99,
              worldHeight * (height < 700 ? 0.46 : 0.53),
            )
          : Math.min(worldWidth * 0.58, worldHeight * 0.9);
      camera.position.set(x * 0.23, y * 0.13, 8 - progress * 0.85);
      camera.lookAt(0, 0, 0);
      nest.position.set(
        mobile && !landscape ? 0 : worldWidth * 0.215,
        mobile && !landscape
          ? -worldHeight * (height < 700 ? 0.18 : 0.09)
          : -worldHeight * 0.015,
        progress * 0.15,
      );
      nest.scale.setScalar(nestSize);
      nest.rotation.set(
        y * 0.035,
        x * 0.055 + progress * 0.07,
        -0.035 + x * 0.016 + progress * 0.055,
      );
      layers.forEach(({ mesh, material, depth }, index) => {
        const registration = index === 1 ? 0.67 : 1;
        mesh.scale.setScalar(((8 - depth * nestSize) / 8) * registration);
        mesh.position.x = index === 1 ? 0.01 : 0;
        mesh.position.y = index === 1 ? 0.095 : 0;
        material.opacity = Math.max(0, 1 - Math.max(0, progress - 0.76) * 4.2);
      });
      clouds.forEach((cloud, index) => {
        const near = index >= 3;
        const intensity = near ? 1 + (index - 3) * 0.22 : 0.35 + index * 0.1;
        const side = index % 2 ? 1 : -1;
        const idle = motion()
          ? Math.sin(elapsed / 7500 + index * 1.7) * 0.025
          : 0;
        cloud.mesh.position.set(
          worldWidth * cloud.x +
            x * 0.48 * intensity +
            progress * side * (near ? 0.7 : 0.25),
          worldHeight * (cloud.y - (!mobile && near ? 0.14 : 0)) +
            y * 0.25 * intensity +
            idle +
            progress * worldHeight * (near ? 0.42 : 0.04),
          cloud.z,
        );
        cloud.mesh.scale.setScalar(worldWidth * cloud.size);
        cloud.mesh.rotation.set(
          y * 0.17 * intensity,
          -x * 0.2 * intensity,
          cloud.roll + x * 0.085 * intensity + progress * side * 0.07,
        );
      });
      try {
        renderer.render(scene, camera);
        if (!presented) {
          presented = true;
          onReady(true);
        }
      } catch {
        animation.setVisible(false);
        onReady(false);
      }
    });
    function resize() {
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio || 1,
          width < 800 ? 2.75 : 2,
          Math.sqrt(5_500_000 / (width * height)),
        ),
      );
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      worldHeight = 2 * Math.tan((35 * Math.PI) / 360) * 8;
      worldWidth = worldHeight * camera.aspect;
      updateProgress();
      animation.invalidate();
    }
    const onScroll = () => {
      updateProgress();
      animation.invalidate();
    };
    const syncVisibility = () =>
      animation.setVisible(visible && !document.hidden && !contextLost);
    const onLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      presented = false;
      syncVisibility();
      onReady(false);
    };
    const onRestored = () => {
      contextLost = false;
      syncVisibility();
      animation.invalidate();
    };
    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncVisibility();
      },
      { rootMargin: '60px' },
    );
    cleanupScene = () => {
      animation.dispose();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', syncVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        onRestored,
      );
    };
    resizeObserver.observe(container);
    visibilityObserver.observe(container);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', syncVisibility);
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    animation.setActive(motion());
    resize();
    return { setMotion: (value) => animation.setActive(value), dispose };
  } catch {
    dispose();
    return null;
  }
}
