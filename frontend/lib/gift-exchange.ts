/** Keep in sync with `backend/src/common/constants/usd-khr-rate.ts` and i18n exchange copy. */
export const USD_KHR_EXCHANGE_RATE = 4000 as const;

export function formatUsdCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}
