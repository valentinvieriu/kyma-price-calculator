import { FlexBox, Title, WizardStep } from '@ui5/webcomponents-react';
import StepButton from '../Buttons/StepButton';
import AddWorkerNodes from '../AddWorkerNodes';
import HelpLink from '../common/HelpLink';

export default function WorkerNodesStep() {
  return (
    <WizardStep disabled titleText="Worker Node Pools">
      <FlexBox alignItems="Center" wrap="NoWrap">
        <Title wrappingType="Normal" level="H2" size="H2">
          2. Add more worker node pools
        </Title>
        <HelpLink docKey="worker-node-pools" />
      </FlexBox>
      <div className="StepContent">
        <AddWorkerNodes />
      </div>
      <div className="ButtonContainer">
        <StepButton direction="previous" />
        <StepButton direction="next" />
      </div>
    </WizardStep>
  );
}
