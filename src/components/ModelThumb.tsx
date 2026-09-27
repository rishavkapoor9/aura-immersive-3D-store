import { useEffect, useRef } from 'react';
import type { ModelKey } from '@/assets/models';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import { thumbnailStage } from '@/engine/loaders/thumbnailStage';

interface ModelThumbProps {
  models: ModelLibrary | null;
  assetKey: ModelKey;
  active: boolean;
  className?: string;
}

export function ModelThumb({ models, assetKey, active, className }: ModelThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    thumbnailStage.setLibrary(models);
  }, [models]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !models || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const target = { canvas, ctx, assetKey };
    thumbnailStage.add(target);
    return () => thumbnailStage.remove(target);
  }, [models, assetKey, active]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
