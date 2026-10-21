import { createStore } from 'jotai';
import { beforeEach, describe, expect, test } from 'vitest';
import config from '../config.json';
import {
  additionalCostsAtom,
  costReportAtom,
  machineSetupsAtom,
  nodeConfigCostsAtom,
  poolCostsAtom,
  storageCostsAtom,
  totalCostsAtom,
} from './costState';
import {
  additionalMachineSetupState,
  baseMachineSetupState,
  createMachineSetup,
  MachineSetup,
} from './nodes/machineSetupState';
import { GiBQuantityState } from './storage/GiBQuantityState';
import { nfsGiBQuantityState } from './storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from './storage/snapshotGiBQuantityState';
import { timeConsumptionState } from './additionalConfig/timeConsumptionState';
import { applyConversionRateState } from './additionalConfig/applyConversionRateState';
import { redisState } from './additionalConfig/redisState';

// Wires the UI state atoms to the pricing functions. Expected values are
// derived by hand: compute = nodes * CU * 0.12 * hours, storage block = 0.02/h.

const [generalPurpose, computeOptimized] = config.nodeConfig.MachineTypes;

function pool(overrides: Partial<MachineSetup> = {}): MachineSetup {
  return { ...createMachineSetup(crypto.randomUUID(), 1), ...overrides };
}

function redisTier(key: string) {
  const tier = config.RedisCosts.Tiers.find((t) => t.key === key)!;
  return { tier: tier.key, storageGib: tier.storageGib };
}

let store: ReturnType<typeof createStore>;

beforeEach(() => {
  store = createStore();
});

describe('default state', () => {
  test('bills only the base pool: 3 nodes × 3 CU × 0.12 × 720 h', () => {
    expect(store.get(nodeConfigCostsAtom)).toBeCloseTo(777.6, 10);
    expect(store.get(storageCostsAtom)).toBe(0);
    expect(store.get(additionalCostsAtom)).toBe(0);
    expect(store.get(totalCostsAtom).CU).toBeCloseTo(777.6, 10);
    expect(store.get(totalCostsAtom).CC).toBeCloseTo(777.6, 10);
  });

  test('base pool uses the first machine type and VM size', () => {
    const base = store.get(baseMachineSetupState);
    expect(base.machineType).toBe(generalPurpose);
    expect(base.VMSize).toBe(generalPurpose.VMSizeOptions[0]);
    expect(base.minAutoscaler).toBe(config.nodeConfig.AutoScalerMin.Default);
  });
});

describe('node pools', () => {
  test('machineSetupsAtom lists the base pool first, then additional pools', () => {
    const extra = [pool(), pool()];
    store.set(additionalMachineSetupState, extra);

    expect(store.get(machineSetupsAtom)).toEqual([
      store.get(baseMachineSetupState),
      ...extra,
    ]);
  });

  test('each additional pool adds its compute cost', () => {
    store.set(additionalMachineSetupState, [
      // 1 × 3 CU × 0.12 × 720 = 259.2
      pool(),
      // 4 × 8 CU × 0.12 × 720 = 2764.8
      pool({
        machineType: computeOptimized,
        VMSize: computeOptimized.VMSizeOptions[2],
        minAutoscaler: 4,
      }),
    ]);

    expect(store.get(nodeConfigCostsAtom)).toBeCloseTo(
      777.6 + 259.2 + 2764.8,
      10,
    );
  });

  test('additional node volume is billed under storage, not worker nodes', () => {
    // 64 GiB × 0.000625 × 10 nodes × 720 h = 288
    store.set(baseMachineSetupState, {
      ...store.get(baseMachineSetupState),
      minAutoscaler: 10,
      additionalVolumeGib: 64,
    });

    const [basePool] = store.get(poolCostsAtom);
    expect(basePool.volumeCosts).toBeCloseTo(288, 10);
    expect(store.get(storageCostsAtom)).toBeCloseTo(288, 10);
    expect(store.get(nodeConfigCostsAtom)).toBeCloseTo(10 * 3 * 0.12 * 720, 10);
  });

  test('additional node volume is summed across pools', () => {
    store.set(additionalMachineSetupState, [
      // 32 GiB × 0.000625 × 2 × 720 = 28.8
      pool({ minAutoscaler: 2, additionalVolumeGib: 32 }),
    ]);
    store.set(GiBQuantityState, 64); // 1 billable block = 14.4

    expect(store.get(storageCostsAtom)).toBeCloseTo(28.8 + 14.4, 10);
  });
});

