/**
 * WCAG 2.2 Relative Luminance and Contrast Ratio calculations.
 * Used for automated verification of color token contrast pairs.
 */

export function parseHex(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function channelLuminance(value8Bit: number): number {
  const srgb = value8Bit / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);

  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Blend foreground RGBA over background RGB.
 */
export function blendRgbaOverRgb(
  fgRgba: [number, number, number, number],
  bgRgb: [number, number, number]
): [number, number, number] {
  const [r1, g1, b1, a] = fgRgba;
  const [r2, g2, b2] = bgRgb;
  return [
    Math.round(r1 * a + r2 * (1 - a)),
    Math.round(g1 * a + g2 * (1 - a)),
    Math.round(b1 * a + bgRgb[2] * (1 - a)),
  ];
}

