/**
 * CELESTIA Unified Currency & Money Utility
 * Zero-rounding integer arithmetic on paise (minor units).
 * Enforces Indian Numbering System (Lakh/Crore grouping) using Intl.NumberFormat('en-IN').
 */

export const PAISE_PER_RUPEE = 100n;
export const PAISE_PER_LAKH = 10_000_000n; // 1,00,000 * 100
export const PAISE_PER_CRORE = 1_000_000_000n; // 1,00,00,000 * 100

export type MinorUnits = number | bigint;

/**
 * Normalizes input to BigInt paise.
 */
export function toBigIntPaise(amount: MinorUnits): bigint {
  if (typeof amount === "bigint") {
    return amount;
  }
  if (!Number.isFinite(amount)) {
    return 0n;
  }
  return BigInt(Math.round(amount));
}

/**
 * Formats minor units (paise) into full INR string representation (e.g. ₹15,00,000).
 */
export function formatMoney(
  amountMinor: MinorUnits,
  options: { showPaise?: boolean } = {}
): string {
  const paise = toBigIntPaise(amountMinor);
  const isNegative = paise < 0n;
  const absPaise = isNegative ? -paise : paise;

  const rupeesPart = absPaise / PAISE_PER_RUPEE;
  const paisePart = Number(absPaise % PAISE_PER_RUPEE);

  // Group according to Indian system: last 3 digits, then groups of 2
  const rupeesStr = rupeesPart.toString();
  let formattedRupees = "";

  if (rupeesStr.length <= 3) {
    formattedRupees = rupeesStr;
  } else {
    const lastThree = rupeesStr.slice(-3);
    const remaining = rupeesStr.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formattedRupees = `${groups},${lastThree}`;
  }

  const sign = isNegative ? "-" : "";
  if (options.showPaise && paisePart > 0) {
    const paiseStr = paisePart.toString().padStart(2, "0");
    return `${sign}₹${formattedRupees}.${paiseStr}`;
  }
  return `${sign}₹${formattedRupees}`;
}

/**
 * Compact Indian Lakh/Crore formatter (e.g. ₹15.0L, ₹1.50 Cr).
 */
export function formatMoneyCompact(amountMinor: MinorUnits): string {
  const paise = toBigIntPaise(amountMinor);
  const isNegative = paise < 0n;
  const absPaise = isNegative ? -paise : paise;
  const sign = isNegative ? "-" : "";

  if (absPaise >= PAISE_PER_CRORE) {
    const crValue = Number(absPaise) / Number(PAISE_PER_CRORE);
    return `${sign}₹${crValue.toFixed(2)} Cr`;
  }

  if (absPaise >= PAISE_PER_LAKH) {
    const lValue = Number(absPaise) / Number(PAISE_PER_LAKH);
    return `${sign}₹${lValue.toFixed(1)} L`;
  }

  return formatMoney(amountMinor);
}

/**
 * Safely converts Rupees to integer Paise minor units without floating point drift.
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === "string") {
    const sanitized = rupees.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(sanitized);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts Paise minor units to Rupees float for display inputs.
 */
export function paiseToRupees(paise: MinorUnits): number {
  return Number(toBigIntPaise(paise)) / 100;
}
