import { ReactNode } from 'react';
import { Slider } from '@ui5/webcomponents-react';
import SpinnerInput from './SpinnerInput';
import snapToStep from './snapToStep';

export interface RangeSettings {
  Min: number;
  Max: number;
  Step: number;
}

interface Props {
  header: ReactNode;
  value: number;
  setValue: (value: number) => void;
  settings: RangeSettings;
  id?: string;
  unit?: string;
  decimals?: number;
}

// A numeric input rendered as a spinner and a slider bound to the same value.
export default function RangeInput({
  header,
  value,
  setValue,
  settings,
  id,
  unit,
  decimals,
}: Props) {
  const range = { min: settings.Min, max: settings.Max, step: settings.Step };

  function handleSliderInput(event: { target: { value: number } }) {
    const snapped = snapToStep(Number(event.target.value), range);
    if (snapped !== null) setValue(snapped);
  }

  return (
    <div>
      {header}
      <SpinnerInput
        id={id}
        value={value}
        setValue={setValue}
        {...range}
        unit={unit}
        decimals={decimals}
      />
      <Slider
        value={value}
        onInput={handleSliderInput}
        {...range}
        showTooltip
      />
    </div>
  );
}
