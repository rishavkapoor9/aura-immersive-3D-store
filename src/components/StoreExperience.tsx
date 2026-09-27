import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';

import { StoreEngine } from '@/engine/StoreEngine';
import { loadModelLibrary, type ModelLibrary } from '@/engine/loaders/modelLoader';
import { getProductById } from '@/data/catalog';
import { useCartStore, selectItemCount, selectTotal } from '@/store/useCartStore';
import { useUiStore } from '@/store/useUiStore';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useToastAutoDismiss } from '@/hooks/useToast';
import { formatRupees } from '@/utils/format';
import type { ZoneName } from '@/types';

import { EntryScreen } from '@/components/overlays/EntryScreen';
import { PauseOverlay } from '@/components/overlays/PauseOverlay';
import { ProductModal } from '@/components/overlays/ProductModal';
import { CartPanel } from '@/components/overlays/CartPanel';
import { DirectoryOverlay } from '@/components/overlays/DirectoryOverlay';
import { BrandMark } from '@/components/hud/BrandMark';
import { Crosshair } from '@/components/hud/Crosshair';
import { ControlsCard } from '@/components/hud/ControlsCard';
import { CartButton } from '@/components/hud/CartButton';
import { SearchButton } from '@/components/hud/SearchButton';
import { HoverLabel } from '@/components/hud/HoverLabel';
import { ZoneLabel } from '@/components/hud/ZoneLabel';
import { Minimap } from '@/components/hud/Minimap';
import { Toast } from '@/components/hud/Toast';

// Chrome's post-Escape pointer lock cooldown is ~1.25s.
const POINTER_LOCK_RETRY_MS = 1300;