describe('storage and additional services', () => {
  test('standard, NFS and snapshot storage are combined', () => {
    store.set(GiBQuantityState, 160); // (5 - 1 free) × 14.4 = 57.6
    store.set(nfsGiBQuantityState, 160); // 5 × 3 × 14.4 = 216
    store.set(snapshotGiBQuantityState, 32); // 1 × 14.4

    expect(store.get(storageCostsAtom)).toBeCloseTo(57.6 + 216 + 14.4, 10);
  });

  test('Redis tier drives additional costs', () => {
    store.set(redisState, redisTier('Standard4'));
    // 1915 / 32 × 0.02 × 720 = 861.75
    expect(store.get(additionalCostsAtom)).toBeCloseTo(861.75, 10);
  });
});

describe('global modifiers', () => {
  test('time consumption scales every cost linearly', () => {
    store.set(GiBQuantityState, 96);
    store.set(redisState, redisTier('Standard1'));
    const fullMonth = store.get(totalCostsAtom).CU;

    store.set(timeConsumptionState, 360);
    expect(store.get(totalCostsAtom).CU).toBeCloseTo(fullMonth / 2, 10);
  });

  test('conversion rate affects only the currency total', () => {
    store.set(applyConversionRateState, 0.5);

    const total = store.get(totalCostsAtom);
    expect(total.CU).toBeCloseTo(777.6, 10);
    expect(total.CC).toBeCloseTo(388.8, 10);
  });
});

describe('end-to-end scenario (mirrors tests/integration.test.js)', () => {
  test('matches the cost shown at the end of the Cypress journey', () => {
    store.set(baseMachineSetupState, {
      ...store.get(baseMachineSetupState),
      VMSize: generalPurpose.VMSizeOptions[1], // 4 CPU, CU 4
      minAutoscaler: 10,
      additionalVolumeGib: 64,
    });
    store.set(additionalMachineSetupState, [
      pool({
        machineType: computeOptimized,
        VMSize: computeOptimized.VMSizeOptions[2], // 8 CPU - 16GiB, CU 8
        minAutoscaler: 5,
      }),
    ]);
    store.set(GiBQuantityState, 160);
    store.set(nfsGiBQuantityState, 160);
    store.set(redisState, redisTier('Standard4'));

    // nodes: 10 × 4 CU × 0.12 × 720 = 3456, plus 5 × 8 CU × 0.12 × 720 = 3456
    expect(store.get(nodeConfigCostsAtom)).toBeCloseTo(6912, 10);
    // storage: volume 288 + standard 57.6 + NFS 216
    expect(store.get(storageCostsAtom)).toBeCloseTo(561.6, 10);
    expect(store.get(additionalCostsAtom)).toBeCloseTo(861.75, 10);
    expect(store.get(totalCostsAtom).CU).toBeCloseTo(8335.35, 10);
  });
});

describe('costReportAtom', () => {
  test('captures inputs and computed costs consistently', () => {
    store.set(GiBQuantityState, 64);
    store.set(nfsGiBQuantityState, 32);
    store.set(snapshotGiBQuantityState, 96);
    store.set(redisState, redisTier('Premium1'));
    store.set(applyConversionRateState, 0.8);
    store.set(timeConsumptionState, 500);

    const report = store.get(costReportAtom);

    expect(report.storage).toEqual({
      standardGib: 64,
      nfsGib: 32,
      snapshotGib: 96,
    });
    expect(report.redis.tier).toBe('Premium1');
    expect(report.conversionRate).toBe(0.8);
    expect(report.timeConsumption).toBe(500);
    expect(report.pools).toEqual(store.get(poolCostsAtom));
    expect(report.nodeConfigCosts).toBe(store.get(nodeConfigCostsAtom));
    expect(report.storageCosts).toBe(store.get(storageCostsAtom));
    expect(report.additionalCosts).toBe(store.get(additionalCostsAtom));
    expect(report.totalCosts).toEqual(store.get(totalCostsAtom));
  });
});
