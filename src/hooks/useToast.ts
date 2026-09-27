import { useEffect } from 'react';
import { useUiStore } from '@/store/useUiStore';

export function useToastAutoDismiss(delayMs = 2400): void {
  const toast = useUiStore((state) => state.toast);
  const clearToast = useUiStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, delayMs);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast, delayMs]);
}
