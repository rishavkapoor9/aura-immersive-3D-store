interface CrosshairProps {
  active: boolean;
  visible: boolean;
}

export function Crosshair({ active, visible }: CrosshairProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2
                  rounded-full transition-all duration-200
                  ${visible ? 'opacity-100' : 'opacity-0'}
                  ${
                    active
                      ? 'h-[3px] w-[3px] bg-white shadow-[0_0_12px_rgba(150,210,255,.9)]'
                      : 'h-[5px] w-[5px] bg-white/55'
                  }`}
    />
  );
}
