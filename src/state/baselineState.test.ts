import { describe, expect, test } from 'vitest';
import { describeChanges } from './baselineState';
import { DEFAULT_SNAPSHOT } from './configSnapshot';

describe('describeChanges', () => {
  test('reports nothing for an identical configuration', () => {
    expect(describeChanges(DEFAULT_SNAPSHOT, DEFAULT_SNAPSHOT)).toEqual([]);
  });

  test('separates cluster changes from billing assumptions', () => {
    const current = {
      ...DEFAULT_SNAPSHOT,
      redisTier: 'Standard1',
      conversionRate: 0.8,
    };
    expect(describeChanges(DEFAULT_SNAPSHOT, current)).toEqual([
      'configuration',
      'conversion rate',
    ]);
  });

  test('detects changed running hours alone', () => {
    expect(
      describeChanges(DEFAULT_SNAPSHOT, {
        ...DEFAULT_SNAPSHOT,
        hoursPerMonth: 360,
      }),
    ).toEqual(['running hours']);
  });
});
