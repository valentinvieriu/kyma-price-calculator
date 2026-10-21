import snapToStep from './snapToStep';
import { describe, expect, test } from 'vitest';

describe('snapToStep — integer steps', () => {
  const storage = { min: 0, max: 3200, step: 32 };

  test.each([
    [0, 0],
    [32, 32],
    [40, 32], // rounds down to nearest step
    [48, 64], // halfway rounds up
    [3199, 3200],
  ])('%d → %d', (input, expected) => {
    expect(snapToStep(input, storage)).toBe(expected);
  });

  test('clamps below min and above max', () => {
    expect(snapToStep(-50, storage)).toBe(0);
    expect(snapToStep(10_000, storage)).toBe(3200);
  });

  test('steps are counted from min, not zero', () => {
    expect(snapToStep(4, { min: 3, max: 300, step: 2 })).toBe(5);
  });
});

describe('snapToStep — fractional steps', () => {
  const rate = { min: 0.01, max: 1.2, step: 0.01 };

  test.each([
    [0.07, 0.07],
    [0.257, 0.26],
    [1.06, 1.06],
    [1.199999, 1.2],
  ])('%d → %d without float noise', (input, expected) => {
    expect(snapToStep(input, rate)).toBe(expected);
  });
});

test('returns null for non-numeric input', () => {
  expect(snapToStep(NaN, { min: 0, max: 10, step: 1 })).toBeNull();
  expect(snapToStep(Infinity, { min: 0, max: 10, step: 1 })).toBeNull();
});
