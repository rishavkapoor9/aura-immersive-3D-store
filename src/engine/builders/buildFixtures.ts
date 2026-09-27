import * as THREE from 'three';
import { ROOM } from '@/config/store.config';
import { circleObstacle } from '@/engine/utils/collision';
import { addBox, addInstances, type InstancePlacement } from './primitives';
import type { StoreMaterials } from './materials';
import type { BuildContext } from './types';

export function buildFixtures(ctx: BuildContext, materials: StoreMaterials): void {
  const { scene, obstacles } = ctx;
  const glowStrips: InstancePlacement[] = [];

  addBox(scene, obstacles, {
    size: [0.3, 3.9, 11],
    position: [-13.7, 1.95, 3.5],
    material: materials.panel,
  });

  for (let z = 0; z <= 7; z += 3.4) {
    const niche = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.9), materials.niche);
    niche.position.set(-13.5, 2.05, z);
    niche.rotation.y = Math.PI / 2;
    scene.add(niche);
    glowStrips.push({ x: -13.4, y: 3.05, z, rotationY: Math.PI / 2 });
  }

  addBox(scene, obstacles, {
    size: [0.95, 0.5, 2.8],
    position: [-11.6, 0.25, 2.4],
    material: materials.counter,
    solid: true,
    castShadow: true,
  });
  addBox(scene, obstacles, {
    size: [1.0, 0.06, 2.9],
    position: [-11.6, 0.53, 2.4],
    material: materials.counterTop,
  });

  for (const z of [5.2, 1.6]) {
    addBox(scene, obstacles, {
      size: [1.3, 0.9, 0.8],
      position: [-7.4, 0.45, z],
      material: materials.counter,
      solid: true,
      castShadow: true,
    });
    addBox(scene, obstacles, {
      size: [1.4, 0.06, 0.9],
      position: [-7.4, 0.93, z],
      material: materials.counterTop,
    });
  }

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 5.2), materials.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(9.4, 0.008, 4.0);
  rug.receiveShadow = true;
  scene.add(rug);

  addBox(scene, obstacles, {
    size: [0.26, 3.0, 6.0],
    position: [13.7, 1.5, 3.4],
    material: materials.darkWood,
  });

  addBox(scene, obstacles, {
    size: [0.95, 0.88, 1.45],
    position: [-12.3, 0.44, -8.2],
    material: materials.counter,
    solid: true,
    castShadow: true,
  });
  addBox(scene, obstacles, {
    size: [1.02, 0.06, 1.55],
    position: [-12.3, 0.91, -8.2],
    material: materials.stoneTop,
  });
  glowStrips.push({ x: -11.9, y: 0.36, z: -8.2, rotationY: Math.PI / 2 });

  addBox(scene, obstacles, {
    size: [0.3, 3.6, 8],
    position: [-13.7, 1.8, -9.5],
    material: materials.panel,
  });
  addBox(scene, obstacles, {
    size: [10, 3.4, 0.3],
    position: [-8.2, 1.7, -13.4],
    material: materials.panel,
  });

  if (glowStrips.length) {
    addInstances(
      scene,
      new THREE.BoxGeometry(1.9, 0.025, 0.03),
      materials.emissiveStrip,
      glowStrips,
    );
  }

  for (const x of [-4.8, 4.8]) {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.34, ROOM.height, 12),
      materials.column,
    );
    column.position.set(x, ROOM.height / 2, 12.0);
    column.castShadow = true;
    scene.add(column);
    obstacles.push(circleObstacle(x, 12.0, 0.62));
  }
}
