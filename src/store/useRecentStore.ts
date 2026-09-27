import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getProductById } from '@/data/catalog';
import type { Product } from '@/types';

const STORAGE_KEY = 'aura-recent';
const MAX_RECENT = 5;

interface RecentState {
  ids: number[];
  push: (productId: number) => void;
  clear: () => void;
}

export const useRecentStore = create<RecentState>()(
  persist<RecentState>(
    (set) => ({
      ids: [],

      push: (productId) =>
        set((state) => ({
          ids: [productId, ...state.ids.filter((id) => id !== productId)].slice(0, MAX_RECENT),
        })),

      clear: () => set({ ids: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage<RecentState>(() => localStorage),
      // Same defensiveness as the cart: the payload is user-editable.
      merge: (persisted, current) => ({ ...current, ids: sanitiseIds(persisted) }),
    },
  ),
);

function sanitiseIds(persisted: unknown): number[] {
  if (typeof persisted !== 'object' || persisted === null) return [];
  const { ids } = persisted as { ids?: unknown };
  if (!Array.isArray(ids)) return [];

  const seen = new Set<number>();
  for (const id of ids) {
    if (typeof id !== 'number' || !Number.isFinite(id)) continue;
    if (!getProductById(id)) continue;
    seen.add(id);
    if (seen.size >= MAX_RECENT) break;
  }
  return [...seen];
}

/** Recent picks resolved against the live catalog, newest first. */
export const selectRecentProducts = (state: RecentState): Product[] =>
  state.ids
    .map((id) => getProductById(id))
    .filter((product): product is Product => product !== undefined);
