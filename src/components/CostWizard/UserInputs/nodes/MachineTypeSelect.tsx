import { Option, Select } from '@ui5/webcomponents-react';
import config from '../../../../config.json';
import { MachineType } from '../../../../state/nodes/machineSetupState';
import SubHeader from '../../common/SubHeader';

const machineTypes: MachineType[] = config.nodeConfig.MachineTypes;

interface Props {
  machineType: MachineType;
  setMachineType: (machineType: MachineType) => void;
  workerNode: boolean;
}

export default function MachineTypeSelect({
  machineType,
  setMachineType,
  workerNode,
}: Props) {
  return (
    <div>
      <SubHeader title="Machine Type" />
      <Select
        id="machine-type-select"
        value={machineType.value}
        disabled={!workerNode}
        onChange={(event) => {
          const selected = machineTypes.find(
            ({ value }) => value === event.detail.selectedOption.value,
          );
          if (selected) setMachineType(selected);
        }}
      >
        {machineTypes.map(({ value }) => (
          <Option key={value} value={value}>
            {value}
          </Option>
        ))}
      </Select>
    </div>
  );
}
