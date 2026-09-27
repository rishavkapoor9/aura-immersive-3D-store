import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getProductById } from '@/data/catalog';
import { clamp } from '@/utils/format';
import type { CartLine, Product } from '@/types';

const STORAGE_KEY = 'aura-cart';
const MAX_QUANTITY = 99;

interface CartState {
  lines: CartLine[];
  add: (product: Product) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

/** Only ids and quantities are persisted — prices always come from the live catalog. */
interface PersistedCart {
  lines: { id: number; quantity: number }[];
}

/**
 * localStorage is user-editable, so treat the parsed payload as untrusted: drop
 * ids the catalog no longer knows, coerce quantities into range, and collapse
 * duplicates rather than trusting the stored shape.
 */
function rehydrateLines(persisted: unknown): CartLine[] {
  if (typeof persisted !== 'object' || persisted === null) return [];
  const { lines } = persisted as { lines?: unknown };
  if (!Array.isArray(lines)) return [];

  const byId = new Map<number, CartLine>();

  for (const entry of lines) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { id, quantity } = entry as { id?: unknown; quantity?: unknown };
    if (typeof id !== 'number' || !Number.isFinite(id)) continue;
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) continue;

    const product = getProductById(id);
    if (!product) continue;

    const existing = byId.get(id);
    const wanted = (existing?.quantity ?? 0) + Math.floor(quantity);
    if (wanted < 1) continue;

    byId.set(id, { product, quantity: clamp(wanted, 1, MAX_QUANTITY) });
  }

  return [...byId.values()];
}

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], PersistedCart>(
    (set) => ({
      lines: [],

      add: (product) =>
        set((state) => {
          const existing = state.lines.find((line) => line.product.id === product.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.product.id === product.id
                  ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) }
                  : line,
              ),
            };
          }
          return { lines: [...state.lines, { product, quantity: 1 }] };
        }),

      increment: (productId) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.product.id === productId
              ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) }
              : line,
          ),
        })),

      decrement: (productId) =>
        set((state) => ({
          lines: state.lines
            .map((line) =>
              line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line,
            )
            .filter((line) => line.quantity > 0),
        })),

      remove: (productId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.product.id !== productId) })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage<PersistedCart>(() => localStorage),
      partialize: (state) => ({
        lines: state.lines.map((line) => ({ id: line.product.id, quantity: line.quantity })),
      }),
      merge: (persisted, current) => ({ ...current, lines: rehydrateLines(persisted) }),
    },
  ),
);

export const selectItemCount = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectTotal = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
