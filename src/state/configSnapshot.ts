import { atom } from 'jotai';
import config from '../config.json';
import snapToStep from '../utils/snapToStep';
import { REQUESTED_SIZE_STEP_GIB } from '../calculatorFunctions/storageCosts/storageBlocks';
import {
  additionalMachineSetupState,
  baseMachineSetupState,
  MachineSetup,
  MachineType,
} from './nodes/machineSetupState';
import { GiBQuantityState } from './storage/GiBQuantityState';
import { nfsGiBQuantityState } from './storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from './storage/snapshotGiBQuantityState';
import { timeConsumptionState } from './additionalConfig/timeConsumptionState';
import { applyConversionRateState } from './additionalConfig/applyConversionRateState';
import { redisState } from './additionalConfig/redisState';

// Every user input as plain, serializable values. Used to reset the page, to
// share a configuration via URL and to restore a pinned baseline.

export interface PoolSnapshot {
  machineType: string;
  vmSize: string;
  nodes: number;
  extraVolumeGib: number;
}

export interface ConfigSnapshot {
  // The first pool is the base pool.
  pools: PoolSnapshot[];
  storage: { standardGib: number; nfsGib: number; snapshotGib: number };
  redisTier: string;
  hoursPerMonth: number;
  conversionRate: number;
}

const machineTypes: MachineType[] = config.nodeConfig.MachineTypes;
const { AutoScalerMin, AdditionalNodeVolume } = config.nodeConfig;

export const DEFAULT_SNAPSHOT: ConfigSnapshot = {
  pools: [
    {
      machineType: machineTypes[0].value,
      vmSize: machineTypes[0].VMSizeOptions[0].value,
      nodes: AutoScalerMin.Default,
      extraVolumeGib: AdditionalNodeVolume.Default,
    },
  ],
  storage: {
    standardGib: config.Storage.Default,
    nfsGib: config.NFSStorage.Default,
    snapshotGib: config.SnapshotStorage.Default,
  },
  redisTier: config.RedisCosts.Tiers[0].key,
  hoursPerMonth: config.TimeConsumption.Default,
  conversionRate: config.ConversionRate.Default,
};

function toPoolSnapshot(machine: MachineSetup): PoolSnapshot {
  return {
    machineType: machine.machineType.value,
    vmSize: machine.VMSize.value,
    nodes: machine.minAutoscaler,
    extraVolumeGib: machine.additionalVolumeGib,
  };
}

function toMachineSetup(pool: PoolSnapshot, id: string): MachineSetup {
  const machineType =
    machineTypes.find(({ value }) => value === pool.machineType) ??
    machineTypes[0];
  return {
    id,
    machineType,
    VMSize:
      machineType.VMSizeOptions.find(({ value }) => value === pool.vmSize) ??
      machineType.VMSizeOptions[0],
    minAutoscaler: pool.nodes,
    additionalVolumeGib: pool.extraVolumeGib,
  };
}

export const configSnapshotAtom = atom(
  (get): ConfigSnapshot => ({
    pools: [
      get(baseMachineSetupState),
      ...get(additionalMachineSetupState),
    ].map(toPoolSnapshot),
    storage: {
      standardGib: get(GiBQuantityState),
      nfsGib: get(nfsGiBQuantityState),
      snapshotGib: get(snapshotGiBQuantityState),
    },
    redisTier: get(redisState).tier,
    hoursPerMonth: get(timeConsumptionState),
    conversionRate: get(applyConversionRateState),
  }),
  (_get, set, snapshot: ConfigSnapshot) => {
    const { pools, storage } = sanitizeSnapshot(snapshot);
    const [base, ...additional] = pools;
    set(baseMachineSetupState, toMachineSetup(base, 'base'));
    set(
      additionalMachineSetupState,
      additional.map((pool) => toMachineSetup(pool, crypto.randomUUID())),
    );
    set(GiBQuantityState, storage.standardGib);
    set(nfsGiBQuantityState, storage.nfsGib);
    set(snapshotGiBQuantityState, storage.snapshotGib);

    const tier =
      config.RedisCosts.Tiers.find(({ key }) => key === snapshot.redisTier) ??
      config.RedisCosts.Tiers[0];
    set(redisState, { tier: tier.key, storageGib: tier.storageGib });
    set(
      timeConsumptionState,
      clamp(snapshot.hoursPerMonth, config.TimeConsumption),
    );
    set(
      applyConversionRateState,
      clamp(snapshot.conversionRate, config.ConversionRate),
    );
  },
);
configSnapshotAtom.debugLabel = 'configSnapshotAtom';

interface Bounds {
  Default: number;
  Min: number;
  Max: number;
  Step: number;
}

// Storage sizes keep the GiB the user asked for, not the billed block size.
const gibBounds = (bounds: Bounds): Bounds => ({
  ...bounds,
  Step: REQUESTED_SIZE_STEP_GIB,
});

function clamp(value: unknown, bounds: Bounds): number {
  return (
    snapToStep(Number(value), {
      min: bounds.Min,
      max: bounds.Max,
      step: bounds.Step,
    }) ?? bounds.Default
  );
}

// Snapshots can come from a hand-edited URL: keep every value in range and
// force the base pool onto the machine type it is restricted to.
function sanitizeSnapshot(snapshot: ConfigSnapshot): ConfigSnapshot {
  const pools = Array.isArray(snapshot.pools) ? snapshot.pools : [];
  const [base = DEFAULT_SNAPSHOT.pools[0], ...additional] = pools;
  const nodeBounds = (isBase: boolean) => ({
    ...AutoScalerMin,
    Min: isBase ? AutoScalerMin.Min : AutoScalerMin.MinWorkerNodes,
  });
  const sanitizePool = (pool: PoolSnapshot, isBase: boolean) => ({
    machineType: isBase ? machineTypes[0].value : String(pool.machineType),
    vmSize: String(pool.vmSize),
    nodes: clamp(pool.nodes, nodeBounds(isBase)),
    extraVolumeGib: clamp(pool.extraVolumeGib, gibBounds(AdditionalNodeVolume)),
  });

  return {
    ...snapshot,
    pools: [
      sanitizePool(base, true),
      ...additional.map((pool) => sanitizePool(pool, false)),
    ],
    storage: {
      standardGib: clamp(
        snapshot.storage?.standardGib,
        gibBounds(config.Storage),
      ),
      nfsGib: clamp(snapshot.storage?.nfsGib, gibBounds(config.NFSStorage)),
      snapshotGib: clamp(
        snapshot.storage?.snapshotGib,
        gibBounds(config.SnapshotStorage),
      ),
    },
  };
}

export function encodeSnapshot(snapshot: ConfigSnapshot): string {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeSnapshot(encoded: string): ConfigSnapshot | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isDefaultSnapshot(snapshot: ConfigSnapshot): boolean {
  return JSON.stringify(snapshot) === JSON.stringify(DEFAULT_SNAPSHOT);
}
