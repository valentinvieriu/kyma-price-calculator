import { Option, Select } from '@ui5/webcomponents-react';
import { VMSize } from '../../../../state/nodes/machineSetupState';
import calculateDefaultVolumeSize from '../../../../calculatorFunctions/defaultVolumeSize/calculateDefaultVolumeSize';
import SubHeader from '../../common/SubHeader';

interface Props {
  VMSize: VMSize;
  setVMSize: (vmSize: VMSize) => void;
  VMSizeOptions: VMSize[];
}

export default function VMsizeSelect({
  VMSize,
  setVMSize,
  VMSizeOptions,
}: Props) {
  return (
    <div>
      <SubHeader title="Virtual Machine Size" />
      <Select
        id="vm-size-select"
        value={VMSize.value}
        style={{ width: '20rem' }}
        onChange={(event) => {
          const selected = VMSizeOptions.find(
            ({ value }) => value === event.detail.selectedOption.value,
          );
          if (selected) setVMSize(selected);
        }}
      >
        {VMSizeOptions.map((item) => (
          <Option key={item.value} value={item.value}>
            {`${item.value} - ${calculateDefaultVolumeSize(item.vcpus, item.memoryGib)} GiB volume`}
          </Option>
        ))}
      </Select>
    </div>
  );
}
