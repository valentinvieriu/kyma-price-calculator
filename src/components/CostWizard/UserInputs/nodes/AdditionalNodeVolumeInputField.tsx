import config from '../../../../config.json';
import HeaderWithInfo from '../../common/HeaderWithInfo';
import RangeInput from '../common/RangeInput';
import { STORAGE_BLOCK_SIZE_GIB } from '../../../../calculatorFunctions/storageCosts/storageBlocks';

interface Props {
  additionalVolumeGib: number;
  setAdditionalVolumeGib: (value: number) => void;
  machineDefaultVolume: number;
}

export default function AdditionalNodeVolumeInputField({
  additionalVolumeGib,
  setAdditionalVolumeGib,
  machineDefaultVolume,
}: Props) {
  return (
    <RangeInput
      id="additional-volume-input"
      header={
        <HeaderWithInfo
          header="Additional Volume (GiB)"
          info={`machine includes ${machineDefaultVolume} GiB free; extra is billed in ${STORAGE_BLOCK_SIZE_GIB} GiB blocks`}
        />
      }
      value={additionalVolumeGib}
      setValue={setAdditionalVolumeGib}
      settings={config.nodeConfig.AdditionalNodeVolume}
      unit="GiB"
    />
  );
}
