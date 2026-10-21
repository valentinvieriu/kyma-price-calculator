import { ComponentType } from 'react';
import { useAtom } from 'jotai';
import { ResponsivePopover } from '@ui5/webcomponents-react';
import config from '../../config.json';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';
import { BillingSetting, billingEditorState } from '../../state/uiState';
import Field from '../common/Field';
import NumberInput from '../common/NumberInput';

const { TimeConsumption, ConversionRate, CurrencyCode } = config;

function HoursField() {
  const [hours, setHours] = useAtom(timeConsumptionState);
  return (
    <Field
      label="Running hours per month"
      htmlFor="hours-input"
      hint={`A full month is ${TimeConsumption.Default} h. Lower it for clusters that don't run all month.`}
    >
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

const editors: Record<BillingSetting, { title: string; field: ComponentType }> =
  {
    hours: { title: 'Running hours', field: HoursField },
    rate: { title: 'Conversion rate', field: ConversionRateField },
  };

interface Props {
  setting: BillingSetting;
  opener: string;
}

// Edits a billing assumption in place, next to the formula term it changes.
export default function BillingSettingEditor({ setting, opener }: Props) {
  const [open, setOpen] = useAtom(billingEditorState);
  const { title, field: EditorField } = editors[setting];

  return (
    <ResponsivePopover
      opener={opener}
      open={open === setting}
      headerText={title}
      placement="Bottom"
      className="billing-setting-editor"
      onClose={() =>
        setOpen((current) => (current === setting ? null : current))
      }
    >
      <div className="billing-setting-editor-content">
        <EditorField />
      </div>
    </ResponsivePopover>
  );
}
