export const formatRupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
