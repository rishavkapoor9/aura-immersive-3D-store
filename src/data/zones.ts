import type { Zone } from '@/types';

export const ZONES: readonly Zone[] = [
  {
    name: 'ELECTRONICS',
    center: [-9.5, 4.5],
    size: [9, 11],
    sign: [-3.6, 3.5, 4.5],
    signRotation: Math.PI / 2,
    view: { position: [-4.8, 4.5], lookAt: [-9.5, 1.6, 4.5] },
  },
  {
    name: 'FURNITURE',
    center: [9.5, 4.5],
    size: [9, 11],
    sign: [3.6, 3.5, 4.5],
    signRotation: -Math.PI / 2,
    view: { position: [4.8, 4.5], lookAt: [9.5, 1.6, 4.5] },
  },
  {
    name: 'KITCHEN & DINING',
    center: [-8.5, -10],
    size: [11, 8],
    sign: [-8.5, 3.5, -5.6],
    signRotation: 0,
    view: { position: [-8.5, -5.0], lookAt: [-8.5, 1.6, -10] },
  },
] as const;

export const getZoneByName = (name: Zone['name']): Zone | undefined =>
  ZONES.find((zone) => zone.name === name);
