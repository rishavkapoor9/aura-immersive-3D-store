interface PauseOverlayProps {
  onResume: () => void;
}

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <button
      type="button"
      onClick={onResume}
      className="fixed inset-0 z-[190] flex cursor-pointer flex-col items-center justify-center
                 bg-ink-800/70 backdrop-blur-md"
    >
      <h3 className="mb-2.5 font-display text-xl font-medium tracking-[0.4em] text-slate-300">
        PAUSED
      </h3>
      <p className="text-[13px] text-slate-500">Click anywhere to resume</p>
    </button>
  );
}
