import * as THREE from 'three';

export type TweenMode = 'toCheckout' | 'returning';

interface TweenState {
  elapsed: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromQuaternion: THREE.Quaternion;
  toQuaternion: THREE.Quaternion;
  mode: TweenMode;
  onComplete: (mode: TweenMode) => void;
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class CameraTween {
  private state: TweenState | null = null;
  private readonly scratch = new THREE.Quaternion();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  get isActive(): boolean {
    return this.state !== null;
  }

  start(options: {
    to: THREE.Vector3;
    lookAt?: THREE.Vector3;
    toQuaternion?: THREE.Quaternion;
    duration: number;
    mode: TweenMode;
    onComplete: (mode: TweenMode) => void;
  }): void {
    let target = options.toQuaternion;
    if (!target && options.lookAt) {
      const matrix = new THREE.Matrix4().lookAt(options.to, options.lookAt, new THREE.Vector3(0, 1, 0));
      target = new THREE.Quaternion().setFromRotationMatrix(matrix);
    }

    this.state = {
      elapsed: 0,
      duration: options.duration,
      fromPosition: this.camera.position.clone(),
      toPosition: options.to.clone(),
      fromQuaternion: this.camera.quaternion.clone(),
      toQuaternion: target ?? this.camera.quaternion.clone(),
      mode: options.mode,
      onComplete: options.onComplete,
    };
  }

  cancel(): void {
    this.state = null;
  }

  update(delta: number): void {
    if (!this.state) return;

    this.state.elapsed += delta;
    const t = Math.min(this.state.elapsed / this.state.duration, 1);
    const eased = easeInOutCubic(t);

    this.camera.position.lerpVectors(this.state.fromPosition, this.state.toPosition, eased);
    this.scratch.copy(this.state.fromQuaternion).slerp(this.state.toQuaternion, eased);
    this.camera.quaternion.copy(this.scratch);

    if (t >= 1) {
      const { mode, onComplete } = this.state;
      this.state = null;
      onComplete(mode);
    }
  }
}
