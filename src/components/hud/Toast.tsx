interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-24 left-1/2 z-[150] -translate-x-1/2 rounded-sm
                  border border-aura-300/30 bg-ink-700/95 px-6 py-3 text-[12.5px] text-aura-200
                  backdrop-blur-md transition-all duration-300 ease-out-expo
                  ${message ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
    >
      {message}
    </div>
  );
}
