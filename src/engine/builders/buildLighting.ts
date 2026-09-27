import * as THREE from 'three';
import { PALETTE, ROOM } from '@/config/store.config';
import { ZONES } from '@/data/zones';
import type { BuildContext } from './types';

export interface LightingRig {
  readonly hoverLight: THREE.SpotLight;
}

export function buildLighting(ctx: BuildContext): LightingRig {
  const { scene, quality } = ctx;

  scene.add(new THREE.AmbientLight(0x6b7a8c, 2.76));
  scene.add(new THREE.HemisphereLight(0xa8bcd4, 0x2f2a24, 2.34));

  for (const z of [6, -3]) {
    const aisle = new THREE.SpotLight(PALETTE.aisleLight, 30, 26, Math.PI / 3.0, 0.85, 1.1);
    aisle.position.set(0, ROOM.height - 0.4, z);
    aisle.target.position.set(0, 0, z);
    scene.add(aisle, aisle.target);
  }

  for (const zone of ZONES) {
    const [zx, zz] = zone.center;
    const key = new THREE.SpotLight(PALETTE.warmLight, 41, 24, Math.PI / 2.9, 0.8, 1.05);
    key.position.set(zx, ROOM.height - 0.5, zz + 2);
    key.target.position.set(zx, 0, zz);
    key.castShadow = true;
    key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.02;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 26;
    scene.add(key, key.target);
  }

  const entrance = new THREE.SpotLight(PALETTE.coolLight, 31, 24, Math.PI / 3.2, 0.75, 1.1);
  entrance.position.set(0, ROOM.height - 0.5, 14);
  entrance.target.position.set(0, 0, 10);
  scene.add(entrance, entrance.target);

  const checkout = new THREE.SpotLight(PALETTE.checkoutLight, 43, 20, Math.PI / 3.6, 0.7, 1.1);
  checkout.position.set(8.5, 5.0, -10.4);
  checkout.target.position.set(8.5, 0, -12.6);
  checkout.castShadow = true;
  checkout.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  checkout.shadow.bias = -0.0006;
  checkout.shadow.normalBias = 0.02;
  checkout.shadow.camera.near = 1;
  checkout.shadow.camera.far = 20;
  scene.add(checkout, checkout.target);

  const hoverLight = new THREE.SpotLight(0xffffff, 0, 9, Math.PI / 6, 0.6, 1.3);
  hoverLight.position.set(0, 4.6, 0);
  scene.add(hoverLight, hoverLight.target);

  return { hoverLight };
}
