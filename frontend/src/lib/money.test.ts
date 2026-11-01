import { describe, it, expect } from "vitest";
import {
  toBigIntPaise,
  formatMoney,
  formatMoneyCompact,
  rupeesToPaise,
  paiseToRupees,
  PAISE_PER_RUPEE,
  PAISE_PER_LAKH,
  PAISE_PER_CRORE,
} from "./money";

describe("Money Utility - Zero Rounding Integer Arithmetic", () => {
  describe("toBigIntPaise", () => {
    it("preserves BigInt inputs unchanged", () => {
      expect(toBigIntPaise(500000n)).toBe(500000n);
      expect(toBigIntPaise(-100n)).toBe(-100n);
      expect(toBigIntPaise(0n)).toBe(0n);
    });

    it("converts number inputs into rounded BigInt paise", () => {
      expect(toBigIntPaise(12500)).toBe(12500n);
      expect(toBigIntPaise(125.4)).toBe(125n);
      expect(toBigIntPaise(125.6)).toBe(126n);
    });

    it("safely handles non-finite numbers (NaN, Infinity) by returning 0n", () => {
      expect(toBigIntPaise(NaN)).toBe(0n);
      expect(toBigIntPaise(Infinity)).toBe(0n);
      expect(toBigIntPaise(-Infinity)).toBe(0n);
    });
  });

  describe("formatMoney", () => {
    it("formats standard integer rupees with Indian comma grouping", () => {
      // ₹1,000.00 = 100000 paise
      expect(formatMoney(100000)).toBe("₹1,000");
      // ₹15,00,000 = 150000000 paise
      expect(formatMoney(150000000)).toBe("₹15,00,000");
      // ₹1,50,00,000 = 1500000000 paise
      expect(formatMoney(1500000000n)).toBe("₹1,50,00,000");
      // Under ₹1,000
      expect(formatMoney(50000)).toBe("₹500");
      expect(formatMoney(0)).toBe("₹0");
    });

    it("formats negative amounts with a leading minus sign", () => {
      expect(formatMoney(-5000000)).toBe("-₹50,000");
      expect(formatMoney(-150000000n)).toBe("-₹15,00,000");
    });

    it("formats paise fractional amounts when requested via showPaise", () => {
      // ₹500.50 = 50050 paise
      expect(formatMoney(50050, { showPaise: true })).toBe("₹500.50");
      // ₹1,000.05 = 100005 paise
      expect(formatMoney(100005, { showPaise: true })).toBe("₹1,000.05");
      // Negative with paise
      expect(formatMoney(-50050, { showPaise: true })).toBe("-₹500.50");
      // No paise to show
      expect(formatMoney(50000, { showPaise: true })).toBe("₹500");
    });
  });

  describe("formatMoneyCompact", () => {
    it("formats values >= 1 Crore as ₹X.XX Cr", () => {
      expect(formatMoneyCompact(PAISE_PER_CRORE)).toBe("₹1.00 Cr");
      expect(formatMoneyCompact(15_000_000_000n)).toBe("₹15.00 Cr");
      expect(formatMoneyCompact(1_250_000_000n)).toBe("₹1.25 Cr");
    });

    it("formats values >= 1 Lakh as ₹X.X L", () => {
      expect(formatMoneyCompact(PAISE_PER_LAKH)).toBe("₹1.0 L");
      expect(formatMoneyCompact(15_000_000n)).toBe("₹1.5 L");
      expect(formatMoneyCompact(50_000_000n)).toBe("₹5.0 L");
    });

    it("formats values under 1 Lakh using standard formatMoney", () => {
      expect(formatMoneyCompact(5000000)).toBe("₹50,000");
      expect(formatMoneyCompact(9999900)).toBe("₹99,999");
    });

    it("preserves negative signs in compact formatting", () => {
      expect(formatMoneyCompact(-PAISE_PER_CRORE)).toBe("-₹1.00 Cr");
      expect(formatMoneyCompact(-PAISE_PER_LAKH * 5n)).toBe("-₹5.0 L");
    });
  });

  describe("rupeesToPaise & paiseToRupees Conversions", () => {
    it("converts float and string rupees to integer paise without floating point drift", () => {
      expect(rupeesToPaise(100)).toBe(10000);
      expect(rupeesToPaise(100.55)).toBe(10055);
      expect(rupeesToPaise(0.1 + 0.2)).toBe(30); // 0.30000000000000004 -> 30
      expect(rupeesToPaise("₹ 1,50,000")).toBe(15000000);
      expect(rupeesToPaise("invalid")).toBe(0);
      expect(rupeesToPaise(NaN)).toBe(0);
    });

    it("converts integer paise back to float rupees", () => {
      expect(paiseToRupees(10000)).toBe(100);
      expect(paiseToRupees(10055n)).toBe(100.55);
      expect(paiseToRupees(-5000)).toBe(-50);
      expect(paiseToRupees(0)).toBe(0);
    });
  });
});

