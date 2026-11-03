import { describe, expect, test } from 'vitest';
import { averageNodes, loadProfileLabel, poolsLoadLabel } from './loadProfiles';

const pool = (
  minAutoscaler: number,
  maxAutoscaler: number,
  loadPercent: number,
) => ({
  minAutoscaler,
  maxAutoscaler,
  loadPercent,
});

describe('load profiles', () => {
  test('names profiles and describes custom shares', () => {
    expect(loadProfileLabel(12)).toBe('Daily peaks');
    expect(loadProfileLabel(30)).toBe('Business hours');
    expect(loadProfileLabel(20)).toBe('20 % at maximum');
  });

  test('averages the nodes between minimum and maximum', () => {
    expect(averageNodes(3, 20, 12)).toBeCloseTo(5.04, 10);
    expect(averageNodes(3, 3, 50)).toBe(3);
  });

  test('summarises the load of the pools that can scale', () => {
    expect(poolsLoadLabel([pool(3, 20, 12), pool(2, 2, 60)])).toBe(
      'Daily peaks',
    );
    expect(poolsLoadLabel([pool(3, 20, 12), pool(2, 4, 60)])).toBe(
      'Set per pool',
    );
  });
});
