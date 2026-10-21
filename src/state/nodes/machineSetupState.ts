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
  VMSize: VMSize;
  additionalVolumeGib: number;
}

export function createMachineSetup(
  id: string,
  minAutoscaler: number,
): MachineSetup {
  const machineType = config.nodeConfig.MachineTypes[0];
  return {
    id,
    machineType,
    VMSize: machineType.VMSizeOptions[0],
    minAutoscaler,
    additionalVolumeGib: config.nodeConfig.AdditionalNodeVolume.Default,
  };
}

export const baseMachineSetupState = atom<MachineSetup>(
  createMachineSetup('base', config.nodeConfig.AutoScalerMin.Default),
);
baseMachineSetupState.debugLabel = 'baseMachineSetupState';

export const additionalMachineSetupState = atom<MachineSetup[]>([]);
additionalMachineSetupState.debugLabel = 'additionalMachineSetupState';
