import { ReactNode, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Link, Panel } from '@ui5/webcomponents-react';
import config from '../../config.json';
import { totalCostsAtom } from '../../state/costState';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';
import {
  BILLING_OPENER_IDS,
  BillingSetting,
  billingEditorState,
} from '../../state/uiState';
import {
  formatCU,
  formatCost,
  formatCurrency,
  formatNumber,
} from '../../utils/format';

interface RowProps {
  operator?: string;
  label: string;
  value: ReactNode;
  result?: boolean;
}

function Row({ operator, label, value, result }: RowProps) {
  return (
    <div
      className={`summary-calc-row${result ? ' summary-calc-row--result' : ''}`}
    >
      <span className="summary-calc-operator" aria-hidden="true">
        {operator}
      </span>
      <span>{label}</span>
      <span className="summary-calc-value">{value}</span>
    </div>
  );
}

// How the total comes about, and the two assumptions behind it. They stay
// editable from the collapsed header, where the total is read; the chart
// below shows what the Capacity Units are made of.
export default function CalculationPanel() {
  const hours = useAtomValue(timeConsumptionState);
  const rate = useAtomValue(applyConversionRateState);
  const total = useAtomValue(totalCostsAtom);
  const edit = useSetAtom(billingEditorState);
  const [collapsed, setCollapsed] = useState(true);

  const rateLabel = `${formatCost(rate)} ${config.CurrencyCode}/CU`;
  // Hourly prices are multiples of 0.12, 0.02 and 0.000625 CU, so six
  // decimals show them exactly and the rows multiply out to the total.
  const perHour = `${formatNumber(total.CU / hours, 6)} CU/h`;

  const editLink = (setting: BillingSetting, text: string, label: string) => (
    <Link
      id={BILLING_OPENER_IDS[setting]}
      endIcon="edit"
      accessibleName={label}
      onClick={() => edit({ setting, opener: BILLING_OPENER_IDS[setting] })}
    >
      {text}
    </Link>
  );

  return (
    <Panel
      className="summary-calculation"
      collapsed={collapsed}
      noAnimation
      accessibleName="How this is calculated"
      onToggle={(event) => setCollapsed(event.target.collapsed)}
      header={
        <div className="summary-calc-header">
          <button
            type="button"
            className="summary-calc-title"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            How this is calculated
          </button>
          <span className="summary-calc-settings">
            {editLink('hours', `${hours} h`, 'Edit running hours')}
            <span aria-hidden="true">·</span>
            {editLink('rate', rateLabel, 'Edit conversion rate')}
          </span>
        </div>
      }
    >
      <p className="summary-calc-lead">
        Everything is metered hourly in Capacity Units (CU), starting when your
        Kyma environment is created.
      </p>
      <div className="summary-calc-rows">
        <Row label="Your cluster, per hour" value={perHour} />
        <Row
          operator="×"
          label="Running hours per month"
          value={`${hours} h`}
        />
        <Row operator="=" label="Monthly usage" value={formatCU(total.CU)} />
        <Row operator="×" label="Conversion rate" value={rateLabel} />
        <Row
          operator="="
          label="Monthly cost"
          value={formatCurrency(total.CC)}
          result
        />
      </div>
    </Panel>
  );
}
