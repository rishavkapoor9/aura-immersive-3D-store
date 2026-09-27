import type { QualityLevel, QualityPreset } from '@/types';

export const ROOM = {
  width: 28,
  depth: 34,
  height: 5.6,
} as const;

export const PLAYER = {
  eyeHeight: 1.68,
  moveSpeed: 12.6,
  slowFactor: 0.42,
  collisionPadding: 0.42,
  lookSensitivity: 0.0019,
  headBob: { walk: 0.028, idle: 0.006, walkRate: 9.5, slowRate: 6, idleRate: 1.5 },
  spawn: { position: [0, 1.68, 13.5], yaw: 0 },
} as const;

export const CHECKOUT_ZONE = {
  minX: 4.2,
  maxX: 14,
  minZ: -17,
  maxZ: -9.2,
} as const;

export const CHECKOUT_ANCHOR = {
  position: [8.5, PLAYER.eyeHeight, -10] as [number, number, number],
  lookAt: [8.5, 1.4, -12.6] as [number, number, number],
  counterCenter: [8.5, -12.6] as [number, number],
};

export const CAMERA_TRAVEL = {
  toCheckoutSeconds: 2.0,
  returnSeconds: 1.8,
  /** Directory-driven flights to a product or a department. */
  travelSeconds: 1.6,
} as const;

/** How the camera frames a product it has been asked to navigate to. */
export const PRODUCT_VIEW = {
  /** Stand-off distance derived from the product's largest dimension. */
  distanceScale: 1.1,
  distancePadding: 1.6,
  minDistance: 2.2,
  maxDistance: 4.5,
  /** Fraction of the product's height the camera aims at. */
  lookAtHeightRatio: 0.55,
  /** Step size and budget when backing a blocked stand-off point out of a fixture. */
  clearanceStep: 0.3,
  clearanceAttempts: 8,
} as const;

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: { pixelRatio: 1.0, shadows: true, shadowMapSize: 1024, pickInterval: 4, minimapInterval: 8 },
  medium: { pixelRatio: 1.5, shadows: true, shadowMapSize: 2048, pickInterval: 3, minimapInterval: 6 },
  high: { pixelRatio: 2.0, shadows: true, shadowMapSize: 2048, pickInterval: 2, minimapInterval: 4 },
};

export const DEFAULT_QUALITY: QualityLevel = 'high';

export const ADAPTIVE_QUALITY = {
  warmupSeconds: 15,
  sampleSeconds: 5,
  downgradeBelowFps: 24,
  upgradeAboveFps: 75,
} as const;

export const RENDERER = {
  fov: 68,
  near: 0.1,
  far: 140,
  exposure: 1.25,
  fog: { color: 0x0b0d11, near: 20, far: 50 },
  background: 0x0b0d11,
  interactRange: 14,
} as const;

export const PALETTE = {
  hotspotIdle: 0x9fd8ff,
  hotspotActive: 0xffffff,
  warmLight: 0xfff0d6,
  coolLight: 0xbcd8f5,
  checkoutLight: 0xffd9a8,
  aisleLight: 0xffe6c4,
} as const;
