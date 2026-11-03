import { atom } from 'jotai';
import {
  additionalMachineSetupState,
  baseMachineSetupState,
  MachineSetup,
} from './nodes/machineSetupState';
import { GiBQuantityState } from './storage/GiBQuantityState';
import { nfsGiBQuantityState } from './storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from './storage/snapshotGiBQuantityState';
import { timeConsumptionState } from './additionalConfig/timeConsumptionState';
import { applyConversionRateState } from './additionalConfig/applyConversionRateState';
import { redisState, RedisSize } from './additionalConfig/redisState';
import { averageNodes } from './nodes/loadProfiles';
import calculateNodeConfigCosts from '../calculatorFunctions/nodeConfigCosts/calculateNodeConfigCosts';
import calculateAdditionalNodeVolumeCosts from '../calculatorFunctions/storageCosts/calculateAdditionalNodeVolumeCosts';
import calculateStorageCosts, {
  calculateStorageCostBreakdown,
  StorageBlocks,
} from '../calculatorFunctions/storageCosts/calculateStorageCosts';
import calculateAdditionalCosts from '../calculatorFunctions/additionalConfig/calculateAdditionalCosts';
import calculateTotalCosts, {
  TotalCosts,
} from '../calculatorFunctions/totalCosts/calculateTotalCosts';

// What the bill is made of with every pool at its minimum, at its maximum,
// or averaging out over each pool's load profile: the estimate.
export type CostScenario = 'min' | 'estimated' | 'max';

export interface PoolScenarioCosts {
  // Average node count; fractional for the estimate.
  nodes: number;
  compute: number;
  volume: number;
}

export interface PoolCosts {
  machine: MachineSetup;
  // Compute is billed under Worker Nodes, extra node volume under Storage.
  // Both at the pool's load profile.
  computeCosts: number;
  volumeCosts: number;
  scenarios: Record<CostScenario, PoolScenarioCosts>;
}

export type CostRange = Record<CostScenario, TotalCosts>;

