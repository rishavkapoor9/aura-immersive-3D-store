import * as THREE from 'three';
import { PLAYER } from '@/config/store.config';
import { clampToRoom, collidesAt } from '@/engine/utils/collision';
import type { Obstacle } from '@/types';

type MoveKey = 'forward' | 'backward' | 'left' | 'right' | 'slow';

const KEY_MAP: Record<string, MoveKey> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'slow',
  ShiftRight: 'slow',
};

export class PlayerController {
  private readonly keys: Record<MoveKey, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    slow: false,
  };

  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly move = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private bobPhase = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly obstacles: readonly Obstacle[],
  ) {}

  handleKey(code: string, pressed: boolean): boolean {
    const key = KEY_MAP[code];
    if (!key) return false;
    this.keys[key] = pressed;
    return true;
  }

  releaseAll(): void {
    (Object.keys(this.keys) as MoveKey[]).forEach((key) => {
      this.keys[key] = false;
    });
  }

  update(delta: number): void {
    this.camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    this.forward.normalize();
    this.right.crossVectors(this.forward, this.up).normalize();

    this.move.set(0, 0, 0);
    if (this.keys.forward) this.move.add(this.forward);
    if (this.keys.backward) this.move.sub(this.forward);
    if (this.keys.left) this.move.sub(this.right);
    if (this.keys.right) this.move.add(this.right);

    const moving = this.move.lengthSq() > 0;

    if (moving) {
      this.move.normalize();
      const speed = PLAYER.moveSpeed * (this.keys.slow ? PLAYER.slowFactor : 1) * delta;
      this.step(this.move.x * speed, this.move.z * speed);
      this.bobPhase += delta * (this.keys.slow ? PLAYER.headBob.slowRate : PLAYER.headBob.walkRate);
    } else {
      this.bobPhase += delta * PLAYER.headBob.idleRate;
    }

    const amplitude = moving ? PLAYER.headBob.walk : PLAYER.headBob.idle;
    this.camera.position.y = PLAYER.eyeHeight + Math.sin(this.bobPhase) * amplitude;
  }

  private step(dx: number, dz: number): void {
    const { position } = this.camera;

    const nextX = clampToRoom(position.x + dx, 'x');
    if (!collidesAt(nextX, position.z, this.obstacles)) position.x = nextX;

    const nextZ = clampToRoom(position.z + dz, 'z');
    if (!collidesAt(position.x, nextZ, this.obstacles)) position.z = nextZ;
  }
}
