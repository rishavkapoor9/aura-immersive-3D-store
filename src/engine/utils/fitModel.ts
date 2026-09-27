import * as THREE from 'three';
import type { ModelFit } from '@/types';

export function fitModel(object: THREE.Object3D, fit: ModelFit): THREE.Vector3 {
  object.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const current = size[fit.axis];
  if (current > 0) object.scale.multiplyScalar(fit.to / current);

  object.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(object);
  const center = scaled.getCenter(new THREE.Vector3());

  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= scaled.min.y;
  object.updateMatrixWorld(true);

  return new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
}

export function cloneWithMaterials<T extends THREE.Object3D>(source: T): T {
  const copy = source.clone(true) as T;
  copy.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.material = Array.isArray(child.material)
      ? child.material.map((m) => m.clone())
      : child.material.clone();
  });
  return copy;
}
