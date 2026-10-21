import { describe, expect, test } from 'vitest';
import {
  NODE_VOLUME_BLOCK_HOURLY_RATE,
  STORAGE_BLOCK_HOURLY_RATE,
  nodeHourlyRate,
} from './rates';
import calculateNodeConfigCosts from './nodeConfigCosts/calculateNodeConfigCosts';

describe('rates', () => {
  test('node rate × nodes × hours equals the node cost', () => {
    const rate = nodeHourlyRate(3, 1);
    expect(rate).toBeCloseTo(0.36, 10);
    expect(3 * rate * 720).toBeCloseTo(
      calculateNodeConfigCosts({
        timeConsumption: 720,
        computeUnits: 3,
        minAutoscaler: 3,
        machineTypeFactor: 1,
      }),
      10,
    );
  });

  test('extra node volume is billed at the standard block rate', () => {
    expect(NODE_VOLUME_BLOCK_HOURLY_RATE).toBeCloseTo(
      STORAGE_BLOCK_HOURLY_RATE,
      10,
    );
  });
});
