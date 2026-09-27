import type { ZoneName } from '@/types';

interface ZoneLabelProps {
  zone: ZoneName | 'CHECKOUT' | null;
}

export function ZoneLabel({ zone }: ZoneLabelProps) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[150px]
                  font-display text-xs uppercase tracking-[0.55em] transition-colors duration-700
                  ${zone ? 'text-aura-100/50' : 'text-transparent'}`}
    >
      {zone}
    </div>
  );
}
