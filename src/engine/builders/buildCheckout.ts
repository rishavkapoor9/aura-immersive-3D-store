import * as THREE from 'three';
import { CHECKOUT_ANCHOR, CHECKOUT_ZONE } from '@/config/store.config';
import { cloneWithMaterials, fitModel } from '@/engine/utils/fitModel';
import { mergeByMaterial } from '@/engine/utils/mergeByMaterial';
import {
  createBrandTexture,
  createSignTexture,
  createThresholdTexture,
} from '@/engine/textures/proceduralTextures';
import { addBox, addInstances, type InstancePlacement } from './primitives';
import type { StoreMaterials } from './materials';
import type { BuildContext } from './types';

export function buildCheckout(ctx: BuildContext, materials: StoreMaterials): void {
  const { scene, renderer, obstacles } = ctx;
  const [cx] = CHECKOUT_ANCHOR.counterCenter;
  const z0 = CHECKOUT_ANCHOR.counterCenter[1];

  const brandTexture = createBrandTexture(renderer);
  const brandFace = new THREE.MeshStandardMaterial({
    map: brandTexture,
    roughness: 0.72,
    metalness: 0.05,
    emissiveMap: brandTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.34,
  });
  const backdrop = new THREE.Mesh(new THREE.BoxGeometry(8.4, 3.6, 0.22), [
    materials.signSide,
    materials.signSide,
    materials.signSide,
    materials.signSide,
    brandFace,
    materials.signSide,
  ]);
  backdrop.position.set(cx, 1.85, z0 - 1.7);
  backdrop.receiveShadow = true;
  scene.add(backdrop);
  obstacles.push({ kind: 'box', minX: cx - 4.2, maxX: cx + 4.2, minZ: z0 - 1.85, maxZ: z0 - 1.55 });

  const upBar = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.05, 0.14), materials.cove);
  upBar.position.set(cx, 0.1, z0 - 1.45);
  scene.add(upBar);

  const wash = new THREE.SpotLight(0xfff2dd, 37, 9, Math.PI / 3.2, 0.85, 1.2);
  wash.position.set(cx, 0.35, z0 - 1.3);
  wash.target.position.set(cx, 3.2, z0 - 1.75);
  scene.add(wash, wash.target);

  addBox(scene, obstacles, {
    size: [5.0, 1.05, 1.15],
    position: [cx, 0.52, z0],
    material: materials.counter,
    solid: true,
    castShadow: true,
  });
  addBox(scene, obstacles, {
    size: [5.2, 0.08, 1.3],
    position: [cx, 1.08, z0],
    material: materials.checkoutTop,
  });
  addPosTerminal(ctx, cx - 1.5, z0);
  addBox(scene, obstacles, {
    size: [2.2, 0.06, 0.8],
    position: [cx + 1.1, 1.1, z0],
    material: materials.conveyor,
  });

  const poles: InstancePlacement[] = [];
  for (const x of [cx - 3.0, cx + 3.0]) {
    for (let z = z0 + 1.4; z <= z0 + 3.6; z += 1.1) poles.push({ x, y: 0.52, z });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), materials.steel);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x, 0.98, z0 + 2.5);
    scene.add(bar);
  }
  addInstances(scene, new THREE.CylinderGeometry(0.035, 0.035, 1.05, 6), materials.steel, poles);

  const signTexture = createSignTexture(renderer, 'CHECKOUT');
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 0.1), [
    materials.signSide,
    materials.signSide,
    materials.signSide,
    materials.signSide,
    new THREE.MeshStandardMaterial({
      map: signTexture,
      emissiveMap: signTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.55,
      roughness: 0.7,
    }),
    materials.signSide,
  ]);
  sign.position.set(cx, 3.5, z0 + 2.2);
  scene.add(sign);

  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 1.0),
    new THREE.MeshBasicMaterial({
      map: createThresholdTexture(),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  band.rotation.x = -Math.PI / 2;
  band.position.set(cx + 0.3, 0.014, CHECKOUT_ZONE.maxZ);
  band.renderOrder = 1;
  scene.add(band);

  buildCarts(ctx, cx, z0);
}

const COUNTER_TOP_Y = 1.12;

function addPosTerminal(ctx: BuildContext, x: number, z: number): void {
  const { scene, models } = ctx;
  const template = models.posMachine;
  if (!template) return;

  const model = cloneWithMaterials(template);
  fitModel(model, { axis: 'y', to: 0.44 });

  const root = new THREE.Group();
  root.add(model);
  root.position.set(x, COUNTER_TOP_Y, z);
  // Turn the keypad and screen towards the backdrop / logo wall (−Z).
  root.rotation.y = -Math.PI / 2;
  scene.add(root);
}

function buildCarts(ctx: BuildContext, cx: number, z0: number): void {
  const { scene, models, obstacles } = ctx;
  const template = models.shoppingCart;
  if (!template) return;

  const prototype = cloneWithMaterials(template);
  const dims = fitModel(prototype, { axis: 'x', to: 1.02 });
  const parts = mergeByMaterial(prototype);

  const placements: InstancePlacement[] = [];
  for (let i = 0; i < 5; i += 1) {
    placements.push({ x: 12.7, y: 0, z: -5.4 - i * 0.85, rotationY: -Math.PI / 2 });
  }
  placements.push(
    { x: cx - 3.9, y: 0, z: z0 + 3.4, rotationY: 0.7 },
    { x: cx + 3.6, y: 0, z: z0 + 2.4, rotationY: -2.3 },
    { x: 5.6, y: 0, z: -8.0, rotationY: 1.9 },
  );

  for (const part of parts) {
    addInstances(scene, part.geometry, part.material, placements);
  }

  for (const placement of placements) {
    const cos = Math.abs(Math.cos(placement.rotationY ?? 0));
    const sin = Math.abs(Math.sin(placement.rotationY ?? 0));
    const halfW = (cos * dims.x + sin * dims.z) / 2;
    const halfD = (sin * dims.x + cos * dims.z) / 2;
    obstacles.push({
      kind: 'box',
      minX: placement.x - halfW,
      maxX: placement.x + halfW,
      minZ: placement.z - halfD,
      maxZ: placement.z + halfD,
    });
  }
}
