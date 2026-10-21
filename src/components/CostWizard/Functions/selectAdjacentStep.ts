export type StepDirection = 'next' | 'previous';

interface WizardStepElement extends HTMLElement {
  selected: boolean;
  disabled: boolean;
}

export default function selectAdjacentStep(
  button: HTMLElement,
  direction: StepDirection,
) {
  const currentStep = button.closest<WizardStepElement>('ui5-wizard-step');
  const targetStep = (
    direction === 'next'
      ? currentStep?.nextElementSibling
      : currentStep?.previousElementSibling
  ) as WizardStepElement | null | undefined;
  if (!currentStep || !targetStep) return;

  currentStep.selected = false;
  targetStep.selected = true;
  targetStep.disabled = false;
}
