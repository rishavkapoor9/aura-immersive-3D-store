interface SearchButtonProps {
  onClick: () => void;
}

/**
 * The directory is otherwise only reachable by pressing `/`, which nobody discovers
 * on their own — this is the visible way in.
 */
export function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search products and departments"
      className="panel flex items-center gap-3 rounded-sm px-5 py-3 text-slate-200
                 transition-colors hover:border-aura-300/45 hover:bg-aura-600/25"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4.3-4.3" />
      </svg>
      <span className="text-[11px] uppercase tracking-wider text-muted">Search</span>
      <span className="key-cap">/</span>
    </button>
  );
}
