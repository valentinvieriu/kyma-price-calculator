export interface Range {
  min: number;
  max: number;
  step: number;
}

// Clamps a value into [min, max] and rounds it to the nearest step from min.
// Returns null for unparseable input.
export default function snapToStep(
  value: number,
  { min, max, step }: Range,
): number | null {
  if (!Number.isFinite(value)) return null;
  const snapped = min + Math.round((value - min) / step) * step;
  const clamped = Math.min(Math.max(snapped, min), max);
  // Strip float noise from fractional steps (e.g. 0.01 + 6 * 0.01).
  return parseFloat(clamped.toFixed(10));
}
