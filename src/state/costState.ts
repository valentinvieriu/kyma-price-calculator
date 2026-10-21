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

export interface PoolCosts {
  machine: MachineSetup;
  // Compute is billed under Worker Nodes, extra node volume under Storage.
  computeCosts: number;
  volumeCosts: number;
}

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
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const machineSetupsAtom = atom<MachineSetup[]>((get) => [
  get(baseMachineSetupState),
  ...get(additionalMachineSetupState),
]);
machineSetupsAtom.debugLabel = 'machineSetupsAtom';

export const poolCostsAtom = atom<PoolCosts[]>((get) => {
  const timeConsumption = get(timeConsumptionState);

  return get(machineSetupsAtom).map((machine) => ({
    machine,
    computeCosts: calculateNodeConfigCosts({
      timeConsumption,
      computeUnits: machine.VMSize.computeUnits,
      minAutoscaler: machine.minAutoscaler,
      machineTypeFactor: machine.machineType.multiple,
    }),
    volumeCosts: calculateAdditionalNodeVolumeCosts({
      additionalVolumeGib: machine.additionalVolumeGib,
      minAutoscaler: machine.minAutoscaler,
      timeConsumption,
    }),
  }));
});
poolCostsAtom.debugLabel = 'poolCostsAtom';

export const nodeConfigCostsAtom = atom<number>((get) =>
  sum(get(poolCostsAtom).map((pool) => pool.computeCosts)),
);
nodeConfigCostsAtom.debugLabel = 'nodeConfigCostsAtom';

export const storageCostsAtom = atom<number>(
  (get) =>
    calculateStorageCosts({
      GiBQuantity: get(GiBQuantityState),
      nfsGiBQuantity: get(nfsGiBQuantityState),
      snapshotGiBQuantity: get(snapshotGiBQuantityState),
      timeConsumption: get(timeConsumptionState),
    }) + sum(get(poolCostsAtom).map((pool) => pool.volumeCosts)),
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
}));
costReportAtom.debugLabel = 'costReportAtom';
