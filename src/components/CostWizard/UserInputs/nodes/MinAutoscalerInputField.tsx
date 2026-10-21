import config from '../../../../config.json';
import HeaderWithInfo from '../../common/HeaderWithInfo';
import RangeInput from '../common/RangeInput';

interface Props {
  autoScalerMin: number;
  setAutoScalerMin: (value: number) => void;
  workerNode: boolean;
}

export default function MinAutoscalerInputField({
  autoScalerMin,
  setAutoScalerMin,
  workerNode,
}: Props) {
  const { Min, MinWorkerNodes, Max, Step } = config.nodeConfig.AutoScalerMin;

  return (
    <RangeInput
      id="autoscaler-input"
      header={
        <HeaderWithInfo
          header="Autoscaler Min"
          info="minimum number of available Virtual Machines"
        />
      }
      value={autoScalerMin}
      setValue={setAutoScalerMin}
      settings={{ Min: workerNode ? MinWorkerNodes : Min, Max, Step }}
    />
  );
}
