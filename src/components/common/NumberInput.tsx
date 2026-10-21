import { useState } from 'react';
import { StepInput } from '@ui5/webcomponents-react';
import snapToStep from '../../utils/snapToStep';
import './NumberInput.css';

interface Props {
  id: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  // Increment of the +/− buttons.
  step: number;
  // Granularity of typed values; defaults to `step`. Storage uses 1 GiB so
  // users can enter what they actually need and see how it is billed.
  snapStep?: number;
  decimals?: number;
  unit?: string;
  accessibleName?: string;
}

// StepInput that corrects typed values (range, granularity) instead of
// flagging them as invalid.
export default function NumberInput({
  id,
  value,
  setValue,
  min,
  max,
  step,
  snapStep = step,
  decimals = 0,
  unit,
  accessibleName,
}: Props) {
  // UI5 caches the displayed text after a +/− click and ignores later value
  // changes from outside (Reset, Restore baseline). Remount the field when the
  // value changes to something it did not emit itself.
  const [emitted, setEmitted] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [generation, setGeneration] = useState(0);
  if (value !== previous) {
    setPrevious(value);
    if (value !== emitted) setGeneration((g) => g + 1);
  }

  return (
    <div className="number-input">
      <StepInput
        key={generation}
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        valuePrecision={decimals}
        accessibleName={accessibleName}
        // UI5 marks "0.8" as invalid when two decimals are configured, and
        // out-of-range values too; both are corrected on change below.
        onValueStateChange={(event) => event.preventDefault()}
        onChange={(event) => {
          const snapped =
            snapToStep(Number(event.target.value), {
              min,
              max,
              step: snapStep,
            }) ?? min;
          // The prop may not change (e.g. 40 snaps back to the current 32), so
          // also correct what the field displays.
          event.target.value = snapped;
          setEmitted(snapped);
          setValue(snapped);
        }}
      />
      {unit && <span className="number-input-unit">{unit}</span>}
    </div>
  );
}
