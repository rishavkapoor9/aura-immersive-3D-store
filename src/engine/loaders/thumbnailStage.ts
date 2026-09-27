import * as THREE from 'three';
import type { ModelKey } from '@/assets/models';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import { cloneWithMaterials } from '@/engine/utils/fitModel';
import { createEnvironment } from '@/engine/textures/proceduralTextures';

const RENDER_SIZE = 160;
const FOV = 34;
const DISTANCE = 2.5;
const PITCH = 0.3;
const SPIN_PER_SECOND = 0.45;
const FRAME_INTERVAL_MS = 1000 / 30;

interface Target {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly assetKey: ModelKey;
}

class ThumbnailStage {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  private library: ModelLibrary | null = null;
  private readonly prepared = new Map<ModelKey, THREE.Object3D>();
  private readonly targets = new Set<Target>();

  private frame = 0;
  private lastDraw = 0;
  private yaw = 0.7;

  setLibrary(library: ModelLibrary | null) {
    if (this.library === library) return;
    this.library = library;
    this.disposePrepared();
  }

  add(target: Target) {
    this.targets.add(target);
    this.ensureStage();
    this.start();
  }

  remove(target: Target) {
    this.targets.delete(target);
    if (this.targets.size === 0) this.stop();
  }

  private ensureStage() {
    if (this.renderer) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(RENDER_SIZE, RENDER_SIZE, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.environment = createEnvironment(renderer);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const key = new THREE.DirectionalLight(0xfff2e0, 6.3);
    key.position.set(3, 5, 4);
    const fill = new THREE.DirectionalLight(0x9fc4ee, 2.8);
    fill.position.set(-4, 2, 3);
    const rim = new THREE.DirectionalLight(0xffffff, 3.5);
    rim.position.set(-2, 3, -5);
    scene.add(key, fill, rim);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);
  }

  private getPrepared(assetKey: ModelKey): THREE.Object3D | null {
    const cached = this.prepared.get(assetKey);
    if (cached) return cached;

    const source = this.library?.[assetKey];
    if (!source) return null;

    const object = cloneWithMaterials(source);
    object.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    object.scale.multiplyScalar(1 / maxDimension);
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    object.position.sub(bounds.getCenter(new THREE.Vector3()));

    this.prepared.set(assetKey, object);
    return object;
  }

  private start() {
    if (this.frame) return;
    this.lastDraw = 0;
    const loop = (now: number) => {
      this.frame = requestAnimationFrame(loop);
      if (now - this.lastDraw < FRAME_INTERVAL_MS) return;
      const elapsed = this.lastDraw ? (now - this.lastDraw) / 1000 : 0;
      this.lastDraw = now;
      this.draw(elapsed);
    };
    this.frame = requestAnimationFrame(loop);
  }

  private stop() {
    if (!this.frame) return;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private draw(elapsed: number) {
    const { renderer, scene, camera } = this;
    if (!renderer || !scene || !camera) return;

    this.yaw += SPIN_PER_SECOND * elapsed;
    camera.position.set(
      Math.sin(this.yaw) * Math.cos(PITCH) * DISTANCE,
      Math.sin(PITCH) * DISTANCE,
      Math.cos(this.yaw) * Math.cos(PITCH) * DISTANCE,
    );
    camera.lookAt(0, 0, 0);

    this.targets.forEach((target) => {
      const model = this.getPrepared(target.assetKey);
      if (!model) return;

      const { clientWidth, clientHeight } = target.canvas;
      if (!clientWidth || !clientHeight) return;

      const dpr = Math.min(window.devicePixelRatio, 2);
      const width = Math.round(clientWidth * dpr);
      const height = Math.round(clientHeight * dpr);
      if (target.canvas.width !== width || target.canvas.height !== height) {
        target.canvas.width = width;
        target.canvas.height = height;
      }

      scene.add(model);
      renderer.render(scene, camera);
      scene.remove(model);

      target.ctx.clearRect(0, 0, width, height);
      target.ctx.drawImage(renderer.domElement, 0, 0, width, height);
    });
  }

  private disposePrepared() {
    this.prepared.forEach((object) => {
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      });
    });
    this.prepared.clear();
  }
}

export const thumbnailStage = new ThumbnailStage();
