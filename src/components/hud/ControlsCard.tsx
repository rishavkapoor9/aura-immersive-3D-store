const ROWS = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Move' },
  { keys: ['Mouse'], label: 'Look around' },
  { keys: ['E'], label: 'Interact' },
  { keys: ['C'], label: 'Cart' },
  { keys: ['/'], label: 'Find a product' },
] as const;

export function ControlsCard() {
  return (
    <div className="panel pointer-events-none fixed bottom-6 left-6 z-20 rounded-sm px-[18px] py-3.5">
      {ROWS.map((row) => (
        <div key={row.label} className="my-[7px] flex items-center gap-3.5 text-[11.5px] text-muted">
          <div className="flex min-w-[88px] gap-1">
            {row.keys.map((key) => (
              <span key={key} className={`key-cap ${key.length > 1 ? 'w-auto px-2' : ''}`}>
                {key}
              </span>
            ))}
          </div>
          {row.label}
        </div>
      ))}
    </div>
  );
}
