import { Button } from '@ui5/webcomponents-react';
import './StepButton.css';
import selectAdjacentStep, {
  StepDirection,
} from '../Functions/selectAdjacentStep';

interface Props {
  direction: StepDirection;
}

export default function StepButton({ direction }: Props) {
  return (
    <Button
      className={direction === 'next' ? 'NextStepButton' : 'PreviousStepButton'}
      design="Emphasized"
      onClick={(event) => selectAdjacentStep(event.target, direction)}
    >
      {direction === 'next' ? 'Next Step' : 'Previous Step'}
    </Button>
  );
}
