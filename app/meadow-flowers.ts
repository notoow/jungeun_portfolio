import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  stepFlower,
  strokeFlower,
  strokeInfluence,
  type FlowerSpring,
  type BrushPoint,
} from '@/lib/flower-motion';

type Flower = {
  u: number;
  x: number;
  y: number;
  z: number;
  height: number;
  scale: number;
  size: number;
  phase: number;
  kind: number;
  index: number;
  lean: number;
  spring: FlowerSpring;
};

/** Curved, ribbed petals. Geometry is shared by every flower of a species. */
function petalGeometry(wide: boolean) {
  const vertices: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rows = 14,
    columns = 8;
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const width =
      Math.pow(Math.sin(Math.PI * t), wide ? 0.38 : 0.5) *
      (wide ? 0.27 : 0.105);
    for (let c = 0; c <= columns; c++) {
      const s = (c / columns) * 2 - 1;
      vertices.push(
        s * width,
        0.12 + t * (wide ? 0.56 : 0.66),
        0.11 * Math.sin(t * Math.PI) -
          0.065 * t * t +
          s * s * 0.055 * Math.sin(t * Math.PI) +
          Math.cos(s * Math.PI * 4) * Math.sin(t * Math.PI) * 0.004,
      );
      uv.push(c / columns, t);
      if (r < rows && c < columns) {
        const a = r * (columns + 1) + c,
          b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function blossomGeometry(wide: boolean) {
  const petal = petalGeometry(wide),
    parts: THREE.BufferGeometry[] = [];
  const count = wide ? 9 : 21;
  for (let i = 0; i < count; i++) {
    const part = petal.clone();
    part.scale(1, 0.94 + Math.sin(i * 7.2) * 0.08, 1);
    part.rotateX(Math.sin(i * 2.1) * 0.11);
    part.rotateZ((i / count) * Math.PI * 2);
    parts.push(part);
  }
  const result = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  petal.dispose();
  return result;
}

function seedGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.SphereGeometry(1, 5, 4);
  for (let i = 0; i < 115; i++) {
    const r = Math.sqrt(i / 115) * 0.158,
      theta = i * 2.399963;
    const seed = base.clone();
    seed.scale(0.014, 0.014, 0.021);
    seed.translate(
      Math.cos(theta) * r,
      Math.sin(theta) * r,
      0.068 * Math.sqrt(1 - (r / 0.17) ** 2),
    );
    parts.push(seed);
  }
  const result = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  base.dispose();
  return result;
}

export function createMeadowFlowers(scene: THREE.Scene, mobile: boolean) {
  const count = mobile ? 42 : 78;
  let seed = 8037;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const clock = { value: 0 },
    enabled = { value: 1 };
  const materials: THREE.Material[] = [],
    geometries: THREE.BufferGeometry[] = [],
    meshes: THREE.InstancedMesh[] = [];
  const flowers: Flower[] = [];
  const species = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const kind = i % 7 === 0 ? 1 : i % 9 === 0 ? 2 : 0;
    const z = -3.5 + random() * 7.3;
    const y = -0.8 + random() * 1.7 - Math.max(0, z - 1) * 0.13;
    flowers.push({
      u: ((i / (count - 1)) * 2 - 1) * 1.16,
      x: 0,
      y,
      z,
      height: y + 4.2,
      scale: 1,
      size: 0.24 + random() * 0.2 + Math.max(z, 0) * 0.032,
      phase: random() * Math.PI * 2,
      kind,
      index: species[kind]++,
      lean: -0.35 - random() * 0.85,
      spring: { x: 0, z: 0, vx: 0, vz: 0 },
    });
  }
  function instances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    amount: number,
  ) {
    geometries.push(geometry);
    materials.push(material);
    const mesh = new THREE.InstancedMesh(geometry, material, amount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }
  function petalMaterial() {
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.84,
      metalness: 0,
      side: THREE.DoubleSide,
      vertexColors: false,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFlowerTime = clock;
      shader.uniforms.uFlowerMotion = enabled;
      shader.vertexShader =
        `uniform float uFlowerTime, uFlowerMotion; varying vec2 vPetalUv;\n${shader.vertexShader}`.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vPetalUv = uv;
          transformed.z += sin(uFlowerTime * 2.2 + position.y * 9. + instanceMatrix[3].x) * .018 * uv.y * uv.y * uFlowerMotion;`,
        );
      shader.fragmentShader =
        `varying vec2 vPetalUv;\n${shader.fragmentShader}`.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float ribs = pow(.5 + .5 * cos(vPetalUv.x * 56.), 8.) * .045 * sin(vPetalUv.y * 3.14159);
          diffuseColor.rgb *= 1. - ribs;
          diffuseColor.rgb *= mix(vec3(.79, .72, .43), vec3(1.), smoothstep(0., .45, vPetalUv.y));`,
        );
    };
    return material;
  }
  const heads = species.map((n, kind) =>
    instances(blossomGeometry(kind === 1), petalMaterial(), n),
  );
  const discs = instances(
    new THREE.SphereGeometry(0.17, 16, 8),
    new THREE.MeshStandardMaterial({ color: '#c99220', roughness: 1 }),
    count,
  );
  const seeds = instances(
    seedGeometry(),
    new THREE.MeshStandardMaterial({ color: '#e6b53a', roughness: 0.95 }),
    count,
  );
  const stemGeometry = new THREE.CylinderGeometry(
    0.014,
    0.019,
    1,
    6,
    12,
  ).translate(0, 0.5, 0);
  const bends = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 2),
    2,
  ).setUsage(THREE.DynamicDrawUsage);
  const lengths = new THREE.InstancedBufferAttribute(
    new Float32Array(flowers.map((f) => f.height)),
    1,
  );
  stemGeometry.setAttribute('aBend', bends);
  stemGeometry.setAttribute('aLength', lengths);
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: '#6b8941',
    roughness: 0.95,
  });
  stemMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader =
      `attribute vec2 aBend; attribute float aLength;\n${shader.vertexShader}`
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
        objectNormal.y -= 2. * position.y * dot(aBend, objectNormal.xz) / aLength;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
        transformed.xz += aBend * position.y * position.y;`,
        );
  };
  const stems = instances(stemGeometry, stemMaterial, count);
  const leaf = petalGeometry(true);
  leaf.scale(0.25, 1.1, 0.8);
  const leaves = instances(
    leaf,
    new THREE.MeshStandardMaterial({
      color: '#547536',
      roughness: 0.92,
      side: THREE.DoubleSide,
    }),
    count * 3,
  );
  const colors = ['#fff8e8', '#e5a7b4', '#f5d872'];
  const color = new THREE.Color();
  flowers.forEach((f, i) => {
    color.set(colors[f.kind]).multiplyScalar(0.88 + random() * 0.12);
    heads[f.kind].setColorAt(f.index, color);
    color.setHSL(0.24 + random() * 0.04, 0.3, 0.64 + random() * 0.14);
    stems.setColorAt(i, color);
    for (let k = 0; k < 3; k++) leaves.setColorAt(i * 3 + k, color);
  });
  const object = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  const headMatrix = new THREE.Matrix4();
  const projected = new THREE.Vector3();
  const point = { x: 0, y: 0 };
  let screenWidth = 1,
    screenHeight = 1;

  return {
    resize(width: number, height: number) {
      screenWidth = width;
      screenHeight = height;
      const aspect = width / height;
      const spread = Math.tan(THREE.MathUtils.degToRad(46) / 2) * 10 * aspect;
      flowers.forEach((f) => {
        f.x = (f.u * spread * (10 - f.z)) / 10;
        f.scale = f.size * (aspect < 0.8 ? 0.78 : 1);
      });
    },
    stroke(from: BrushPoint, to: BrushPoint, camera: THREE.Camera) {
      const dx = to.x - from.x,
        dy = to.y - from.y;
      flowers.forEach((f) => {
        projected.set(f.x + f.spring.x, f.y, f.z + f.spring.z).project(camera);
        if (projected.z < -1 || projected.z > 1) return;
        point.x = (projected.x * 0.5 + 0.5) * screenWidth;
        point.y = (-projected.y * 0.5 + 0.5) * screenHeight;
        const influence = strokeInfluence(
          point,
          from,
          to,
          screenWidth < 800 ? 74 : 98,
        );
        strokeFlower(f.spring, influence, dx, dy);
      });
    },
    update(
      time: number,
      dt: number,
      view: { x: number; y: number },
      travel: number,
      open: number,
      motion: boolean,
    ) {
      clock.value = time;
      enabled.value = motion ? 1 : 0;
      flowers.forEach((f, i) => {
        const wind = motion
          ? Math.sin(time * 0.75 + f.phase + f.z * 0.3) * 0.075 +
            Math.sin(time * 1.2 + f.x * 0.7) * 0.045
          : 0;
        const part =
          Math.sign(f.x || 1) * open * (0.25 + Math.max(0, f.z) * 0.24);
        const restX = Math.sin(f.phase) * 0.28;
        const restZ = Math.cos(f.phase) * 0.14;
        const tx = restX + wind + view.x * 0.25 + part;
        const tz = restZ + wind * 0.35 + view.y * 0.18;
        if (motion) stepFlower(f.spring, tx, tz, dt);
        else Object.assign(f.spring, { x: restX, z: restZ, vx: 0, vz: 0 });
        const bx = f.spring.x,
          bz = f.spring.z;
        bends.setXY(i, bx, bz);
        object.position.set(f.x, -4.2, f.z);
        object.rotation.set(0, 0, 0);
        object.scale.set(1, f.height, 1);
        object.updateMatrix();
        stems.setMatrixAt(i, object.matrix);
        object.position.set(f.x + bx, f.y, f.z + bz);
        object.rotation.set(
          f.lean + bz * 0.16,
          bx * 0.12 + Math.sin(f.phase) * 0.24,
          -bx * 0.25 + Math.sin(f.phase) * 0.2,
        );
        const scale = f.scale * (1 + travel * 0.08);
        object.scale.setScalar(scale);
        object.updateMatrix();
        headMatrix.copy(object.matrix);
        heads[f.kind].setMatrixAt(f.index, headMatrix);
        matrix.makeScale(1, 1, 0.42).premultiply(headMatrix);
        discs.setMatrixAt(i, matrix);
        seeds.setMatrixAt(i, headMatrix);
        for (let k = 0; k < 3; k++) {
          const t = 0.47 + k * 0.15;
          object.position.set(
            f.x + bx * t * t,
            -4.2 + f.height * t,
            f.z + bz * t * t,
          );
          object.rotation.set(
            -0.45 + Math.sin(f.phase + k) * 0.5,
            f.phase + k * 2.4,
            (k % 2 ? 1 : -1) * 0.8 - bx * 0.13,
          );
          object.scale.setScalar(0.43 + f.scale * 0.5);
          object.updateMatrix();
          leaves.setMatrixAt(i * 3 + k, object.matrix);
        }
      });
      bends.needsUpdate = true;
      meshes.forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true;
      });
    },
    dispose() {
      meshes.forEach((mesh) => {
        scene.remove(mesh);
        mesh.dispose();
      });
      new Set(geometries).forEach((g) => g.dispose());
      new Set(materials).forEach((m) => m.dispose());
    },
  };
}
