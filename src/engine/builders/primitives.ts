import * as THREE from 'three';
import type { Obstacle } from '@/types';

export interface BoxOptions {
  size: [number, number, number];
  position: [number, number, number];
  material: THREE.Material;
  rotationY?: number;
  castShadow?: boolean;
  solid?: boolean;
}

export function addBox(
  scene: THREE.Scene,
  obstacles: Obstacle[],
  options: BoxOptions,
): THREE.Mesh {
  const [w, h, d] = options.size;
  const [x, y, z] = options.position;
  const rotationY = options.rotationY ?? 0;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), options.material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  mesh.castShadow = options.castShadow ?? false;
  mesh.receiveShadow = true;
  scene.add(mesh);

  if (options.solid) {
    const cos = Math.abs(Math.cos(rotationY));
    const sin = Math.abs(Math.sin(rotationY));
    const halfW = (cos * w + sin * d) / 2;
    const halfD = (sin * w + cos * d) / 2;
    obstacles.push({
      kind: 'box',
      minX: x - halfW,
      maxX: x + halfW,
      minZ: z - halfD,
      maxZ: z + halfD,
    });
  }

  return mesh;
}

export interface InstancePlacement {
  x: number;
  y: number;
  z: number;
  rotationY?: number;
}

export function addInstances(
  scene: THREE.Scene,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  placements: readonly InstancePlacement[],
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  const matrix = new THREE.Matrix4();

  placements.forEach((placement, index) => {
    matrix.makeRotationY(placement.rotationY ?? 0);
    matrix.setPosition(placement.x, placement.y, placement.z);
    mesh.setMatrixAt(index, matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
