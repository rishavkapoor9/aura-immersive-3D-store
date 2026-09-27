import * as THREE from 'three';
import {
  ADAPTIVE_QUALITY,
  CAMERA_TRAVEL,
  CHECKOUT_ANCHOR,
  CHECKOUT_ZONE,
  DEFAULT_QUALITY,
  PALETTE,
  PLAYER,
  PRODUCT_VIEW,
  QUALITY_PRESETS,
  RENDERER,
} from '@/config/store.config';
import { ZONES, getZoneByName } from '@/data/zones';
import type { HoverTarget, Obstacle, PlayerSnapshot, QualityLevel, ZoneName } from '@/types';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import { clampToRoom, collidesAt } from '@/engine/utils/collision';
import { createEnvironment } from '@/engine/textures/proceduralTextures';
import { createStoreMaterials } from '@/engine/builders/materials';
import { buildShell } from '@/engine/builders/buildShell';
import { buildCeiling } from '@/engine/builders/buildCeiling';
import { buildAtrium } from '@/engine/builders/buildAtrium';
import { buildFixtures } from '@/engine/builders/buildFixtures';
import { buildSignage } from '@/engine/builders/buildSignage';
import { buildCheckout } from '@/engine/builders/buildCheckout';
import { buildProducts, type ProductInstance } from '@/engine/builders/buildProducts';
import { buildLighting, type LightingRig } from '@/engine/builders/buildLighting';
import { PointerLookControls } from '@/engine/controls/PointerLookControls';
import { PlayerController } from '@/engine/controls/PlayerController';
import { CameraTween } from '@/engine/controls/CameraTween';

export interface StoreEngineEvents {
  onHoverChange: (target: HoverTarget | null) => void;
  onZoneChange: (zone: ZoneName | 'CHECKOUT' | null) => void;
  onProductActivate: (productId: number) => void;
  onEnterCheckoutZone: () => void;
  onLeaveCheckoutZone: () => void;
  onArriveAtCheckout: () => void;
  onArriveAtProduct: (productId: number) => void;
  onArriveAtZone: (zone: ZoneName) => void;
  onReturnComplete: () => void;
  onMinimapFrame: (camera: THREE.PerspectiveCamera) => void;
}

export interface StoreEngineOptions {
  canvas: HTMLCanvasElement;
  models: ModelLibrary;
  events: StoreEngineEvents;
}

export class StoreEngine {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly obstacles: Obstacle[] = [];
  private readonly events: StoreEngineEvents;

  private readonly look: PointerLookControls;
  private readonly player: PlayerController;
  private readonly tween: CameraTween;

  private products: ProductInstance[] = [];
  private productsById = new Map<number, ProductInstance>();
  private pickTargets: THREE.Object3D[] = [];
  private lighting!: LightingRig;

  private quality: QualityLevel = DEFAULT_QUALITY;
  private frame = 0;
  private runTime = 0;
  private fpsAccumulator = 0;
  private fpsFrames = 0;

  private hoveredId: number | null = null;
  private currentZone: ZoneName | 'CHECKOUT' | null = null;
  private insideCheckout = false;
  private inputEnabled = false;
  private animationHandle = 0;
  private snapshot: PlayerSnapshot | null = null;

  private readonly screenPosition = new THREE.Vector3();
  private readonly approach = new THREE.Vector3();
  private readonly centerScreen = new THREE.Vector2(0, 0);
  private readonly idleColor = new THREE.Color(PALETTE.hotspotIdle);
  private readonly activeColor = new THREE.Color(PALETTE.hotspotActive);

