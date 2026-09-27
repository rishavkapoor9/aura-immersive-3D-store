import * as THREE from 'three';
import { circleObstacle } from '@/engine/utils/collision';
import type { StoreMaterials } from './materials';
import type { BuildContext } from './types';

const ATRIUM = { radius: 2.0, z: 8.5 } as const;

export function buildAtrium(ctx: BuildContext, materials: StoreMaterials): void {
  const { scene, obstacles } = ctx;
  const { radius, z } = ATRIUM;

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.46, 56),
    materials.planter,
  );
  rim.position.set(0, 0.23, z);
  rim.receiveShadow = true;
  scene.add(rim);

  const cap = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.055, 12, 64), materials.planterRim);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, 0.46, z);
  scene.add(cap);

  const soil = new THREE.Mesh(new THREE.CircleGeometry(radius - 0.14, 32), materials.soil);
  soil.rotation.x = -Math.PI / 2;
  soil.position.set(0, 0.47, z);
  scene.add(soil);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.2, 8), materials.bark);
  trunk.position.set(0, 1.5, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const canopy: Array<[number, number, number, number]> = [
    [0, 2.9, 0, 1.3],
    [-0.65, 2.65, 0.38, 0.88],
    [0.7, 2.75, -0.34, 0.9],
    [0.18, 3.45, 0.5, 0.8],
    [-0.38, 3.35, -0.5, 0.75],
    [0, 3.85, 0, 0.6],
  ];
  const canopyMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 14, 11),
    materials.foliage,
    canopy.length,
  );
  const matrix = new THREE.Matrix4();
  canopy.forEach(([x, y, dz, scale], index) => {
    matrix.makeScale(scale, scale * 0.78, scale);
    matrix.setPosition(x, y, z + dz);
    canopyMesh.setMatrixAt(index, matrix);
  });
  canopyMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.castShadow = true;
  scene.add(canopyMesh);

  const shrubs = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), materials.shrub, 8);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 0.95 + Math.random() * 0.7;
    const scale = 0.22 + Math.random() * 0.13;
    matrix.makeScale(scale, scale * 0.6, scale);
    matrix.setPosition(Math.cos(angle) * dist, 0.62, z + Math.sin(angle) * dist);
    shrubs.setMatrixAt(i, matrix);
  }
  shrubs.instanceMatrix.needsUpdate = true;
  scene.add(shrubs);

  obstacles.push(circleObstacle(0, z, radius + 0.35));
}

export { ATRIUM };
