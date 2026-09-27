export const RAZORPAY = {
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID ?? 'rzp_test_Wuz8bXmAOu9wFA',
  storeName: import.meta.env.VITE_STORE_NAME ?? 'AURA',
  currency: 'INR',
  themeColor: '#1e6fb8',
  scriptSrc: 'https://checkout.razorpay.com/v1/checkout.js',
} as const;

export const toPaise = (rupees: number): number => Math.round(rupees * 100);
