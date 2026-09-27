import { BrandMark } from '@/components/hud/BrandMark';
import type { LoadProgress } from '@/types';

interface EntryScreenProps {
  progress: LoadProgress;
  ready: boolean;
  onEnter: () => void;
}

const HINTS = [
  { keys: ['W', 'A', 'S', 'D'], label: 'move' },
  { keys: ['Mouse'], label: 'look' },
  { keys: ['Shift'], label: 'walk slowly' },
] as const;

export function EntryScreen({ progress, ready, onEnter }: EntryScreenProps) {
  const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center
                 bg-[radial-gradient(ellipse_at_50%_40%,rgba(60,110,160,0.16),transparent_60%),linear-gradient(160deg,#0b0d12_0%,#101319_55%,#0b0d12_100%)]"
    >
      <BrandMark size="lg" />

      <p className="mb-8 mt-5 text-[11px] uppercase tracking-[0.42em] text-slate-500">
        Immersive Concept Store
      </p>

      <button
        type="button"
        disabled={!ready}
        onClick={onEnter}
        className={`rounded-sm border px-14 py-3.5 font-display text-[15px] tracking-[0.14em] transition-all
                    ${
                      ready
                        ? 'border-aura-300/40 bg-aura-300/10 text-aura-200 hover:border-aura-300/80 hover:bg-aura-300/20 hover:shadow-[0_0_34px_rgba(100,180,255,.25)]'
                        : 'pointer-events-none border-white/10 bg-white/[0.03] text-slate-600'
                    }`}
      >
        ENTER STORE
      </button>

      <div className="mt-7 w-64">
        <div className="h-[2px] w-full overflow-hidden bg-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-aura-500 to-aura-100 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2.5 text-center text-[10px] uppercase tracking-[0.22em] text-slate-600">
          {ready ? 'Ready' : `Loading models… ${progress.loaded} / ${progress.total}`}
        </p>
      </div>

      <div className="mt-9 space-y-2 text-center text-xs text-slate-600">
        <p className="flex items-center justify-center gap-2">
          {HINTS.map((hint, index) => (
            <span key={hint.label} className="flex items-center gap-1.5">
              {index > 0 && <span className="mx-1.5 text-slate-700">·</span>}
              {hint.keys.map((key) => (
                <kbd key={key} className="key-cap w-auto px-2">
                  {key}
                </kbd>
              ))}
              <span className="ml-0.5">{hint.label}</span>
            </span>
          ))}
        </p>
        <p>
          <kbd className="key-cap inline-flex w-auto px-2">Click</kbd>
          <span className="mx-2">or</span>
          <kbd className="key-cap inline-flex">E</kbd>
          <span className="ml-2">inspect a product</span>
          <span className="mx-2 text-slate-700">·</span>
          <kbd className="key-cap inline-flex">C</kbd>
          <span className="ml-2">cart</span>
        </p>
      </div>
    </div>
  );
}
