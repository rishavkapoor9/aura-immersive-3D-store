interface BrandMarkProps {
  size?: 'sm' | 'lg';
}

export function BrandMark({ size = 'sm' }: BrandMarkProps) {
  const isLarge = size === 'lg';

  return (
    <div className={`flex items-center ${isLarge ? 'gap-4' : 'gap-3'}`}>
      <span
        className={`relative rounded-full border border-aura-300/40 ${
          isLarge ? 'h-9 w-9 border-[1.5px]' : 'h-[19px] w-[19px] border-[1.2px]'
        }`}
      >
        <span
          className={`absolute rounded-full bg-aura-100 ${
            isLarge ? 'inset-[10px] shadow-[0_0_18px_rgba(140,200,255,.8)]' : 'inset-[5px]'
          }`}
        />
      </span>
      <span
        className={`font-display font-medium text-slate-100 ${
          isLarge ? 'pl-3 text-5xl tracking-[0.28em]' : 'text-sm tracking-[0.4em] text-slate-200/70'
        }`}
      >
        AURA
      </span>
    </div>
  );
}
