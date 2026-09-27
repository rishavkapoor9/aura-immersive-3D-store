import * as THREE from 'three';
import { ROOM } from '@/config/store.config';
import { ZONES } from '@/data/zones';
import { createSignTexture } from '@/engine/textures/proceduralTextures';
import { addInstances, type InstancePlacement } from './primitives';
import type { StoreMaterials } from './materials';
import type { BuildContext } from './types';

export function buildSignage(ctx: BuildContext, materials: StoreMaterials): void {
  const { scene, renderer } = ctx;
  const rods: InstancePlacement[] = [];

  for (const zone of ZONES) {
    const texture = createSignTexture(renderer, zone.name);
    const face = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.65,
      emissiveMap: texture,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
    });

    const panel = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.0, 0.12), [
      materials.signSide,
      materials.signSide,
      materials.signSide,
      materials.signSide,
      face,
      materials.signSide,
    ]);
    const [sx, sy, sz] = zone.sign;
    panel.position.set(sx, sy, sz);
    panel.rotation.y = zone.signRotation;
    scene.add(panel);

    for (const offset of [-2.0, 2.0]) {
      rods.push({
        x: sx + Math.cos(zone.signRotation) * offset,
        y: sy + 0.5 + (ROOM.height - sy - 0.5) / 2,
        z: sz - Math.sin(zone.signRotation) * offset,
      });
    }
  }

  addInstances(
    scene,
    new THREE.CylinderGeometry(0.018, 0.018, 1.7, 6),
    new THREE.MeshStandardMaterial({ color: 0x555b64, metalness: 0.8, roughness: 0.3 }),
    rods,
  );
}
