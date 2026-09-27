import * as THREE from 'three';
import { ROOM } from '@/config/store.config';
import { addInstances, type InstancePlacement } from './primitives';
import type { StoreMaterials } from './materials';
import type { BuildContext } from './types';

export function buildCeiling(ctx: BuildContext, materials: StoreMaterials): void {
  const { scene } = ctx;
  const { width, depth, height } = ROOM;

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), materials.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  scene.add(ceiling);

  const slats: InstancePlacement[] = [];
  for (let z = -depth / 2 + 3; z < depth / 2 - 2; z += 0.55) {
    slats.push({ x: 0, y: height - 0.14, z });
  }
  addInstances(scene, new THREE.BoxGeometry(8, 0.16, 0.2), materials.woodSlat, slats);

  const beams: InstancePlacement[] = [];
  for (let z = -depth / 2 + 3; z < depth / 2 - 2; z += 3.2) {
    beams.push({ x: -9, y: height - 0.2, z }, { x: 9, y: height - 0.2, z });
  }
  addInstances(scene, new THREE.BoxGeometry(9, 0.28, 0.22), materials.beam, beams);

  const downlights: InstancePlacement[] = [];
  for (let z = -depth / 2 + 4; z < depth / 2 - 2; z += 3) {
    for (const x of [-11.5, -8, 8, 11.5]) downlights.push({ x, y: height - 0.03, z });
  }
  const discGeometry = new THREE.CircleGeometry(0.11, 12);
  discGeometry.rotateX(Math.PI / 2);
  addInstances(scene, discGeometry, materials.downlight, downlights);

  for (const x of [-3.6, 3.6]) {
    const cove = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, depth - 6), materials.cove);
    cove.position.set(x, height - 0.24, 0);
    scene.add(cove);
  }
}
