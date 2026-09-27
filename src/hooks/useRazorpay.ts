import { useCallback, useEffect, useRef } from 'react';
import { RAZORPAY, toPaise } from '@/config/razorpay.config';
import type { CartLine } from '@/types';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): { open: () => void };
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

interface UseRazorpayArgs {
  onSuccess: (paymentId: string) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
}

export function useRazorpay({ onSuccess, onDismiss, onError }: UseRazorpayArgs) {
  const scriptPromise = useRef<Promise<void> | null>(null);

  const loadScript = useCallback((): Promise<void> => {
    if (window.Razorpay) return Promise.resolve();
    if (scriptPromise.current) return scriptPromise.current;

    scriptPromise.current = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RAZORPAY.scriptSrc;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
      document.body.appendChild(script);
    });

    return scriptPromise.current;
  }, []);

  useEffect(() => {
    loadScript().catch(() => {
      /* surfaced on open() instead */
    });
  }, [loadScript]);

  const openCheckout = useCallback(
    async (lines: readonly CartLine[], total: number) => {
      if (!lines.length) {
        onError('Add items to your cart first');
        return;
      }

      try {
        await loadScript();
      } catch {
        onError('Could not reach Razorpay. Check your connection.');
        return;
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        onError('Razorpay Checkout unavailable');
        return;
      }

      const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

      const checkout = new Razorpay({
        key: RAZORPAY.keyId,
        amount: toPaise(total),
        currency: RAZORPAY.currency,
        name: RAZORPAY.storeName,
        description: `${itemCount} item${itemCount === 1 ? '' : 's'} from AURA Concept Store`,
        handler: (response) => onSuccess(response.razorpay_payment_id),
        modal: { ondismiss: onDismiss },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: RAZORPAY.themeColor },
      });

      checkout.open();
    },
    [loadScript, onDismiss, onError, onSuccess],
  );

  return { openCheckout };
}
