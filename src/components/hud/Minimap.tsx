import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHECKOUT_ANCHOR, CHECKOUT_ZONE, ROOM } from '@/config/store.config';
import { ZONES } from '@/data/zones';
import { CATALOG } from '@/data/catalog';
import { ATRIUM } from '@/engine/builders/buildAtrium';

const WIDTH = 150;
const HEIGHT = 160;
const PADDING = 9;

// Pure projection from world XZ to canvas pixels, hoisted so it isn't rebuilt each frame.
const SCALE_X = (WIDTH - PADDING * 2) / ROOM.width;
const SCALE_Z = (HEIGHT - PADDING * 2) / ROOM.depth;

const mapX = (value: number) => PADDING + (value + ROOM.width / 2) * SCALE_X;
const mapZ = (value: number) => PADDING + (value + ROOM.depth / 2) * SCALE_Z;

interface MinimapProps {
  hoveredProductId: number | null;
  onReady: (draw: (camera: THREE.PerspectiveCamera) => void) => void;
}

export function Minimap({ hoveredProductId, onReady }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredRef = useRef<number | null>(hoveredProductId);
  hoveredRef.current = hoveredProductId;

  const draw = useCallback((camera: THREE.PerspectiveCamera) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'rgba(10,12,16,.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const zone of ZONES) {
      const [cx, cz] = zone.center;
      const [sx, sz] = zone.size;
      ctx.fillStyle = 'rgba(120,160,200,.10)';
      ctx.fillRect(mapX(cx - sx / 2), mapZ(cz - sz / 2), sx * SCALE_X, sz * SCALE_Z);
      ctx.strokeStyle = 'rgba(140,190,240,.18)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(mapX(cx - sx / 2), mapZ(cz - sz / 2), sx * SCALE_X, sz * SCALE_Z);
    }

    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING, PADDING, ROOM.width * SCALE_X, ROOM.depth * SCALE_Z);

    ctx.strokeStyle = 'rgba(120,200,140,.5)';
    ctx.beginPath();
    ctx.arc(mapX(0), mapZ(ATRIUM.z), ATRIUM.radius * SCALE_X, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(120,200,150,.13)';
    ctx.fillRect(
      mapX(CHECKOUT_ZONE.minX),
      mapZ(CHECKOUT_ZONE.minZ),
      (CHECKOUT_ZONE.maxX - CHECKOUT_ZONE.minX) * SCALE_X,
      (CHECKOUT_ZONE.maxZ - CHECKOUT_ZONE.minZ) * SCALE_Z,
    );
    ctx.strokeStyle = 'rgba(120,200,150,.4)';
    ctx.strokeRect(
      mapX(CHECKOUT_ZONE.minX),
      mapZ(CHECKOUT_ZONE.minZ),
      (CHECKOUT_ZONE.maxX - CHECKOUT_ZONE.minX) * SCALE_X,
      (CHECKOUT_ZONE.maxZ - CHECKOUT_ZONE.minZ) * SCALE_Z,
    );

    const [counterX, counterZ] = CHECKOUT_ANCHOR.counterCenter;
    ctx.fillStyle = 'rgba(120,200,150,.45)';
    ctx.fillRect(mapX(counterX - 2.5), mapZ(counterZ - 0.6), 5 * SCALE_X, 1.2 * SCALE_Z);

    for (const product of CATALOG) {
      ctx.fillStyle = product.id === hoveredRef.current ? '#ffffff' : 'rgba(159,216,255,.85)';
      ctx.beginPath();
      ctx.arc(mapX(product.position[0]), mapZ(product.position[2]), 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const px = mapX(camera.position.x);
    const pz = mapZ(camera.position.z);
    const direction = camera.getWorldDirection(new THREE.Vector3());
    ctx.strokeStyle = 'rgba(255,240,200,.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(px + direction.x * 11, pz + direction.z * 11);
    ctx.stroke();

    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.arc(px, pz, 3, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  useEffect(() => {
    onReady(draw);
  }, [draw, onReady]);

  return (
    <div className="panel fixed right-6 top-6 z-20 overflow-hidden rounded-sm">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block" />
    </div>
  );
}
