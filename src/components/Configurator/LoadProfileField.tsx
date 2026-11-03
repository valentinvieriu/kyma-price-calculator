import { useState } from 'react';
import { Option, Select } from '@ui5/webcomponents-react';
import config from '../../config.json';
import { LOAD_PROFILES, loadProfile } from '../../state/nodes/loadProfiles';
import { formatNumber } from '../../utils/format';
import Field from '../common/Field';
import NumberInput from '../common/NumberInput';

const CUSTOM = 'custom';
const { TimeAtMax } = config;

interface Props {
  id: string;
  percent: number;
  hours: number;
  setPercent: (percent: number) => void;
}

// How busy the pool is, as a profile or a custom share of the time at maximum.
// The estimate in the summary and the charts uses it.
export default function LoadProfileField({
  id,
  percent,
  hours,
  setPercent,
}: Props) {
  // Picking "Custom" keeps the current share but shows the number field, even
  // when that share happens to match a profile.
  const [customPicked, setCustomPicked] = useState(false);
  const profile = loadProfile(percent);
  const isCustom = customPicked || !profile;
  const hoursAtMax = formatNumber((hours * percent) / 100, 1);

  return (
    <Field
      label="Estimated load"
      htmlFor={`${id}-load`}
      hint="How long the pool runs at its maximum. Billing counts node-hours, so this share sets the estimate between the minimum and the maximum."
      note={`≈ ${hoursAtMax} of ${hours} h at maximum`}
    >
      <Select
        id={`${id}-load`}
        className="load-profile-select"
        value={isCustom ? CUSTOM : String(percent)}
        onChange={(event) => {
          const value = event.detail.selectedOption.value;
          setCustomPicked(value === CUSTOM);
          if (value !== CUSTOM) setPercent(Number(value));
        }}
      >
        {LOAD_PROFILES.map((option) => (
          <Option
            key={option.percent}
            value={String(option.percent)}
            additionalText={`${option.percent} %`}
            tooltip={option.description}
          >
            {option.label}
          </Option>
        ))}
        <Option value={CUSTOM}>Custom</Option>
      </Select>
      {isCustom ? (
        <NumberInput
          id={`${id}-load-percent`}
          value={percent}
          setValue={setPercent}
          min={TimeAtMax.Min}
          max={TimeAtMax.Max}
          step={TimeAtMax.Step}
          unit="% at maximum"
          accessibleName="Share of the time at maximum"
        />
      ) : (
        <span className="load-profile-description">{profile.description}</span>
      )}
    </Field>
  );
}
