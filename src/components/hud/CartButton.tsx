interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export function CartButton({ itemCount, onClick }: CartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="panel flex items-center gap-3 rounded-sm px-5 py-3
                 text-slate-200 transition-colors hover:border-aura-300/45 hover:bg-aura-600/25"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="min-w-4 font-display text-lg font-semibold">{itemCount}</span>
      <span className="text-[11px] uppercase tracking-wider text-muted">View Cart</span>
      <span className="key-cap">C</span>
    </button>
  );
}
