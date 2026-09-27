import type * as THREE from 'three';
import type { Obstacle, QualityPreset } from '@/types';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';

export interface BuildContext {
  readonly scene: THREE.Scene;
  readonly renderer: THREE.WebGLRenderer;
  readonly models: ModelLibrary;
  readonly quality: QualityPreset;
  readonly obstacles: Obstacle[];
}
