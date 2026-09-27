import { create } from 'zustand';
import type { CartLine, Product } from '@/types';

interface CartState {
  lines: CartLine[];
  add: (product: Product) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],

  add: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.product.id === product.id);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          ),
        };
      }
      return { lines: [...state.lines, { product, quantity: 1 }] };
    }),

  increment: (productId) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line,
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
}));

export const selectItemCount = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectTotal = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
