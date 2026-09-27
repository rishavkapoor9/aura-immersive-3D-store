import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModelThumb } from '@/components/ModelThumb';
import { CATALOG } from '@/data/catalog';
import { ZONES } from '@/data/zones';
import { useRecentStore, selectRecentProducts } from '@/store/useRecentStore';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import type { Product, ZoneName } from '@/types';
import { searchCatalog } from '@/utils/search';
import { formatRupees } from '@/utils/format';

const RESULT_LIMIT = 6;

interface DirectoryOverlayProps {
  open: boolean;
  models: ModelLibrary | null;
  onClose: () => void;
  onSelectProduct: (productId: number) => void;
  onSelectZone: (zone: ZoneName) => void;
}

/**
 * Flattened keyboard ring: the zone chips and the product rows are navigated as a
 * single list so Arrow keys never dead-end.
 */
type Entry = { kind: 'zone'; zone: ZoneName } | { kind: 'product'; product: Product };

export function DirectoryOverlay({
  open,
  models,
  onClose,
  onSelectProduct,
  onSelectZone,
}: DirectoryOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const recentProducts = useRecentStore(selectRecentProducts);

  const trimmedQuery = query.trim();

  const { products, listLabel, mode } = useMemo(() => {
    if (trimmedQuery) {
      return {
        products: searchCatalog(trimmedQuery, RESULT_LIMIT).map((result) => result.product),
        listLabel: 'Results',
        mode: 'results' as const,
      };
    }
    if (recentProducts.length > 0) {
      return { products: recentProducts, listLabel: 'Recently viewed', mode: 'recent' as const };
    }
    return { products: [...CATALOG], listLabel: 'All products', mode: 'browse' as const };
  }, [trimmedQuery, recentProducts]);

  const entries = useMemo<Entry[]>(
    () => [
      ...ZONES.map((zone) => ({ kind: 'zone' as const, zone: zone.name })),
      ...products.map((product) => ({ kind: 'product' as const, product })),
    ],
    [products],
  );

  // Reset on every open so the panel never reappears mid-scroll with a stale query.
  useEffect(() => {
    if (!open) {
      // Release focus from *anything* inside the panel, not just the input. A
      // clicked chip or row otherwise keeps focus after the panel hides, and every
      // key the player presses — WASD included — lands on it and is swallowed by
      // the stopPropagation below instead of reaching the game.
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && panelRef.current?.contains(focused)) {
        focused.blur();
      }
      return;
    }
    setQuery('');
    setActiveIndex(0);
    // Focus after the transition starts; the input is in the DOM already.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // A shrinking result list must never leave the active index past the end.
  useEffect(() => {
    setActiveIndex((index) => (index >= entries.length ? Math.max(entries.length - 1, 0) : index));
  }, [entries.length]);

  // Keep the active row in view while arrowing through a scrolled list.
  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const activate = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return;
      if (entry.kind === 'zone') {
        onSelectZone(entry.zone);
        return;
      }
      useRecentStore.getState().push(entry.product.id);
      onSelectProduct(entry.product.id);
    },
    [onSelectProduct, onSelectZone],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    // A hidden panel must never eat keys — belt and braces for the blur above.
    if (!open) return;

    // Nothing in here may reach the window-level game handler: "c" would open the
    // cart, "w" would walk, and Escape would pause.
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (entries.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + entries.length) % entries.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      activate(entries[activeIndex]);
      return;
    }
    if (event.key === 'Tab') {
      // Trap focus: the panel is the whole interactive surface while it's open.
      event.preventDefault();
    }
  };

  const activeEntry = entries[activeIndex];
  const activeId =
    activeEntry === undefined
      ? undefined
      : activeEntry.kind === 'zone'
        ? `directory-zone-${activeEntry.zone}`
        : `directory-product-${activeEntry.product.id}`;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-[100] bg-ink-900/45 backdrop-blur-[2px] transition-opacity duration-300
                    ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Store directory"
        aria-hidden={!open}
        onKeyDown={onKeyDown}
        className={`panel fixed left-1/2 top-6 z-[104] w-[520px] max-w-[92vw] -translate-x-1/2
                    overflow-hidden rounded-sm shadow-2xl transition-all duration-300 ease-out-expo
                    ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'}`}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="shrink-0 text-muted-dim"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4.3-4.3" />
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(ZONES.length);
            }}
            type="text"
            placeholder="Search products, departments or specs…"
            aria-label="Search products"
            role="combobox"
            aria-expanded={open}
            aria-controls="directory-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            tabIndex={open ? 0 : -1}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-slate-100
                       placeholder:text-muted-faint focus:outline-none"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close directory"
            tabIndex={open ? 0 : -1}
            className="key-cap w-auto shrink-0 px-2 transition-colors hover:text-slate-200"
          >
            esc
          </button>
        </div>

        <div className="border-b border-white/[0.07] px-4 py-3">
          <p className="mb-2.5 text-[10px] uppercase tracking-[0.35em] text-aura-500">Departments</p>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((zone, index) => {
              const isActive = activeIndex === index;
              return (
                <button
                  key={zone.name}
                  id={`directory-zone-${zone.name}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => activate({ kind: 'zone', zone: zone.name })}
                  onMouseEnter={() => setActiveIndex(index)}
                  data-active={isActive}
                  tabIndex={open ? 0 : -1}
                  className={`rounded-sm border px-3 py-1.5 font-display text-[10.5px] uppercase
                              tracking-[0.16em] transition-colors
                              ${
                                isActive
                                  ? 'border-aura-300/45 bg-aura-600/25 text-aura-100'
                                  : 'border-white/10 bg-white/[0.04] text-muted hover:bg-white/[0.09]'
                              }`}
                >
                  {zone.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 pt-3.5">
          {mode === 'recent' && (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="shrink-0 text-muted-dim"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          )}
          <p className="shrink-0 text-[10px] uppercase tracking-[0.35em] text-aura-500">
            {listLabel}
          </p>
          <span className="h-px flex-1 bg-white/[0.07]" />
          {mode === 'recent' && (
            <button
              type="button"
              onClick={() => useRecentStore.getState().clear()}
              tabIndex={open ? 0 : -1}
              className="shrink-0 text-[9.5px] uppercase tracking-[0.18em] text-muted-faint
                         transition-colors hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        <div
          ref={listRef}
          id="directory-list"
          role="listbox"
          aria-label="Products"
          className="max-h-[46vh] overflow-y-auto px-2 pb-2 pt-1.5"
        >
          {products.length === 0 && (
            <p className="px-2 py-6 text-center text-[12.5px] text-muted-dim">
              No products match “{trimmedQuery}”
            </p>
          )}

          {products.map((product, productIndex) => {
            const index = ZONES.length + productIndex;
            const isActive = activeIndex === index;
            // History is a suggestion, not a match — sit it back visually, but snap to
            // full emphasis on focus so it never reads as disabled.
            const dimmed = mode === 'recent' && !isActive;
            return (
              <button
                key={product.id}
                id={`directory-product-${product.id}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => activate({ kind: 'product', product })}
                onMouseEnter={() => setActiveIndex(index)}
                data-active={isActive}
                tabIndex={open ? 0 : -1}
                className={`flex w-full items-center gap-3 rounded-sm border px-2 py-2 text-left
                            transition-colors
                            ${
                              isActive
                                ? 'border-aura-300/45 bg-aura-600/25'
                                : 'border-transparent hover:bg-white/[0.05]'
                            }`}
              >
                <ModelThumb
                  models={models}
                  assetKey={product.assetKey}
                  active={open}
                  className={`h-11 w-11 shrink-0 rounded-sm bg-white/[0.03] transition-opacity
                              ${dimmed ? 'opacity-50' : 'opacity-100'}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[13px] transition-colors
                                ${dimmed ? 'text-slate-400' : 'text-slate-100'}`}
                  >
                    {product.name}
                  </span>
                  <span
                    className={`block text-[10px] uppercase tracking-[0.2em] transition-colors
                                ${dimmed ? 'text-muted-faint' : 'text-muted-dim'}`}
                  >
                    {product.zone}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-display text-[13px] font-semibold transition-colors
                              ${dimmed ? 'text-muted-dim' : 'text-aura-400'}`}
                >
                  {formatRupees(product.price)}
                </span>
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {trimmedQuery
            ? `${products.length} ${products.length === 1 ? 'product' : 'products'} match ${trimmedQuery}`
            : ''}
        </p>
      </div>
    </>
  );
}