export interface CostReport {
  pools: PoolCosts[];
  timeConsumption: number;
  storage: { standardGib: number; nfsGib: number; snapshotGib: number };
  redis: RedisSize;
  conversionRate: number;
  nodeConfigCosts: number;
  storageCosts: number;
  additionalCosts: number;
  totalCosts: TotalCosts;
  costRange: CostRange;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const machineSetupsAtom = atom<MachineSetup[]>((get) => [
  get(baseMachineSetupState),
  ...get(additionalMachineSetupState),
]);
machineSetupsAtom.debugLabel = 'machineSetupsAtom';

export function poolScenarioCosts(
  machine: MachineSetup,
  nodes: number,
  timeConsumption: number,
): PoolScenarioCosts {
  return {
    nodes,
    compute: calculateNodeConfigCosts({
      timeConsumption,
      computeUnits: machine.VMSize.computeUnits,
      nodes,
      machineTypeFactor: machine.machineType.multiple,
    }),
    volume: calculateAdditionalNodeVolumeCosts({
      additionalVolumeGib: machine.additionalVolumeGib,
      nodes,
      timeConsumption,
    }),
  };
}

export const poolCostsAtom = atom<PoolCosts[]>((get) => {
  const timeConsumption = get(timeConsumptionState);

  return get(machineSetupsAtom).map((machine) => {
    const { minAutoscaler: min, maxAutoscaler: max, loadPercent } = machine;
    const scenarios = {
      min: poolScenarioCosts(machine, min, timeConsumption),
      estimated: poolScenarioCosts(
        machine,
        averageNodes(min, max, loadPercent),
        timeConsumption,
      ),
      max: poolScenarioCosts(machine, Math.max(min, max), timeConsumption),
    };
    return {
      machine,
      computeCosts: scenarios.estimated.compute,
      volumeCosts: scenarios.estimated.volume,
      scenarios,
    };
  });
});
poolCostsAtom.debugLabel = 'poolCostsAtom';

export const nodeConfigCostsAtom = atom<number>((get) =>
  sum(get(poolCostsAtom).map((pool) => pool.computeCosts)),
);
nodeConfigCostsAtom.debugLabel = 'nodeConfigCostsAtom';

// Storage the user configured directly; it does not change with load.
export const storageBlockCostsAtom = atom<number>((get) =>
  calculateStorageCosts({
    GiBQuantity: get(GiBQuantityState),
    nfsGiBQuantity: get(nfsGiBQuantityState),
    snapshotGiBQuantity: get(snapshotGiBQuantityState),
    timeConsumption: get(timeConsumptionState),
  }),
);
storageBlockCostsAtom.debugLabel = 'storageBlockCostsAtom';

export const storageCostsAtom = atom<number>(
  (get) =>
    get(storageBlockCostsAtom) +
    sum(get(poolCostsAtom).map((pool) => pool.volumeCosts)),
);
storageCostsAtom.debugLabel = 'storageCostsAtom';

// Same total as storageCostsAtom, split by what the user configured.
export interface StorageCostBreakdown extends StorageBlocks {
  nodeVolume: number;
}

export const storageCostBreakdownAtom = atom<StorageCostBreakdown>((get) => ({
  ...calculateStorageCostBreakdown({
    GiBQuantity: get(GiBQuantityState),
    nfsGiBQuantity: get(nfsGiBQuantityState),
    snapshotGiBQuantity: get(snapshotGiBQuantityState),
    timeConsumption: get(timeConsumptionState),
  }),
  nodeVolume: sum(get(poolCostsAtom).map((pool) => pool.volumeCosts)),
}));
storageCostBreakdownAtom.debugLabel = 'storageCostBreakdownAtom';

// Redis is currently the only additional service.
export const additionalCostsAtom = atom<number>((get) =>
  calculateAdditionalCosts({
    redisStorageGib: get(redisState).storageGib,
    timeConsumption: get(timeConsumptionState),
  }),
);
additionalCostsAtom.debugLabel = 'additionalCostsAtom';

export const totalCostsAtom = atom<TotalCosts>((get) =>
  calculateTotalCosts({
    nodeConfigCosts: get(nodeConfigCostsAtom),
    storageCosts: get(storageCostsAtom),
    additionalCosts: get(additionalCostsAtom),
    conversionRatio: get(applyConversionRateState),
  }),
);
totalCostsAtom.debugLabel = 'totalCostsAtom';

export interface ScenarioCategories {
  nodeConfigCosts: number;
  storageCosts: number;
  additionalCosts: number;
  totalCosts: TotalCosts;
}

// The cost categories for one scenario. Storage and services are fixed, only
// the worker node pools and their extra disks follow the node count.
export const scenarioCategoriesAtom = atom<
  Record<CostScenario, ScenarioCategories>
>((get) => {
  const pools = get(poolCostsAtom);
  const storageBlocks = get(storageBlockCostsAtom);
  const additionalCosts = get(additionalCostsAtom);
  const conversionRatio = get(applyConversionRateState);

  const categories = (scenario: CostScenario): ScenarioCategories => {
    const nodeConfigCosts = sum(
      pools.map(({ scenarios }) => scenarios[scenario].compute),
    );
    const storageCosts =
      storageBlocks +
      sum(pools.map(({ scenarios }) => scenarios[scenario].volume));
    return {
      nodeConfigCosts,
      storageCosts,
      additionalCosts,
      totalCosts: calculateTotalCosts({
        nodeConfigCosts,
        storageCosts,
        additionalCosts,
        conversionRatio,
      }),
    };
  };
  return {
    min: categories('min'),
    estimated: categories('estimated'),
    max: categories('max'),
  };
});
scenarioCategoriesAtom.debugLabel = 'scenarioCategoriesAtom';

// How far the bill can move with the load: from every pool at its minimum to
// every pool at its maximum, with the estimate in between.
export const costRangeAtom = atom<CostRange>((get) => {
  const categories = get(scenarioCategoriesAtom);
  return {
    min: categories.min.totalCosts,
    estimated: categories.estimated.totalCosts,
    max: categories.max.totalCosts,
  };
});
costRangeAtom.debugLabel = 'costRangeAtom';

// True when at least one pool may grow beyond its minimum.
export const canScaleAtom = atom<boolean>((get) =>
  get(machineSetupsAtom).some(
    ({ minAutoscaler, maxAutoscaler }) => maxAutoscaler > minAutoscaler,
  ),
);
canScaleAtom.debugLabel = 'canScaleAtom';

// Snapshot of every input and computed cost, used for file export.
export const costReportAtom = atom<CostReport>((get) => ({
  pools: get(poolCostsAtom),
  timeConsumption: get(timeConsumptionState),
  storage: {
    standardGib: get(GiBQuantityState),
    nfsGib: get(nfsGiBQuantityState),
    snapshotGib: get(snapshotGiBQuantityState),
  },
  redis: get(redisState),
  conversionRate: get(applyConversionRateState),
  nodeConfigCosts: get(nodeConfigCostsAtom),
  storageCosts: get(storageCostsAtom),
  additionalCosts: get(additionalCostsAtom),
  totalCosts: get(totalCostsAtom),
  costRange: get(costRangeAtom),
}));
costReportAtom.debugLabel = 'costReportAtom';
