import { useAtomValue } from 'jotai';
import {
  AnalyticalCardHeader,
  Card,
  NumericSideIndicator,
  Panel,
} from '@ui5/webcomponents-react';
import config from '../../config.json';
import { totalCostsAtom } from '../../state/costState';
import { baselineState } from '../../state/baselineState';
import { formatCost, formatCU } from '../../utils/format';
import CostBar from './CostBar';
import CostBreakdown from './CostBreakdown';
import BaselineControls from './BaselineControls';
import ExportButtons from './ExportButtons';
import BillingAssumptions from './BillingAssumptions';
import './Summary.css';

function trend(current: number, baseline?: number) {
  if (baseline === undefined || current === baseline) return 'None';
  return current > baseline ? 'Up' : 'Down';
}

// Kept short so the total and the comparison stay visible together; the
// itemised list is collapsed because each section already shows its formulas.
export default function Summary() {
  const totalCosts = useAtomValue(totalCostsAtom);
  const baseline = useAtomValue(baselineState);

  return (
    <Card
      id="cost-summary"
      className="summary"
      accessibleName="Cost estimate"
      header={
        <AnalyticalCardHeader
          id="total-in-currency"
          titleText="Estimated monthly cost"
          subtitleText="At minimum node count; scaling up adds cost"
          value={formatCost(totalCosts.CC)}
          scale={config.CurrencyCode}
          trend={trend(totalCosts.CC, baseline?.totalCosts.CC)}
        >
          <NumericSideIndicator
            id="total-capacity-units"
            titleText="Capacity units"
            // The component renders number and unit without a space between.
            number={formatCU(totalCosts.CU)}
          />
        </AnalyticalCardHeader>
      }
    >
      <div className="summary-body">
        <BillingAssumptions />
        <section aria-label="Compare with a baseline">
          <BaselineControls />
        </section>
        <section aria-label="Cost by category">
          <CostBar />
        </section>
        <Panel
          className="summary-breakdown"
          headerText="Itemized breakdown"
          headerLevel="H4"
          collapsed
        >
          <CostBreakdown />
        </Panel>
        <section aria-label="Export">
          <ExportButtons />
        </section>
      </div>
    </Card>
  );
}