  constructor(options: StoreEngineOptions) {
    this.events = options.events;

    this.scene.background = new THREE.Color(RENDERER.background);
    this.scene.fog = new THREE.Fog(RENDERER.fog.color, RENDERER.fog.near, RENDERER.fog.far);

    this.camera = new THREE.PerspectiveCamera(
      RENDERER.fov,
      window.innerWidth / window.innerHeight,
      RENDERER.near,
      RENDERER.far,
    );
    this.camera.position.set(...PLAYER.spawn.position);

    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = RENDERER.exposure;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.applyQuality(DEFAULT_QUALITY);

    this.scene.environment = createEnvironment(this.renderer);
    this.raycaster.far = RENDERER.interactRange;

    const materials = createStoreMaterials();
    const ctx = {
      scene: this.scene,
      renderer: this.renderer,
      models: options.models,
      quality: QUALITY_PRESETS[this.quality],
      obstacles: this.obstacles,
    };

    buildShell(ctx, materials);
    buildCeiling(ctx, materials);
    buildAtrium(ctx, materials);
    buildFixtures(ctx, materials);
    buildSignage(ctx, materials);
    buildCheckout(ctx, materials);

    const productResult = buildProducts(ctx);
    this.products = productResult.instances;
    this.productsById = new Map(this.products.map((item) => [item.product.id, item]));
    this.pickTargets = productResult.pickTargets;

    this.lighting = buildLighting(ctx);

    this.look = new PointerLookControls(this.camera);
    this.player = new PlayerController(this.camera, this.obstacles);
    this.tween = new CameraTween(this.camera);

    window.addEventListener('resize', this.handleResize);
  }

