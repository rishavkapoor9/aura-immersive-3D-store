import { formatRupees } from '@/utils/format';
import type { HoverTarget, Product } from '@/types';

interface HoverLabelProps {
  hover: HoverTarget | null;
  product: Product | undefined;
}

export function HoverLabel({ hover, product }: HoverLabelProps) {
  const visible = Boolean(hover && product);

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-full
                  transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        left: hover ? `${hover.x}px` : '-999px',
        top: hover ? `${hover.y - 16}px` : '-999px',
      }}
    >
      <div className="rounded-sm border border-aura-300/30 bg-ink-700/[0.86] px-4 py-2.5 text-center shadow-2xl backdrop-blur-md">
        <div className="whitespace-nowrap text-[12.5px] font-medium text-slate-100">
          {product?.name}
        </div>
        <div className="mt-0.5 font-display text-sm font-semibold text-aura-400">
          {product ? formatRupees(product.price) : null}
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500">
          Click to inspect
        </div>
      </div>
      <div className="mx-auto -mt-[5px] h-[9px] w-[9px] rotate-45 border-b border-r border-aura-300/30 bg-ink-700/[0.86]" />
    </div>
  );
}
