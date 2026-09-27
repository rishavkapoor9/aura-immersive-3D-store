import type { ModelKey } from '@/assets/models';

export type ZoneName = 'ELECTRONICS' | 'FURNITURE' | 'KITCHEN & DINING';

export interface ProductSpec {
  readonly label: string;
  readonly value: string;
}

export interface ModelFit {
  readonly axis: 'x' | 'y' | 'z';
  readonly to: number;
}

export interface Product {
  readonly id: number;
  readonly assetKey: ModelKey;
  readonly zone: ZoneName;
  readonly name: string;
  readonly price: number;
  readonly description: string;
  /** Search synonyms the marketing name doesn't contain ("tv", "couch", "fridge"). */
  readonly keywords: readonly string[];
  readonly specs: readonly ProductSpec[];
  readonly fit: ModelFit;
  readonly position: readonly [number, number, number];
  readonly rotation: number;
  readonly solid: boolean;
}

export interface CartLine {
  readonly product: Product;
  quantity: number;
}

export interface Zone {
  readonly name: ZoneName;
  readonly center: readonly [number, number];
  readonly size: readonly [number, number];
  readonly sign: readonly [number, number, number];
  readonly signRotation: number;
  /**
   * Where the camera stands when navigating to this department. Authored rather
   * than derived from `center`, which falls on solid fixtures in every zone.
   */
  readonly view: {
    readonly position: readonly [number, number];
    readonly lookAt: readonly [number, number, number];
  };
}

export type Obstacle =
  | { kind: 'box'; minX: number; maxX: number; minZ: number; maxZ: number }
  | { kind: 'circle'; x: number; z: number; radius: number };

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityPreset {
  readonly pixelRatio: number;
  readonly shadows: boolean;
  readonly shadowMapSize: number;
  readonly pickInterval: number;
  readonly minimapInterval: number;
}

export type GamePhase = 'loading' | 'ready' | 'playing' | 'paused';

export interface LoadProgress {
  readonly loaded: number;
  readonly total: number;
}

export interface HoverTarget {
  readonly productId: number;
  readonly x: number;
  readonly y: number;
}

export interface PlayerSnapshot {
  readonly position: [number, number, number];
  readonly quaternion: [number, number, number, number];
}
