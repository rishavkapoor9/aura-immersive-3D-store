import type { Obstacle } from '@/types';
import { PLAYER, ROOM } from '@/config/store.config';

export function boxObstacle(
  x: number,
  z: number,
  width: number,
  depth: number,
  rotationY = 0,
): Obstacle {
  const cos = Math.abs(Math.cos(rotationY));
  const sin = Math.abs(Math.sin(rotationY));
  const halfWidth = (cos * width + sin * depth) / 2;
  const halfDepth = (sin * width + cos * depth) / 2;
  return {
    kind: 'box',
    minX: x - halfWidth,
    maxX: x + halfWidth,
    minZ: z - halfDepth,
    maxZ: z + halfDepth,
  };
}

export function circleObstacle(x: number, z: number, radius: number): Obstacle {
  return { kind: 'circle', x, z, radius };
}

export function collidesAt(x: number, z: number, obstacles: readonly Obstacle[]): boolean {
  const pad = PLAYER.collisionPadding;
  for (const obstacle of obstacles) {
    if (obstacle.kind === 'circle') {
      const dx = x - obstacle.x;
      const dz = z - obstacle.z;
      const r = obstacle.radius + pad;
      if (dx * dx + dz * dz < r * r) return true;
    } else if (
      x > obstacle.minX - pad &&
      x < obstacle.maxX + pad &&
      z > obstacle.minZ - pad &&
      z < obstacle.maxZ + pad
    ) {
      return true;
    }
  }
  return false;
}

export function clampToRoom(value: number, axis: 'x' | 'z'): number {
  const limit = (axis === 'x' ? ROOM.width : ROOM.depth) / 2 - 0.9;
  return Math.max(-limit, Math.min(limit, value));
}
