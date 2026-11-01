import { describe, it, expect } from "vitest";
import { calculateContrastRatio, parseHex, relativeLuminance } from "./contrast";

describe("WCAG 2.2 Color Contrast Invariants & Token Verification", () => {
  // Light Theme Tokens
  const lightTokens = {
    canvas: "#ffffff",
    canvasSubtle: "#f7f8fc",
    canvasSunken: "#eef1f8",
    canvasCard: "#ffffff",
    inkPrimary: "#0b1020",
    inkSecondary: "#2d3748",
    inkMuted: "#475569",
    brandTeal: "#0f766e",
    brandMarigold: "#b45309",
    statusSuccess: "#15803d",
    statusWarning: "#b45309",
    statusDanger: "#b91c1c",
  };

  // Dark Theme Tokens
  const darkTokens = {
    canvas: "#0b132b",
    canvasSubtle: "#1c2541",
    canvasSunken: "#0a1128",
    canvasCard: "#1c2541",
    inkPrimary: "#faf7f2",
    inkSecondary: "#e2e8f0",
    inkMuted: "#94a3b8",
    brandTeal: "#2dd4bf",
    brandMarigold: "#fbbf24",
    statusSuccess: "#4ade80",
    statusWarning: "#fbbf24",
    statusDanger: "#f87171",
  };

  describe("Light Theme Contrast Invariants", () => {
    it("primary body text achieves AAA contrast (>= 7.0:1) on white canvas", () => {
      const ratio = calculateContrastRatio(lightTokens.inkPrimary, lightTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("secondary text achieves AAA contrast (>= 7.0:1) on white canvas", () => {
      const ratio = calculateContrastRatio(lightTokens.inkSecondary, lightTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("muted caption text achieves AA contrast (>= 4.5:1) on white canvas", () => {
      const ratio = calculateContrastRatio(lightTokens.inkMuted, lightTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("brand teal passes AA normal text contrast (>= 4.5:1) on white canvas", () => {
      const ratio = calculateContrastRatio(lightTokens.brandTeal, lightTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("status danger passes AA contrast (>= 4.5:1) on white canvas", () => {
      const ratio = calculateContrastRatio(lightTokens.statusDanger, lightTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("status success passes AA contrast (>= 4.5:1) on white canvas", () => {
      const ratio = calculateContrastRatio(lightTokens.statusSuccess, lightTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Dark Theme Contrast Invariants", () => {
    it("primary body text achieves AAA contrast (>= 7.0:1) on dark canvas", () => {
      const ratio = calculateContrastRatio(darkTokens.inkPrimary, darkTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("secondary text achieves AAA contrast (>= 7.0:1) on dark canvas", () => {
      const ratio = calculateContrastRatio(darkTokens.inkSecondary, darkTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("muted caption text achieves AA contrast (>= 4.5:1) on dark canvas", () => {
      const ratio = calculateContrastRatio(darkTokens.inkMuted, darkTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("brand teal passes AAA contrast (>= 7.0:1) on dark canvas", () => {
      const ratio = calculateContrastRatio(darkTokens.brandTeal, darkTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("status danger passes AA contrast (>= 4.5:1) on dark canvas", () => {
      const ratio = calculateContrastRatio(darkTokens.statusDanger, darkTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("status success passes AAA contrast (>= 7.0:1) on dark canvas", () => {
      const ratio = calculateContrastRatio(darkTokens.statusSuccess, darkTokens.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe("Worst-Case Backdrop Glass Surface Invariants", () => {
    // Sampled worst-case mesh gradient colors
    const worstCaseGradients = [
      "#f0fdf4", // Very light mint
      "#fef3c7", // Light amber
      "#f8fafc", // Near white slate
      "#1e293b", // Slate 800 dark
      "#0f172a", // Slate 900 dark
    ];

    it("primary ink retains >= 4.5:1 contrast against light mesh gradient samples", () => {
      for (const sample of worstCaseGradients.slice(0, 3)) {
        const ratio = calculateContrastRatio(lightTokens.inkPrimary, sample);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it("dark theme inkPrimary retains >= 7.0:1 contrast against dark mesh gradient samples", () => {
      for (const sample of worstCaseGradients.slice(3)) {
        const ratio = calculateContrastRatio(darkTokens.inkPrimary, sample);
        expect(ratio).toBeGreaterThanOrEqual(7.0);
      }
    });
  });
});

