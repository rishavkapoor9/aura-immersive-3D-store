import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { ModelKey } from '@/assets/models';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import { cloneWithMaterials } from '@/engine/utils/fitModel';
import { createEnvironment } from '@/engine/textures/proceduralTextures';
import { clamp } from '@/utils/format';

interface ModelViewerProps {
  models: ModelLibrary | null;
  assetKey: ModelKey | null;
  className?: string;
}

const ORBIT = {
  minPitch: -1.2,
  maxPitch: 1.2,
  minDistance: 1.2,
  maxDistance: 8,
  autoSpin: 0.004,
  dragSpeed: 0.01,
  zoomStep: 0.12,
} as const;

export function ModelViewer({ models, assetKey, className }: ModelViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    yaw: 0.7,
    pitch: 0.22,
    distance: 3.1,
    autoRotate: true,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !models || !assetKey) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    scene.environment = createEnvironment(renderer);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const key = new THREE.DirectionalLight(0xfff2e0, 6.3);
    key.position.set(3, 5, 4);
    const fill = new THREE.DirectionalLight(0x9fc4ee, 2.8);
    fill.position.set(-4, 2, 3);
    const rim = new THREE.DirectionalLight(0xffffff, 3.5);
    rim.position.set(-2, 3, -5);
    scene.add(key, fill, rim);

    const model = cloneWithMaterials(models[assetKey]);
    model.updateMatrixWorld(true);
    let bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    model.scale.multiplyScalar(1.6 / maxDimension);
    model.updateMatrixWorld(true);
    bounds = new THREE.Box3().setFromObject(model);
    model.position.sub(bounds.getCenter(new THREE.Vector3()));
    scene.add(model);

    const state = stateRef.current;
    state.yaw = 0.7;
    state.pitch = 0.22;
    state.distance = 3.1;
    state.autoRotate = true;

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.autoRotate = false;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      host.setPointerCapture(event.pointerId);
      host.style.cursor = 'grabbing';
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      state.yaw -= (event.clientX - state.lastX) * ORBIT.dragSpeed;
      state.pitch += (event.clientY - state.lastY) * ORBIT.dragSpeed;
      state.pitch = clamp(state.pitch, ORBIT.minPitch, ORBIT.maxPitch);
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      state.dragging = false;
      host.style.cursor = 'grab';
      try {
        host.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer already released */
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      state.distance = clamp(
        state.distance * (1 + Math.sign(event.deltaY) * ORBIT.zoomStep),
        ORBIT.minDistance,
        ORBIT.maxDistance,
      );
    };

    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('wheel', onWheel, { passive: false });

    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      if (state.autoRotate) state.yaw += ORBIT.autoSpin;
      camera.position.set(
        Math.sin(state.yaw) * Math.cos(state.pitch) * state.distance,
        Math.sin(state.pitch) * state.distance + 0.15,
        Math.cos(state.yaw) * Math.cos(state.pitch) * state.distance,
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('wheel', onWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [models, assetKey]);

  return <div ref={hostRef} className={className} style={{ cursor: 'grab' }} />;
}
