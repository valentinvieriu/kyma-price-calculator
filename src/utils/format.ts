import config from '../config.json';

const LOCALE = 'de-DE';

export function formatCost(num: number): string {
  return num.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// For unit prices and counts in formulas: no trailing zeros beyond two
// decimals, but enough precision to show rates like 0,02.
export function formatNumber(num: number, maxDecimals = 4): string {
  return num.toLocaleString(LOCALE, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: maxDecimals,
  });
}

export const formatCU = (num: number) => `${formatCost(num)} CU`;

export const formatCurrency = (num: number) =>
  `${formatCost(num)} ${config.CurrencyCode}`;

export const formatPercent = (share: number) =>
  `${(share * 100).toLocaleString(LOCALE, { maximumFractionDigits: 0 })} %`;

export const plural = (count: number, word: string) =>
  `${formatNumber(count)} ${word}${count === 1 ? '' : 's'}`;
