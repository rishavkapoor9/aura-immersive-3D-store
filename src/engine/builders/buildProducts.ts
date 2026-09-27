import * as THREE from 'three';
import { CATALOG } from '@/data/catalog';
import { PALETTE } from '@/config/store.config';
import type { Product } from '@/types';
import { cloneWithMaterials, fitModel } from '@/engine/utils/fitModel';
import {
  createContactShadowTexture,
  createHotspotTexture,
  createLightPoolTexture,
} from '@/engine/textures/proceduralTextures';
import type { BuildContext } from './types';

export interface ProductInstance {
  readonly product: Product;
  readonly root: THREE.Group;
  readonly hotspot: THREE.Sprite;
  readonly hotspotHit: THREE.Mesh;
  readonly pickProxy: THREE.Mesh;
  readonly lightPool: THREE.Mesh;
  readonly materials: THREE.MeshStandardMaterial[];
  readonly hotspotHeight: number;
  readonly dimensions: THREE.Vector3;
}

export interface ProductBuildResult {
  readonly instances: ProductInstance[];
  readonly pickTargets: THREE.Object3D[];
}

export function buildProducts(ctx: BuildContext): ProductBuildResult {
  const { scene, renderer, models, obstacles } = ctx;

  const hotspotTexture = createHotspotTexture(renderer);
  const poolTexture = createLightPoolTexture();
  const shadowTexture = createContactShadowTexture();
  const idleColor = new THREE.Color(PALETTE.hotspotIdle);

  const instances: ProductInstance[] = [];
  const pickTargets: THREE.Object3D[] = [];

  for (const product of CATALOG) {
    const template = models[product.assetKey];
    const model = cloneWithMaterials(template);
    const dimensions = fitModel(model, product.fit);

    const root = new THREE.Group();
    root.add(model);
    root.position.set(...product.position);
    root.rotation.y = product.rotation;
    root.userData.productId = product.id;
    scene.add(root);

    const materials: THREE.MeshStandardMaterial[] = [];
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const list = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of list) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        material.emissive = material.color.clone().multiplyScalar(material.map ? 0.3 : 0.55);
        material.emissiveIntensity = 0;
        materials.push(material);
      }
    });

    if (product.solid) {
      const cos = Math.abs(Math.cos(product.rotation));
      const sin = Math.abs(Math.sin(product.rotation));
      const halfW = (cos * dimensions.x + sin * dimensions.z) / 2;
      const halfD = (sin * dimensions.x + cos * dimensions.z) / 2;
      obstacles.push({
        kind: 'box',
        minX: product.position[0] - halfW,
        maxX: product.position[0] + halfW,
        minZ: product.position[2] - halfD,
        maxZ: product.position[2] + halfD,
      });
    }

    const poolSize = Math.max(dimensions.x, dimensions.z) * 1.5 + 0.75;
    const lightPool = new THREE.Mesh(
      new THREE.PlaneGeometry(poolSize, poolSize),
      new THREE.MeshBasicMaterial({
        map: poolTexture,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    lightPool.rotation.x = -Math.PI / 2;
    lightPool.position.set(product.position[0], 0.012, product.position[2]);
    lightPool.renderOrder = 1;
    scene.add(lightPool);

    const shadowSize = Math.max(dimensions.x, dimensions.z) * 1.15 + 0.22;
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(shadowSize, shadowSize),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(product.position[0], product.position[1] + 0.015, product.position[2]);
    contactShadow.renderOrder = 2;
    scene.add(contactShadow);

    const hotspotHeight = product.position[1] + dimensions.y + 0.42;
    const hotspot = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: hotspotTexture,
        color: idleColor.clone(),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.95,
      }),
    );
    hotspot.position.set(product.position[0], hotspotHeight, product.position[2]);
    hotspot.scale.set(0.6, 0.6, 1);
    hotspot.renderOrder = 10;
    scene.add(hotspot);

    const invisible = new THREE.MeshBasicMaterial({ visible: false });

    const hotspotHit = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), invisible);
    hotspotHit.position.copy(hotspot.position);
    hotspotHit.userData.productId = product.id;
    scene.add(hotspotHit);

    const pickProxy = new THREE.Mesh(
      new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z),
      invisible,
    );
    pickProxy.position.set(
      product.position[0],
      product.position[1] + dimensions.y / 2,
      product.position[2],
    );
    pickProxy.rotation.y = product.rotation;
    pickProxy.userData.productId = product.id;
    scene.add(pickProxy);

    instances.push({
      product,
      root,
      hotspot,
      hotspotHit,
      pickProxy,
      lightPool,
      materials,
      hotspotHeight,
      dimensions,
    });
    pickTargets.push(hotspotHit, pickProxy);
  }

  return { instances, pickTargets };
}
