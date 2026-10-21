import { Form } from '@ui5/webcomponents-react';
import VMsizeSelect from './UserInputs/nodes/VMsizeSelect';
import MachineTypeSelect from './UserInputs/nodes/MachineTypeSelect';
import MinAutoscalerInputField from './UserInputs/nodes/MinAutoscalerInputField';
import AdditionalNodeVolumeInputField from './UserInputs/nodes/AdditionalNodeVolumeInputField';
import './CostWizard.css';
import {
  MachineSetup,
  MachineType,
  VMSize,
} from '../../state/nodes/machineSetupState';
import calculateDefaultVolumeSize from '../../calculatorFunctions/defaultVolumeSize/calculateDefaultVolumeSize';

interface Props {
  machine: MachineSetup;
  updateMachine: (updatedMachine: MachineSetup) => void;
  workerNode: boolean;
}

export default function MachineSetupForm({
  machine,
  updateMachine,
  workerNode,
}: Props) {
  const update = (changes: Partial<MachineSetup>) =>
    updateMachine({ ...machine, ...changes });

  const machineDefaultVolume = calculateDefaultVolumeSize(
    machine.VMSize.vcpus,
    machine.VMSize.memoryGib,
  );

  return (
    <Form layout="S1 M1 L1 XL1">
      <MachineTypeSelect
        machineType={machine.machineType}
        setMachineType={(machineType: MachineType) =>
          // VM sizes differ per machine type, so reset to the first one.
          update({ machineType, VMSize: machineType.VMSizeOptions[0] })
        }
        workerNode={workerNode}
      />
      <VMsizeSelect
        VMSize={machine.VMSize}
        setVMSize={(VMSize: VMSize) => update({ VMSize })}
        VMSizeOptions={machine.machineType.VMSizeOptions}
      />
      <MinAutoscalerInputField
        autoScalerMin={machine.minAutoscaler}
        setAutoScalerMin={(minAutoscaler) => update({ minAutoscaler })}
        workerNode={workerNode}
      />
      <AdditionalNodeVolumeInputField
        additionalVolumeGib={machine.additionalVolumeGib}
        setAdditionalVolumeGib={(additionalVolumeGib) =>
          update({ additionalVolumeGib })
        }
        machineDefaultVolume={machineDefaultVolume}
      />
    </Form>
  );
}
