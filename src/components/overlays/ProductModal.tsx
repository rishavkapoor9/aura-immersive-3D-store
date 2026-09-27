import { useEffect } from 'react';
import { ModelViewer } from '@/components/ModelViewer';
import { formatRupees } from '@/utils/format';
import type { ModelLibrary } from '@/engine/loaders/modelLoader';
import type { Product } from '@/types';

interface ProductModalProps {
  product: Product | null;
  models: ModelLibrary | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductModal({ product, models, onClose, onAddToCart }: ProductModalProps) {
  useEffect(() => {
    if (!product) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  const open = Boolean(product);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[105] bg-ink-900/60 backdrop-blur-[3px] transition-opacity duration-300
                    ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product?.name}
        className={`fixed left-1/2 top-1/2 z-[110] flex w-[900px] max-w-[94vw] max-h-[88vh]
                    -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg
                    border border-white/[0.09] bg-ink-700/[0.97] shadow-2xl backdrop-blur-2xl
                    transition-all duration-300 ease-out-expo md:flex-row
                    ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-[0.93] opacity-0'}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="icon-button absolute right-3 top-3 z-[3] h-7 w-7 bg-black/45 text-sm"
        >
          ✕
        </button>

        <div
          className="relative h-[250px] shrink-0 border-b border-white/[0.07]
                     bg-[radial-gradient(ellipse_at_50%_40%,#1d232c_0%,#0f1319_75%)]
                     md:h-auto md:min-h-[460px] md:flex-1 md:border-b-0 md:border-r"
        >
          <ModelViewer
            models={models}
            assetKey={product?.assetKey ?? null}
            className="h-full w-full"
          />
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[9.5px] uppercase tracking-[0.18em] text-slate-500/60">
            Drag to rotate · scroll to zoom
          </p>
        </div>

        {product && (
          <div className="flex min-h-0 flex-col md:w-[360px] md:shrink-0">
            <div id="product-scroll" className="min-h-0 flex-1 overflow-y-auto px-7 pb-5 pt-6">
              <p className="mb-2 pr-8 text-[10px] uppercase tracking-[0.35em] text-aura-500">
                {product.zone}
              </p>
              <h2 className="mb-2 pr-8 font-display text-xl font-semibold leading-tight text-slate-50">
                {product.name}
              </h2>
              <p className="mb-3.5 font-display text-[27px] font-semibold text-aura-400">
                {formatRupees(product.price)}
              </p>
              <p className="mb-4 text-[13px] leading-relaxed text-muted">{product.description}</p>

              <dl className="border-t border-white/[0.06] pt-3.5">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between py-[5px] text-[11.5px]">
                    <dt className="text-muted-dim">{spec.label}</dt>
                    <dd className="text-slate-300">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="shrink-0 border-t border-white/[0.06] px-7 pb-6 pt-5">
              <button type="button" className="btn-primary" onClick={() => onAddToCart(product)}>
                ADD TO CART
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
