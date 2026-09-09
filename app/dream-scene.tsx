'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { assetPath } from '@/lib/portfolio';
import { createAnimationLoop } from '@/lib/animation-loop';

export type DreamInput = { x: number; y: number };

/** A rendered character on a subtly curved WebGL surface, not a rigged model.
 * Actual perspective camera, depth-separated clouds and masked cloth breathing.
 * The HTML image stays available when WebGL is unavailable or loses context. */
export default function DreamScene({
  motion,
  input,
}: {
  motion: boolean;
  input: RefObject<DreamInput>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const enabled = useRef(motion);
  const loop = useRef<ReturnType<typeof createAnimationLoop> | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    enabled.current = motion;
    loop.current?.setActive(motion);
  }, [motion]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let stopped = false;
    let cleanup = () => {};
    void import('three')
      .then(async (THREE) => {
        if (stopped) return;
        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
          });
        } catch {
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0, 0);
        container.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.z = 8;
        const loader = new THREE.TextureLoader();
        const textures: InstanceType<typeof THREE.Texture>[] = [];
        let abandoned = false;
        const loadTexture = async (path: string) => {
          const texture = await loader.loadAsync(assetPath(path));
          if (stopped || abandoned) texture.dispose();
          else textures.push(texture);
          return texture;
        };
        try {
          const [babyTexture, cloudTexture] = await Promise.all([
            loadTexture('hero/sleeping-baby.webp'),
            loadTexture('hero/cloud.webp'),
          ]);
          if (stopped) {
            textures.forEach((t) => t.dispose());
            renderer.dispose();
            renderer.domElement.remove();
            return;
          }
          textures.forEach((t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = Math.min(
              4,
              renderer.capabilities.getMaxAnisotropy(),
            );
          });
          const geometry = new THREE.PlaneGeometry(1, 1, 64, 64);
          const positions = geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i),
              y = positions.getY(i);
            positions.setZ(i, 0.13 * Math.exp(-(x * x * 6 + y * y * 5)));
          }
          const material = new THREE.MeshBasicMaterial({
            map: babyTexture,
            transparent: true,
            depthWrite: false,
          });
          const time = { value: 0 };
          material.onBeforeCompile = (shader) => {
            shader.uniforms.uDreamTime = time;
            shader.vertexShader =
              'uniform float uDreamTime;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\nfloat cloth = 1.0 - smoothstep(-0.24, 0.22, position.y);\ntransformed.z += sin(uDreamTime * 1.15) * 0.005 * cloth;\ntransformed.y += sin(uDreamTime * 1.15) * 0.0018 * cloth;',
            );
          };
          const baby = new THREE.Mesh(geometry, material);
          baby.renderOrder = 2;
          scene.add(baby);
          const cloudGeometry = new THREE.PlaneGeometry(1, 1 / 3);
          const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.96,
            depthWrite: false,
          });
          const configs = [
            [-0.48, 0.3, -1.8, 0.55, 0],
            [0.47, 0.43, -2.5, 0.43, 0],
            [-0.45, -0.45, 1.1, 0.9, 3],
            [0.49, -0.47, 0.65, 0.93, 3],
            [0.02, -0.67, 1.4, 1.48, 4],
          ];
          const clouds = configs.map((c) => {
            const mesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            mesh.renderOrder = c[4];
            scene.add(mesh);
            return mesh;
          });
          let width = 1,
            height = 1,
            worldWidth = 1,
            worldHeight = 1;
          let visible = false,
            contextLost = false,
            presented = false,
            currentX = 0,
            currentY = 0,
            currentP = 0;
          const section = container.closest(
            '.dream-section',
          ) as HTMLElement | null;
          let targetP = 0;
          const updateProgress = () => {
            targetP = section
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    -section.getBoundingClientRect().top /
                      Math.max(1, section.offsetHeight - height),
                  ),
                )
              : 0;
          };
          const resize = () => {
            width = container.clientWidth;
            height = container.clientHeight;
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            worldHeight = 2 * Math.tan((35 * Math.PI) / 360) * 8;
            worldWidth = worldHeight * camera.aspect;
            updateProgress();
            animation.invalidate();
          };
          const onScroll = () => {
            updateProgress();
            animation.invalidate();
          };
          const onContextLost = (event: Event) => {
            event.preventDefault();
            contextLost = true;
            presented = false;
            animation.setVisible(false);
            setReady(false);
          };
          const syncVisibility = () => {
            animation.setVisible(visible && !document.hidden && !contextLost);
          };
          const onContextRestored = () => {
            contextLost = false;
            syncVisibility();
            animation.invalidate();
          };
          function draw(elapsed: number) {
            if (stopped) return;
            const animate = enabled.current;
            if (animate) {
              currentP += (targetP - currentP) * 0.08;
              currentX += (input.current.x - currentX) * 0.045;
              currentY += (input.current.y - currentY) * 0.045;
            } else {
              currentP = currentX = currentY = 0;
            }
            time.value = elapsed / 1000;
            const mobile = width < 800;
            const size = mobile
              ? Math.min(worldWidth * 1.14, worldHeight * 0.65)
              : Math.min(worldWidth * 0.59, worldHeight * 0.94);
            baby.scale.setScalar(size * (1 + currentP * 0.18));
            baby.position.set(
              (mobile ? 0 : worldWidth * 0.205) + currentX * 0.065,
              (mobile ? -worldHeight * 0.075 : -worldHeight * 0.005) +
                currentY * 0.045 +
                currentP * 0.64,
              0.1,
            );
            baby.rotation.set(
              currentY * 0.025,
              currentX * 0.035,
              -0.06 + currentP * 0.11 + currentX * 0.006,
            );
            material.opacity = Math.max(
              0,
              1 - Math.max(0, currentP - 0.72) * 3.5,
            );
            clouds.forEach((cloud, i) => {
              const c = configs[i];
              cloud.scale.setScalar(worldWidth * c[3]);
              cloud.position.set(
                worldWidth * c[0] +
                  currentX * (i < 2 ? 0.12 : 0.27) +
                  currentP * (i % 2 ? 1 : -1) * 0.45,
                worldHeight * c[1] +
                  currentY * 0.12 +
                  currentP * (i < 2 ? 0.1 : worldHeight * 0.39),
                c[2],
              );
            });
            renderer.render(scene, camera);
            if (!presented) {
              presented = true;
              setReady(true);
            }
          }
          const animation = createAnimationLoop(draw);
          loop.current = animation;
          animation.setActive(enabled.current);
          const ro = new ResizeObserver(resize);
          ro.observe(container);
          resize();
          const io = new IntersectionObserver(
            (entries) => {
              visible = entries[0].isIntersecting;
              syncVisibility();
            },
            { rootMargin: '80px' },
          );
          io.observe(container);
          window.addEventListener('scroll', onScroll, { passive: true });
          document.addEventListener('visibilitychange', syncVisibility);
          renderer.domElement.addEventListener(
            'webglcontextlost',
            onContextLost,
          );
          renderer.domElement.addEventListener(
            'webglcontextrestored',
            onContextRestored,
          );
          cleanup = () => {
            animation.dispose();
            if (loop.current === animation) loop.current = null;
            ro.disconnect();
            io.disconnect();
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('visibilitychange', syncVisibility);
            renderer.domElement.removeEventListener(
              'webglcontextlost',
              onContextLost,
            );
            renderer.domElement.removeEventListener(
              'webglcontextrestored',
              onContextRestored,
            );
            geometry.dispose();
            cloudGeometry.dispose();
            material.dispose();
            cloudMaterial.dispose();
            textures.forEach((t) => t.dispose());
            renderer.dispose();
            renderer.domElement.remove();
          };
        } catch {
          abandoned = true;
          cleanup();
          textures.forEach((t) => t.dispose());
          renderer.dispose();
          renderer.domElement.remove();
        }
      })
      .catch(() => {
        /* Keep the accessible image if the renderer cannot load. */
      });
    return () => {
      stopped = true;
      cleanup();
    };
  }, [input]);

  return (
    <div className={`dream-art ${ready ? 'is-webgl' : ''}`}>
      <div className="dream-fallback">
        <img
          className="fallback-baby"
          src={assetPath('hero/sleeping-baby.webp')}
          width="1254"
          height="1254"
          alt="하늘 위, 흰 담요에 포근히 싸여 잠든 아기"
          fetchPriority="high"
        />
        <img
          className="fallback-cloud cloud-left"
          src={assetPath('hero/cloud.webp')}
          width="2172"
          height="724"
          alt=""
        />
        <img
          className="fallback-cloud cloud-right"
          src={assetPath('hero/cloud.webp')}
          width="2172"
          height="724"
          alt=""
        />
      </div>
      <div className="dream-canvas" ref={host} aria-hidden="true" />
    </div>
  );
}
