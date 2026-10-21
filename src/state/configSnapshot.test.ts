import { createStore } from 'jotai';
import { beforeEach, describe, expect, test } from 'vitest';
import config from '../config.json';
import {
  ConfigSnapshot,
  configSnapshotAtom,
  decodeSnapshot,
  DEFAULT_SNAPSHOT,
  encodeSnapshot,
  isDefaultSnapshot,
} from './configSnapshot';
import { totalCostsAtom } from './costState';
import {
  additionalMachineSetupState,
  baseMachineSetupState,
} from './nodes/machineSetupState';

const [generalPurpose, computeOptimized] = config.nodeConfig.MachineTypes;

const custom: ConfigSnapshot = {
  pools: [
    {
      machineType: generalPurpose.value,
      vmSize: generalPurpose.VMSizeOptions[1].value,
      nodes: 10,
      extraVolumeGib: 64,
    },
    {
      machineType: computeOptimized.value,
      vmSize: computeOptimized.VMSizeOptions[2].value,
      nodes: 5,
      extraVolumeGib: 0,
    },
  ],
  storage: { standardGib: 160, nfsGib: 160, snapshotGib: 0 },
  redisTier: 'Standard4',
  hoursPerMonth: 720,
  conversionRate: 0.8,
};

let store: ReturnType<typeof createStore>;

beforeEach(() => {
  store = createStore();
});

describe('configSnapshotAtom', () => {
  test('reads the default state as DEFAULT_SNAPSHOT', () => {
    expect(store.get(configSnapshotAtom)).toEqual(DEFAULT_SNAPSHOT);
    expect(isDefaultSnapshot(store.get(configSnapshotAtom))).toBe(true);
  });

  test('round-trips a configuration through the atoms', () => {
    store.set(configSnapshotAtom, custom);

    expect(store.get(configSnapshotAtom)).toEqual(custom);
    // Same scenario as the end-to-end test in costState.test.ts.
    expect(store.get(totalCostsAtom).CU).toBeCloseTo(8335.35, 10);
  });

  test('resets to defaults', () => {
    store.set(configSnapshotAtom, custom);
    store.set(configSnapshotAtom, DEFAULT_SNAPSHOT);

    expect(isDefaultSnapshot(store.get(configSnapshotAtom))).toBe(true);
    expect(store.get(additionalMachineSetupState)).toEqual([]);
  });

  test('sanitizes out-of-range and unknown values', () => {
    store.set(configSnapshotAtom, {
      ...custom,
      pools: [
        { ...custom.pools[0], machineType: computeOptimized.value, nodes: 1 },
        { ...custom.pools[1], vmSize: 'unknown', nodes: 9999 },
      ],
      storage: { standardGib: 40, nfsGib: -5, snapshotGib: NaN },
      redisTier: 'nope',
      hoursPerMonth: 5000,
    });

    const base = store.get(baseMachineSetupState);
    expect(base.machineType).toBe(generalPurpose);
    expect(base.minAutoscaler).toBe(config.nodeConfig.AutoScalerMin.Min);

    const [extra] = store.get(additionalMachineSetupState);
    expect(extra.VMSize).toBe(computeOptimized.VMSizeOptions[0]);
    expect(extra.minAutoscaler).toBe(config.nodeConfig.AutoScalerMin.Max);

    const snapshot = store.get(configSnapshotAtom);
    expect(snapshot.storage).toEqual({
      // Requested sizes are kept; billing rounds them up to blocks.
      standardGib: 40,
      nfsGib: 0,
      snapshotGib: 0,
    });
    expect(snapshot.redisTier).toBe('None');
    expect(snapshot.hoursPerMonth).toBe(config.TimeConsumption.Max);
  });
});

describe('encodeSnapshot / decodeSnapshot', () => {
  test('round-trips through a URL-safe string', () => {
    const encoded = encodeSnapshot(custom);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSnapshot(encoded)).toEqual(custom);
  });

  test('returns null for garbage', () => {
    expect(decodeSnapshot('not base64!')).toBeNull();
    expect(decodeSnapshot(encodeSnapshot(42 as never))).toBeNull();
  });
});
