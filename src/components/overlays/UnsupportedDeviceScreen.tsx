import { BrandMark } from '@/components/hud/BrandMark';

const REQUIREMENTS = [
  { keys: ['W', 'A', 'S', 'D'], label: 'to walk the floor' },
  { keys: ['Mouse'], label: 'to look around' },
  { keys: ['E'], label: 'to inspect a product' },
] as const;

export function UnsupportedDeviceScreen() {
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-y-auto px-7 py-12
                 bg-[radial-gradient(ellipse_at_50%_35%,rgba(60,110,160,0.16),transparent_60%),linear-gradient(160deg,#0b0d12_0%,#101319_55%,#0b0d12_100%)]"
    >
      <BrandMark size="lg" />

      <p className="mb-10 mt-5 text-center text-[11px] uppercase tracking-[0.42em] text-slate-500">
        Immersive Concept Store
      </p>

      <div className="panel w-full max-w-sm rounded-sm px-7 py-8 text-center">
        <p className="font-display text-[15px] tracking-[0.14em] text-aura-200">
          PLEASE OPEN ON A COMPUTER
        </p>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          AURA is a first-person 3D store you walk through with a keyboard and mouse.
        </p>

        <div className="my-7 h-px w-full bg-white/[0.07]" />

        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-600">You’ll need</p>

        <ul className="mt-4 space-y-2.5 text-xs text-slate-500">
          {REQUIREMENTS.map((requirement) => (
            <li key={requirement.label} className="flex items-center justify-center gap-1.5">
              {requirement.keys.map((key) => (
                <kbd key={key} className="key-cap w-auto px-2">
                  {key}
                </kbd>
              ))}
              <span className="ml-1">{requirement.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 max-w-sm text-center text-[11px] leading-relaxed text-slate-600">
        Visit this page again from a desktop browser — Chrome, Edge, Firefox or Safari — and the
        store will load automatically.
      </p>
    </div>
  );
}
