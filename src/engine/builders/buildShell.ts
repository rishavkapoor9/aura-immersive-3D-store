import * as THREE from 'three';
import { ROOM } from '@/config/store.config';
import { createFloorTexture } from '@/engine/textures/proceduralTextures';
import type { StoreMaterials } from './materials';
import type { BuildContext } from './types';

export function buildShell(ctx: BuildContext, materials: StoreMaterials): void {
  const { scene, renderer } = ctx;
  const { width, depth, height } = ROOM;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({
      map: createFloorTexture(renderer),
      color: 0x8e959f,
      roughness: 0.16,
      metalness: 0.62,
      envMapIntensity: 1.1,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  for (const x of [-4, 4]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.09, depth), materials.inlay);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.004, 0);
    scene.add(strip);
  }

  const wall = (w: number, h: number, position: [number, number, number], rotationY: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), materials.wall);
    mesh.position.set(...position);
    mesh.rotation.y = rotationY;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };

  wall(width, height, [0, height / 2, -depth / 2], 0);
  wall(width, height, [0, height / 2, depth / 2], Math.PI);
  wall(depth, height, [-width / 2, height / 2, 0], Math.PI / 2);
  wall(depth, height, [width / 2, height / 2, 0], -Math.PI / 2);

  for (const [x, rotationY] of [
    [-width / 2 + 0.06, Math.PI / 2],
    [width / 2 - 0.06, -Math.PI / 2],
  ] as const) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(depth * 0.4, 2.5), materials.woodPanel);
    panel.position.set(x, 1.55, 6);
    panel.rotation.y = rotationY;
    scene.add(panel);
  }
}
