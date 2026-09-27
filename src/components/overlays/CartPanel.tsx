import { ModelThumb } from '@/components/ModelThumb';
import { formatRupees } from '@/utils/format';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import type { CartLine } from '@/types';

interface CartPanelProps {
  open: boolean;
  lines: readonly CartLine[];
  models: ModelLibrary | null;
  total: number;
  busy: boolean;
  onClose: () => void;
  onIncrement: (productId: number) => void;
  onDecrement: (productId: number) => void;
  onRemove: (productId: number) => void;
  onCheckout: () => void;
}

export function CartPanel({
  open,
  lines,
  models,
  total,
  busy,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckout,
}: CartPanelProps) {
  return (
    <aside
      aria-hidden={!open}
      className={`fixed right-0 top-0 z-[120] flex h-full w-[420px] max-w-full flex-col
                  border-l border-white/[0.07] bg-ink-800/[0.97] backdrop-blur-2xl
                  transition-transform duration-500 ease-out-expo
                  ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <header className="flex items-center justify-between border-b border-white/[0.07] px-6 pb-5 pt-7">
        <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.28em] text-slate-200">
          Cart
        </h2>
        <button type="button" onClick={onClose} aria-label="Close cart" className="icon-button h-[30px] w-[30px]">
          ✕
        </button>
      </header>

      <div id="cart-scroll" className="flex-1 overflow-y-auto px-6 py-3.5">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3.5 text-[13px] text-muted-faint">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Your cart is empty
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.product.id}
              className="flex items-center gap-3.5 border-b border-white/[0.05] py-4"
            >
              <ModelThumb
                models={models}
                assetKey={line.product.assetKey}
                active={open}
                className="h-[52px] w-[52px] shrink-0 rounded-sm bg-ink-500
                           bg-[radial-gradient(ellipse_at_50%_38%,#232933_0%,#12161c_78%)]"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-200">{line.product.name}</p>
                <p className="mt-0.5 font-display text-xs text-aura-400">
                  {formatRupees(line.product.price)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-[3px]">
                <button
                  type="button"
                  aria-label={`Decrease ${line.product.name}`}
                  onClick={() => onDecrement(line.product.id)}
                  className="icon-button h-6 w-6 text-[13px] hover:bg-aura-300/20"
                >
                  −
                </button>
                <span className="min-w-[22px] text-center text-[13px] font-semibold text-slate-100">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Increase ${line.product.name}`}
                  onClick={() => onIncrement(line.product.id)}
                  className="icon-button h-6 w-6 text-[13px] hover:bg-aura-300/20"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                aria-label={`Remove ${line.product.name}`}
                onClick={() => onRemove(line.product.id)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border
                           border-red-500/20 text-[11px] text-red-400 transition-colors hover:bg-red-500/15"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <footer className="border-t border-white/[0.07] px-6 pb-6 pt-5">
        <div className="mb-4.5 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-dim">Total</span>
          <span className="font-display text-[25px] font-semibold text-slate-50">
            {formatRupees(total)}
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={busy || lines.length === 0}
          onClick={onCheckout}
        >
          {busy ? 'OPENING CHECKOUT…' : 'PAY NOW →'}
        </button>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] text-slate-600">
          Razorpay · Test Mode
        </p>
      </footer>
    </aside>
  );
}
