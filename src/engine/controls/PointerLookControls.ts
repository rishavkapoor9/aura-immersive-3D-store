import * as THREE from 'three';
import { PLAYER } from '@/config/store.config';

export class PointerLookControls {
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private enabled = false;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  syncFromCamera(): void {
    this.euler.setFromQuaternion(this.camera.quaternion);
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.enabled) return;
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= event.movementX * PLAYER.lookSensitivity;
    this.euler.x -= event.movementY * PLAYER.lookSensitivity;
    const limit = Math.PI / 2 - 0.05;
    this.euler.x = Math.max(-limit, Math.min(limit, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }
}