  start(): void {
    if (this.animationHandle) return;
    this.clock.start();
    this.loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationHandle);
    this.animationHandle = 0;
    window.removeEventListener('resize', this.handleResize);
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer.dispose();
  }

  setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    this.look.setEnabled(enabled);
    if (!enabled) this.player.releaseAll();
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.tween.isActive) this.look.handleMouseMove(event);
  }

  handleKey(code: string, pressed: boolean): void {
    if (!this.inputEnabled) return;
    this.player.handleKey(code, pressed);
  }

  activateHovered(): void {
    if (this.hoveredId !== null) this.events.onProductActivate(this.hoveredId);
  }

  get isTravelling(): boolean {
    return this.tween.isActive;
  }

  get isInsideCheckout(): boolean {
    return this.insideCheckout;
  }

  get hasSnapshot(): boolean {
    return this.snapshot !== null;
  }

  captureSnapshot(): void {
    this.snapshot = {
      position: this.camera.position.toArray() as [number, number, number],
      quaternion: this.camera.quaternion.toArray() as [number, number, number, number],
    };
  }

  clearSnapshot(): void {
    this.snapshot = null;
  }

  travelToCheckout(): void {
    this.player.releaseAll();
    this.tween.start({
      to: new THREE.Vector3(...CHECKOUT_ANCHOR.position),
      lookAt: new THREE.Vector3(...CHECKOUT_ANCHOR.lookAt),
      duration: CAMERA_TRAVEL.toCheckoutSeconds,
      mode: 'toCheckout',
      onComplete: () => {
        this.look.syncFromCamera();
        this.events.onArriveAtCheckout();
      },
    });
  }

  /**
   * Fly to a viewing position in front of a product. The stand-off point is derived
   * from the product's real bounds rather than authored per-product: each zone's
   * sign sits on its aisle-facing edge, which gives a reliable "where a shopper
   * would stand" direction.
   */
  travelToProduct(productId: number): boolean {
    if (this.tween.isActive) return false;
    const instance = this.productsById.get(productId);
    if (!instance) return false;

    const { product, dimensions } = instance;
    const [px, py, pz] = product.position;
    const zone = getZoneByName(product.zone);

    // Direction from the product out toward the aisle.
    this.approach.set(zone ? zone.sign[0] - px : -px, 0, zone ? zone.sign[2] - pz : -pz);
    if (this.approach.lengthSq() < 1e-6) this.approach.set(0, 0, 1);
    this.approach.normalize();

    const span = Math.max(dimensions.x, dimensions.y, dimensions.z);
    let distance = THREE.MathUtils.clamp(
      span * PRODUCT_VIEW.distanceScale + PRODUCT_VIEW.distancePadding,
      PRODUCT_VIEW.minDistance,
      PRODUCT_VIEW.maxDistance,
    );

    // Back away from the product until the stand-off point is walkable.
    let standX = px;
    let standZ = pz;
    for (let attempt = 0; attempt <= PRODUCT_VIEW.clearanceAttempts; attempt += 1) {
      standX = clampToRoom(px + this.approach.x * distance, 'x');
      standZ = clampToRoom(pz + this.approach.z * distance, 'z');
      if (!collidesAt(standX, standZ, this.obstacles)) break;
      distance += PRODUCT_VIEW.clearanceStep;
    }

    this.player.releaseAll();
    this.tween.start({
      to: new THREE.Vector3(standX, PLAYER.eyeHeight, standZ),
      lookAt: new THREE.Vector3(px, py + dimensions.y * PRODUCT_VIEW.lookAtHeightRatio, pz),
      duration: CAMERA_TRAVEL.travelSeconds,
      mode: 'toProduct',
      onComplete: () => {
        this.look.syncFromCamera();
        this.events.onArriveAtProduct(productId);
      },
    });
    return true;
  }

  /** Fly to a department's authored viewing anchor. */
  travelToZone(zoneName: ZoneName): boolean {
    if (this.tween.isActive) return false;
    const zone = getZoneByName(zoneName);
    if (!zone) return false;

    const [vx, vz] = zone.view.position;
    this.player.releaseAll();
    this.tween.start({
      to: new THREE.Vector3(vx, PLAYER.eyeHeight, vz),
      lookAt: new THREE.Vector3(...zone.view.lookAt),
      duration: CAMERA_TRAVEL.travelSeconds,
      mode: 'toZone',
      onComplete: () => {
        this.look.syncFromCamera();
        this.events.onArriveAtZone(zoneName);
      },
    });
    return true;
  }

  travelBackToSnapshot(): void {
    if (!this.snapshot) return;
    const { position, quaternion } = this.snapshot;
    this.player.releaseAll();
    this.tween.start({
      to: new THREE.Vector3(...position),
      toQuaternion: new THREE.Quaternion(...quaternion),
      duration: CAMERA_TRAVEL.returnSeconds,
      mode: 'returning',
      onComplete: () => {
        this.snapshot = null;
        this.look.syncFromCamera();
        this.events.onReturnComplete();
      },
    });
  }

  applyQuality(level: QualityLevel): void {
    this.quality = level;
    const preset = QUALITY_PRESETS[level];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
    this.renderer.shadowMap.enabled = preset.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.scene.traverse((object) => {
      if (object instanceof THREE.SpotLight && object.shadow) {
        object.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
      }
    });
  }

  private loop = (): void => {
    this.animationHandle = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.frame += 1;
    this.runTime += delta;

    this.updateAdaptiveQuality(delta);
    this.tween.update(delta);

    if (this.inputEnabled && !this.tween.isActive) {
      this.player.update(delta);
    }

    const preset = QUALITY_PRESETS[this.quality];
    if (this.frame % preset.pickInterval === 0) this.updateHover();
    this.updateHotspots(elapsed);
    this.updateZone();
    this.updateCheckoutProximity();

    if (this.frame % preset.minimapInterval === 0) this.events.onMinimapFrame(this.camera);

    this.renderer.render(this.scene, this.camera);
  };

  private updateAdaptiveQuality(delta: number): void {
    this.fpsAccumulator += delta;
    this.fpsFrames += 1;
    if (this.fpsAccumulator < ADAPTIVE_QUALITY.sampleSeconds) return;

    const fps = this.fpsFrames / this.fpsAccumulator;
    this.fpsAccumulator = 0;
    this.fpsFrames = 0;

    if (this.runTime < ADAPTIVE_QUALITY.warmupSeconds) return;

    if (fps < ADAPTIVE_QUALITY.downgradeBelowFps) {
      if (this.quality === 'high') this.applyQuality('medium');
      else if (this.quality === 'medium') this.applyQuality('low');
    } else if (fps > ADAPTIVE_QUALITY.upgradeAboveFps) {
      if (this.quality === 'low') this.applyQuality('medium');
      else if (this.quality === 'medium') this.applyQuality('high');
    }
  }

  private updateHover(): void {
    if (!this.inputEnabled) {
      if (this.hoveredId !== null) {
        this.hoveredId = null;
        this.events.onHoverChange(null);
      }
      return;
    }

    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickTargets, false);
    const productId = (hits[0]?.object.userData.productId as number | undefined) ?? null;

    if (productId === this.hoveredId) {
      if (productId !== null) this.emitHoverPosition(productId);
      return;
    }

    this.hoveredId = productId;
    if (productId === null) this.events.onHoverChange(null);
    else this.emitHoverPosition(productId);
  }

  private emitHoverPosition(productId: number): void {
    const instance = this.productsById.get(productId);
    if (!instance) return;

    this.screenPosition.copy(instance.hotspot.position).project(this.camera);
    if (this.screenPosition.z > 1) {
      this.events.onHoverChange(null);
      return;
    }

    this.events.onHoverChange({
      productId,
      x: (this.screenPosition.x * 0.5 + 0.5) * window.innerWidth,
      y: (-this.screenPosition.y * 0.5 + 0.5) * window.innerHeight,
    });
  }

  private updateHotspots(elapsed: number): void {
    let hoverPosition: readonly [number, number, number] | null = null;

    this.products.forEach((instance, index) => {
      const isHovered = instance.product.id === this.hoveredId;

      const bob = instance.hotspotHeight + Math.sin(elapsed * 1.5 + index) * 0.045;
      instance.hotspot.position.y = bob;
      instance.hotspotHit.position.y = bob;

      const pulse = 0.58 + Math.sin(elapsed * 2.2 + index * 0.7) * 0.035;
      const targetScale = isHovered ? 0.92 : pulse;
      const scale = instance.hotspot.scale.x + (targetScale - instance.hotspot.scale.x) * 0.16;
      instance.hotspot.scale.set(scale, scale, 1);

      const material = instance.hotspot.material as THREE.SpriteMaterial;
      material.opacity += ((isHovered ? 1 : 0.9) - material.opacity) * 0.16;
      material.color.lerp(isHovered ? this.activeColor : this.idleColor, 0.16);

      const targetEmissive = isHovered ? 0.3 : 0;
      for (const productMaterial of instance.materials) {
        productMaterial.emissiveIntensity +=
          (targetEmissive - productMaterial.emissiveIntensity) * 0.14;
      }

      const pool = instance.lightPool.material as THREE.MeshBasicMaterial;
      pool.opacity += ((isHovered ? 0.95 : 0.5) - pool.opacity) * 0.14;

      if (isHovered) hoverPosition = instance.product.position;
    });

    const { hoverLight } = this.lighting;
    if (hoverPosition !== null) {
      const [hx, hy, hz] = hoverPosition as readonly [number, number, number];
      hoverLight.position.set(hx, 4.6, hz + 0.6);
      hoverLight.target.position.set(hx, hy + 0.3, hz);
      hoverLight.target.updateMatrixWorld();
      hoverLight.intensity += (42 - hoverLight.intensity) * 0.16;
    } else {
      hoverLight.intensity += (0 - hoverLight.intensity) * 0.16;
    }
  }

  private updateZone(): void {
    const { x, z } = this.camera.position;
    let zone: ZoneName | 'CHECKOUT' | null = null;

    for (const candidate of ZONES) {
      const [cx, cz] = candidate.center;
      const [sx, sz] = candidate.size;
      if (Math.abs(x - cx) < sx / 2 + 2 && Math.abs(z - cz) < sz / 2 + 2) {
        zone = candidate.name;
        break;
      }
    }
    if (this.isPointInCheckout(x, z)) zone = 'CHECKOUT';

    if (zone !== this.currentZone) {
      this.currentZone = zone;
      this.events.onZoneChange(zone);
    }
  }

  private updateCheckoutProximity(): void {
    if (this.tween.isActive) return;
    const inside = this.isPointInCheckout(this.camera.position.x, this.camera.position.z);
    if (inside === this.insideCheckout) return;

    this.insideCheckout = inside;
    if (inside) this.events.onEnterCheckoutZone();
    else this.events.onLeaveCheckoutZone();
  }

  private isPointInCheckout(x: number, z: number): boolean {
    return (
      x > CHECKOUT_ZONE.minX &&
      x < CHECKOUT_ZONE.maxX &&
      z > CHECKOUT_ZONE.minZ &&
      z < CHECKOUT_ZONE.maxZ
    );
  }

  private handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
