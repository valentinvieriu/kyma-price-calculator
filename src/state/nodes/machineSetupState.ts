import { atom } from 'jotai';
import config from '../../config.json';

export interface MachineType {
  value: string;
  multiple: number;
  VMSizeOptions: VMSize[];
}

export interface VMSize {
  value: string;
  computeUnits: number;
  vcpus: number;
  memoryGib: number;
}

export interface MachineSetup {
  id: string;
  machineType: MachineType;
  minAutoscaler: number;
  // Upper bound the autoscaler may add nodes up to, never below the minimum.
  maxAutoscaler: number;
  // Share of the running hours, in percent, the pool spends at its maximum.
  loadPercent: number;
  VMSize: VMSize;
  additionalVolumeGib: number;
}

export function createMachineSetup(
  id: string,
  minAutoscaler: number,
  maxAutoscaler: number = minAutoscaler,
): MachineSetup {
  const machineType = config.nodeConfig.MachineTypes[0];
  return {
    id,
    machineType,
    VMSize: machineType.VMSizeOptions[0],
    minAutoscaler,
    maxAutoscaler: Math.max(minAutoscaler, maxAutoscaler),
    loadPercent: config.TimeAtMax.Default,
    additionalVolumeGib: config.nodeConfig.AdditionalNodeVolume.Default,
  };
}

export const baseMachineSetupState = atom<MachineSetup>(
  createMachineSetup(
    'base',
    config.nodeConfig.AutoScalerMin.Default,
    config.nodeConfig.AutoScalerMax.Default,
  ),
);
baseMachineSetupState.debugLabel = 'baseMachineSetupState';

export const additionalMachineSetupState = atom<MachineSetup[]>([]);
additionalMachineSetupState.debugLabel = 'additionalMachineSetupState';
