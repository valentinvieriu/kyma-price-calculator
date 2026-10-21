import { ComponentType } from 'react';
import { useAtom } from 'jotai';
import {
  ResponsivePopover,
  SegmentedButton,
  SegmentedButtonItem,
} from '@ui5/webcomponents-react';
import config from '../../config.json';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';
import { BillingSetting, billingEditorState } from '../../state/uiState';
import './BillingSettingEditor.css';
import Field from '../common/Field';
import NumberInput from '../common/NumberInput';

const { TimeConsumption, ConversionRate, CurrencyCode } = config;

// Common durations for a quick "what does this cost for…" check.
const HOUR_PRESETS = [
  { label: '1 day', hours: 24 },
  { label: '1 week', hours: 7 * 24 },
  { label: '1 month', hours: TimeConsumption.Default },
];

function HoursField() {
  const [hours, setHours] = useAtom(timeConsumptionState);
  return (
    <Field
      label="Running hours per month"
      htmlFor="hours-input"
      hint={`A full month is ${TimeConsumption.Default} h. Lower it for clusters that don't run all month.`}
    >
      <SegmentedButton
        className="hours-presets"
        accessibleName="Running time presets"
        onSelectionChange={(event) => {
          const selected = Number(event.detail.selectedItems[0]?.dataset.hours);
          if (selected) setHours(selected);
        }}
      >
        {HOUR_PRESETS.map(({ label, hours: presetHours }) => (
          <SegmentedButtonItem
            key={label}
            data-hours={presetHours}
            selected={hours === presetHours}
          >
            {label}
            <span className="hours-preset-detail"> · {presetHours} h</span>
          </SegmentedButtonItem>
        ))}
      </SegmentedButton>
      <NumberInput
        id="hours-input"
        value={hours}
        setValue={setHours}
        min={TimeConsumption.Min}
        max={TimeConsumption.Max}
        step={TimeConsumption.Step}
        unit="h"
      />
    </Field>
  );
}

function ConversionRateField() {
  const [rate, setRate] = useAtom(applyConversionRateState);
  return (
    <Field
      label="Conversion rate"
      htmlFor="conversion-rate-input"
      hint={`What you pay for 1 CU, including any discount. If unsure, keep ${ConversionRate.Default.toFixed(2)} or ask your SAP sales specialist.`}
    >
      <NumberInput
        id="conversion-rate-input"
        value={rate}
        setValue={setRate}
        min={ConversionRate.Min}
        max={ConversionRate.Max}
        step={ConversionRate.Step}
        decimals={2}
        unit={`${CurrencyCode} per CU`}
      />
    </Field>
  );
}

const editors: Record<
  BillingSetting,
  { title: string; field: ComponentType; input: string }
> = {
  hours: { title: 'Running hours', field: HoursField, input: 'hours-input' },
  rate: {
    title: 'Conversion rate',
    field: ConversionRateField,
    input: 'conversion-rate-input',
  },
};

// Edits a billing assumption in place, next to whatever opened it.
export default function BillingSettingEditor() {
  const [editor, setEditor] = useAtom(billingEditorState);
  const {
    title,
    field: EditorField,
    input,
  } = editors[editor?.setting ?? 'hours'];

  return (
    <ResponsivePopover
      opener={editor?.opener}
      open={editor !== null}
      headerText={title}
      initialFocus={input}
      placement="Bottom"
      className="billing-setting-editor"
      onClose={() => setEditor(null)}
    >
      <div className="billing-setting-editor-content">
        {editor && <EditorField />}
      </div>
    </ResponsivePopover>
  );
}
