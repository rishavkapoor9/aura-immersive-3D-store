import { create } from 'zustand';
import type { GamePhase, HoverTarget, LoadProgress, ZoneName } from '@/types';

interface UiState {
  phase: GamePhase;
  progress: LoadProgress;
  cartOpen: boolean;
  searchOpen: boolean;
  autoOpenSuppressed: boolean;
  activeProductId: number | null;
  hover: HoverTarget | null;
  zone: ZoneName | 'CHECKOUT' | null;
  toast: string | null;

  setPhase: (phase: GamePhase) => void;
  setProgress: (progress: LoadProgress) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setAutoOpenSuppressed: (suppressed: boolean) => void;
  setActiveProduct: (productId: number | null) => void;
  setHover: (hover: HoverTarget | null) => void;
  setZone: (zone: ZoneName | 'CHECKOUT' | null) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  phase: 'loading',
  progress: { loaded: 0, total: 0 },
  cartOpen: false,
  searchOpen: false,
  autoOpenSuppressed: false,
  activeProductId: null,
  hover: null,
  zone: null,
  toast: null,

  setPhase: (phase) => set({ phase }),
  setProgress: (progress) => set({ progress }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setAutoOpenSuppressed: (autoOpenSuppressed) => set({ autoOpenSuppressed }),
  setActiveProduct: (activeProductId) => set({ activeProductId }),
  setHover: (hover) => set({ hover }),
  setZone: (zone) => set({ zone }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));

export const selectInputBlocked = (state: UiState): boolean =>
  state.activeProductId !== null ||
  state.cartOpen ||
  state.searchOpen ||
  state.phase !== 'playing';
