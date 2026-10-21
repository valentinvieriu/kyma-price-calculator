import config from './config.json';
import { describe, expect, test } from 'vitest';

// Guards against inconsistent edits to config.json, which drives both pricing
// and the input ranges in the UI.

const onGrid = (value: number, min: number, step: number) => {
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
};

const rangeSettings = {
  Storage: config.Storage,
  NFSStorage: config.NFSStorage,
  SnapshotStorage: config.SnapshotStorage,
  AdditionalNodeVolume: config.nodeConfig.AdditionalNodeVolume,
  ConversionRate: config.ConversionRate,
  TimeConsumption: config.TimeConsumption,
};

describe.each(Object.entries(rangeSettings))('%s range', (_name, range) => {
  test('min < max and step > 0', () => {
    expect(range.Min).toBeLessThan(range.Max);
    expect(range.Step).toBeGreaterThan(0);
  });

  test('default and max are reachable on the step grid', () => {
    expect(range.Default).toBeGreaterThanOrEqual(range.Min);
    expect(range.Default).toBeLessThanOrEqual(range.Max);
    expect(onGrid(range.Default, range.Min, range.Step)).toBe(true);
    expect(onGrid(range.Max, range.Min, range.Step)).toBe(true);
  });
});

describe('autoscaler min', () => {
  const { Default, DefaultWorkerNodes, Min, MinWorkerNodes, Max } =
    config.nodeConfig.AutoScalerMin;

  test('defaults are within their ranges', () => {
    expect(Default).toBeGreaterThanOrEqual(Min);
    expect(Default).toBeLessThanOrEqual(Max);
    expect(DefaultWorkerNodes).toBeGreaterThanOrEqual(MinWorkerNodes);
    expect(DefaultWorkerNodes).toBeLessThanOrEqual(Max);
  });
});

test('storage UI steps match the billing block size', () => {
  // Billing uses Storage.Step as the block size for every disk type.
  const blockSize = config.Storage.Step;
  expect(config.NFSStorage.Step).toBe(blockSize);
  expect(config.SnapshotStorage.Step).toBe(blockSize);
  expect(config.nodeConfig.AdditionalNodeVolume.Step).toBe(blockSize);
});

describe('machine types', () => {
  const machineTypes = config.nodeConfig.MachineTypes;

  test('names are unique', () => {
    const names = machineTypes.map((t) => t.value);
    expect(new Set(names).size).toBe(names.length);
  });

  describe.each(machineTypes.map((t) => [t.value, t] as const))(
    '%s',
    (_name, machineType) => {
      test('has a positive price multiple and at least one VM size', () => {
        expect(machineType.multiple).toBeGreaterThan(0);
        expect(machineType.VMSizeOptions.length).toBeGreaterThan(0);
      });

      test('VM size labels are unique', () => {
        const labels = machineType.VMSizeOptions.map((o) => o.value);
        expect(new Set(labels).size).toBe(labels.length);
      });

      test.each(machineType.VMSizeOptions.map((o) => [o.value, o] as const))(
        '"%s" label matches its vcpus/memory and has positive CU',
        (label, option) => {
          expect(label).toBe(
            `${option.vcpus} CPU - ${option.memoryGib}GiB RAM`,
          );
          expect(option.computeUnits).toBeGreaterThan(0);
        },
      );
    },
  );
});

describe('Redis tiers', () => {
  const tiers = config.RedisCosts.Tiers;

  test('keys are unique', () => {
    const keys = tiers.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('the first (default) tier is free', () => {
    expect(tiers[0]).toEqual({ key: 'None', storageGib: 0 });
  });

  test('paid tiers have positive storage', () => {
    tiers.slice(1).forEach((t) => expect(t.storageGib).toBeGreaterThan(0));
  });
});

test('documentation links use https', () => {
  Object.values(config.documentationUrls).forEach((url) =>
    expect(url).toMatch(/^https:\/\//),
  );
});
