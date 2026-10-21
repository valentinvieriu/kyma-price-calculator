import { useAtomValue, useSetAtom } from 'jotai';
import { Link } from '@ui5/webcomponents-react';
import config from '../../config.json';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';
import { BillingSetting, billingEditorState } from '../../state/uiState';
import { formatCost } from '../../utils/format';

const OPENER_IDS: Record<BillingSetting, string> = {
  hours: 'summary-hours',
  rate: 'summary-rate',
};

// The assumptions behind the total, editable right where the total is read.
export default function BillingAssumptions() {
  const hours = useAtomValue(timeConsumptionState);
  const rate = useAtomValue(applyConversionRateState);
  const edit = useSetAtom(billingEditorState);

  const editLink = (setting: BillingSetting, text: string, label: string) => (
    <Link
      id={OPENER_IDS[setting]}
      endIcon="edit"
      accessibleName={label}
      onClick={() => edit({ setting, opener: OPENER_IDS[setting] })}
    >
      {text}
    </Link>
  );

  return (
    <section className="summary-assumptions" aria-label="Billing assumptions">
      Based on {editLink('hours', `${hours} h per month`, 'Edit running hours')}{' '}
      at{' '}
      {editLink(
        'rate',
        `${formatCost(rate)} ${config.CurrencyCode}/CU`,
        'Edit conversion rate',
      )}
    </section>
  );
}
