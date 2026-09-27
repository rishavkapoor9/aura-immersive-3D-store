import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MODEL_KEYS, MODEL_URLS, type ModelKey } from '@/assets/models';
import type { LoadProgress } from '@/types';

export type ModelLibrary = Readonly<Record<ModelKey, THREE.Group>>;

export async function loadModelLibrary(
  onProgress?: (progress: LoadProgress) => void,
): Promise<ModelLibrary> {
  const loader = new GLTFLoader();
  const library = {} as Record<ModelKey, THREE.Group>;
  const total = MODEL_KEYS.length;
  let loaded = 0;

  await Promise.all(
    MODEL_KEYS.map(async (key) => {
      const gltf = await loader.loadAsync(MODEL_URLS[key]);
      const root = gltf.scene;

      root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.getAttribute('normal')) child.geometry.computeVertexNormals();
      });

      library[key] = root;
      loaded += 1;
      onProgress?.({ loaded, total });
    }),
  );

  return library;
}