export function StoreExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<StoreEngine | null>(null);
  const minimapDraw = useRef<((camera: THREE.PerspectiveCamera) => void) | null>(null);

  const [models, setModels] = useState<ModelLibrary | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const ui = useUiStore();
  const cartLines = useCartStore((state) => state.lines);
  const itemCount = useCartStore(selectItemCount);
  const total = useCartStore(selectTotal);
  const cartActions = useCartStore();

  useToastAutoDismiss();

  // `persist` reads localStorage synchronously, so a restored cart is already in the
  // store by first render — but the toast sits under the entry screen and would
  // auto-dismiss unseen, so hold it until the player is actually on the floor.
  const restoreAnnounced = useRef(false);
  useEffect(() => {
    if (restoreAnnounced.current || ui.phase !== 'playing') return;
    restoreAnnounced.current = true;
    const restored = selectItemCount(useCartStore.getState());
    if (restored > 0) {
      useUiStore
        .getState()
        .showToast(`Cart restored · ${restored} item${restored === 1 ? '' : 's'}`);
    }
  }, [ui.phase]);

  const activeProduct = useMemo(
    () => (ui.activeProductId !== null ? getProductById(ui.activeProductId) ?? null : null),
    [ui.activeProductId],
  );
  const hoveredProduct = useMemo(
    () => (ui.hover ? getProductById(ui.hover.productId) : undefined),
    [ui.hover],
  );

  // Refs mirror state that engine callbacks read, avoiding stale closures.
  const stateRef = useRef({
    cartOpen: false,
    suppressed: false,
    modalOpen: false,
    searchOpen: false,
  });
  stateRef.current = {
    cartOpen: ui.cartOpen,
    suppressed: ui.autoOpenSuppressed,
    modalOpen: ui.activeProductId !== null,
    searchOpen: ui.searchOpen,
  };

  // Whether we currently *want* the pointer captured, and any pending re-try.
  const wantsLockRef = useRef(false);
  const lockRetryRef = useRef<number | null>(null);

  const cancelLockRetry = useCallback(() => {
    if (lockRetryRef.current !== null) {
      window.clearTimeout(lockRetryRef.current);
      lockRetryRef.current = null;
    }
  }, []);

  const requestLock = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || document.pointerLockElement === canvas) return;
    // Failures land on the `pointerlockerror` listener below; swallow the
    // rejection so it doesn't surface as an unhandled promise.
    void Promise.resolve(canvas.requestPointerLock()).catch(() => undefined);
  }, []);

  const lockPointer = useCallback(() => {
    wantsLockRef.current = true;
    cancelLockRetry();
    requestLock();
  }, [cancelLockRetry, requestLock]);

  const unlockPointer = useCallback(() => {
    wantsLockRef.current = false;
    cancelLockRetry();
    if (document.pointerLockElement) document.exitPointerLock();
  }, [cancelLockRetry]);

  useEffect(() => {
    let cancelled = false;
    loadModelLibrary((progress) => {
      if (!cancelled) useUiStore.getState().setProgress(progress);
    })
      .then((library) => {
        if (cancelled) return;
        setModels(library);
        useUiStore.getState().setPhase('ready');
      })
      .catch((error: unknown) => {
        console.error('Failed to load models', error);
        useUiStore.getState().showToast('Failed to load 3D models');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!models || !canvasRef.current || engineRef.current) return;

    const engine = new StoreEngine({
      canvas: canvasRef.current,
      models,
      events: {
        onHoverChange: (hover) => useUiStore.getState().setHover(hover),
        onZoneChange: (zone) => useUiStore.getState().setZone(zone),
        onProductActivate: (productId) => {
          const store = useUiStore.getState();
          store.setActiveProduct(productId);
          store.setCartOpen(false);
          unlockPointer();
        },
        onEnterCheckoutZone: () => {
          const store = useUiStore.getState();
          if (stateRef.current.suppressed || stateRef.current.modalOpen) return;
          // Don't yank the cart open over someone mid-search.
          if (stateRef.current.searchOpen) return;
          store.setCartOpen(true);
          unlockPointer();
        },
        onLeaveCheckoutZone: () => {
          const store = useUiStore.getState();
          store.setAutoOpenSuppressed(false);
          if (stateRef.current.cartOpen && !engine.hasSnapshot) store.setCartOpen(false);
        },
        onArriveAtCheckout: () => {
          useUiStore.getState().setCartOpen(true);
          unlockPointer();
        },
        onArriveAtProduct: (productId) => {
          // The cursor is already free from opening the directory, so the modal is
          // immediately usable; closing it re-locks and leaves the player here.
          useUiStore.getState().setActiveProduct(productId);
        },
        onArriveAtZone: () => {
          useUiStore.getState().setPhase('playing');
          lockPointer();
        },
        onReturnComplete: () => {
          useUiStore.getState().setPhase('playing');
          lockPointer();
        },
        onMinimapFrame: (camera) => minimapDraw.current?.(camera),
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [models, lockPointer, unlockPointer]);

  useEffect(() => {
    const onChange = () => {
      const locked = document.pointerLockElement === canvasRef.current;
      const store = useUiStore.getState();
      engineRef.current?.setInputEnabled(locked);

      if (locked) {
        store.setPhase('playing');
        return;
      }
      // Released: only show Pause if no overlay asked for the cursor.
      if (store.phase === 'loading' || store.phase === 'ready') return;
      const overlayOpen = store.cartOpen || store.searchOpen || store.activeProductId !== null;
      if (!overlayOpen && !engineRef.current?.isTravelling) store.setPhase('paused');
    };

    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  // A lock request fired inside the browser's post-Escape cooldown is rejected.
  // Without this the player ends up unlocked but un-paused: no camera, no input
  // and no overlay left to click. Re-try once the cooldown has passed.
  useEffect(() => {
    const onError = () => {
      if (!wantsLockRef.current || lockRetryRef.current !== null) return;
      lockRetryRef.current = window.setTimeout(() => {
        lockRetryRef.current = null;
        if (wantsLockRef.current) requestLock();
      }, POINTER_LOCK_RETRY_MS);
    };

    document.addEventListener('pointerlockerror', onError);
    return () => {
      document.removeEventListener('pointerlockerror', onError);
      cancelLockRetry();
    };
  }, [cancelLockRetry, requestLock]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => engineRef.current?.handleMouseMove(event);

    const onKeyDown = (event: KeyboardEvent) => {
      const store = useUiStore.getState();

      // The directory owns the keyboard while it's open: it handles its own keys and
      // stops their propagation, so anything arriving here is from outside the panel.
      // Swallow it all — otherwise typing "c" opens the cart and "w" walks away.
      if (store.searchOpen) {
        if (event.code === 'Escape') {
          event.preventDefault();
          closeSearch();
        }
        return;
      }

      const isSlash = event.code === 'Slash' || event.key === '/';
      if (isSlash && store.phase === 'playing' && store.activeProductId === null) {
        event.preventDefault();
        openSearch();
        return;
      }

      if (event.code === 'KeyC' && store.activeProductId === null) {
        event.preventDefault();
        toggleCart();
        return;
      }
      if (event.code === 'Escape') {
        if (store.activeProductId !== null) {
          closeProduct();
          return;
        }
        if (store.cartOpen) {
          closeCart();
          return;
        }
        // Lock is already gone (a re-lock that hasn't landed yet) — Escape can't
        // reach the browser, so pause from here instead of leaving them stranded.
        if (!document.pointerLockElement && store.phase === 'playing') {
          wantsLockRef.current = false;
          cancelLockRetry();
          store.setPhase('paused');
          return;
        }
      }
      if (event.code === 'KeyE' && store.phase === 'playing') {
        engineRef.current?.activateHovered();
        return;
      }
      engineRef.current?.handleKey(event.code, true);
    };

    const onKeyUp = (event: KeyboardEvent) => engineRef.current?.handleKey(event.code, false);

    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeCart = useCallback(() => {
    const engine = engineRef.current;
    const store = useUiStore.getState();
    store.setCartOpen(false);

    if (engine?.hasSnapshot) {
      engine.travelBackToSnapshot();
      store.showToast('Returning to the floor…');
      return;
    }
    // Walked in under their own steam: stay put, but don't let proximity
    // immediately re-open the cart or they'd be stuck with the cursor free.
    if (engine?.isInsideCheckout) store.setAutoOpenSuppressed(true);
    lockPointer();
  }, [lockPointer]);

  const toggleCart = useCallback(() => {
    const engine = engineRef.current;
    const store = useUiStore.getState();
    if (!engine) return;

    if (store.cartOpen) {
      closeCart();
      return;
    }

    store.setActiveProduct(null);

    if (engine.isInsideCheckout) {
      store.setAutoOpenSuppressed(false);
      store.setCartOpen(true);
      unlockPointer();
    } else {
      engine.captureSnapshot();
      engine.travelToCheckout();
      store.showToast('Heading to checkout…');
    }
  }, [unlockPointer, closeCart]);

  const closeProduct = useCallback(() => {
    useUiStore.getState().setActiveProduct(null);
    lockPointer();
  }, [lockPointer]);

  const openSearch = useCallback(() => {
    const store = useUiStore.getState();
    if (store.cartOpen || store.activeProductId !== null) return;
    store.setSearchOpen(true);
    unlockPointer();
  }, [unlockPointer]);

  const closeSearch = useCallback(() => {
    useUiStore.getState().setSearchOpen(false);
    lockPointer();
  }, [lockPointer]);

  /**
   * Both directory destinations drop any pending checkout snapshot: the player has
   * chosen a new place to be, so a later "return to where you were" would teleport
   * them somewhere they've long since left.
   */
  const travelTo = useCallback(
    (start: (engine: StoreEngine) => boolean, announce: string) => {
      const engine = engineRef.current;
      const store = useUiStore.getState();
      if (!engine || engine.isTravelling) return;

      store.setSearchOpen(false);
      engine.clearSnapshot();
      store.setAutoOpenSuppressed(false);
      if (!start(engine)) {
        // Nothing to fly to — hand the controls back rather than stranding the player.
        lockPointer();
        return;
      }
      store.showToast(announce);
    },
    [lockPointer],
  );

  const handleSelectProduct = useCallback(
    (productId: number) => {
      const product = getProductById(productId);
      travelTo(
        (engine) => engine.travelToProduct(productId),
        product ? `Taking you to ${product.name}…` : 'Taking you there…',
      );
    },
    [travelTo],
  );

  const handleSelectZone = useCallback(
    (zone: ZoneName) => {
      travelTo((engine) => engine.travelToZone(zone), `Heading to ${zone}…`);
    },
    [travelTo],
  );

  const handleAddToCart = useCallback(
    (productId: number) => {
      const product = getProductById(productId);
      if (!product) return;
      cartActions.add(product);
      useUiStore.getState().showToast(`${product.name} added to cart`);
      closeProduct();
    },
    [cartActions, closeProduct],
  );

  const { openCheckout } = useRazorpay({
    onSuccess: (paymentId) => {
      setCheckoutBusy(false);
      const store = useUiStore.getState();
      store.showToast(`Payment successful · ${paymentId}`);
      cartActions.clear();
      window.setTimeout(() => {
        store.setCartOpen(false);
        const engine = engineRef.current;
        if (engine?.hasSnapshot) engine.travelBackToSnapshot();
        else lockPointer();
      }, 1200);
    },
    onDismiss: () => {
      setCheckoutBusy(false);
      useUiStore.getState().showToast('Payment cancelled');
    },
    onError: (message) => {
      setCheckoutBusy(false);
      useUiStore.getState().showToast(message);
    },
  });

  const handleCheckout = useCallback(() => {
    setCheckoutBusy(true);
    void openCheckout(cartLines, total);
  }, [openCheckout, cartLines, total]);

  const handleCanvasClick = useCallback(() => {
    const store = useUiStore.getState();
    if (store.cartOpen || store.searchOpen || store.activeProductId !== null) return;
    if (store.phase === 'playing' && document.pointerLockElement) {
      engineRef.current?.activateHovered();
    } else {
      lockPointer();
    }
  }, [lockPointer]);

  const showHud = ui.phase === 'playing' || ui.phase === 'paused';

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="h-full w-full" />

      {showHud && (
        <>
          <div className="pointer-events-none fixed left-6 top-6 z-20">
            <BrandMark />
          </div>
          <ControlsCard />
          <Minimap
            hoveredProductId={ui.hover?.productId ?? null}
            onReady={(draw) => {
              minimapDraw.current = draw;
            }}
          />
          <ZoneLabel zone={ui.zone} />
          <Crosshair
            active={ui.hover !== null}
            visible={ui.phase === 'playing' && ui.activeProductId === null}
          />
          <HoverLabel
            hover={ui.activeProductId === null && !ui.cartOpen ? ui.hover : null}
            product={hoveredProduct}
          />
          {/* Search sits beside the cart so both entry points read as one control bar. */}
          <div className="fixed bottom-6 right-6 z-[95] flex items-center gap-3">
            <SearchButton onClick={openSearch} />
            <CartButton itemCount={itemCount} onClick={toggleCart} />
          </div>
        </>
      )}

      <CartPanel
        open={ui.cartOpen}
        lines={cartLines}
        models={models}
        total={total}
        busy={checkoutBusy}
        onClose={closeCart}
        onIncrement={cartActions.increment}
        onDecrement={cartActions.decrement}
        onRemove={cartActions.remove}
        onCheckout={handleCheckout}
      />

      <DirectoryOverlay
        open={ui.searchOpen}
        models={models}
        onClose={closeSearch}
        onSelectProduct={handleSelectProduct}
        onSelectZone={handleSelectZone}
      />

      <ProductModal
        product={activeProduct}
        models={models}
        onClose={closeProduct}
        onAddToCart={(product) => handleAddToCart(product.id)}
      />

      <Toast message={ui.toast} />

      {/* Phase flips to `playing` from the pointerlockchange handler once the
          lock actually lands, so a request refused during the browser's cooldown
          leaves the overlay up rather than dropping the player into limbo. */}
      {ui.phase === 'paused' && <PauseOverlay onResume={lockPointer} />}

      {(ui.phase === 'loading' || ui.phase === 'ready') && (
        <EntryScreen
          progress={ui.progress}
          ready={ui.phase === 'ready'}
          onEnter={() => {
            useUiStore.getState().setPhase('playing');
            lockPointer();
          }}
        />
      )}

      {/* Screen-reader summary of cart state */}
      <p className="sr-only" aria-live="polite">
        {itemCount} items in cart, total {formatRupees(total)}
      </p>
    </div>
  );
}
