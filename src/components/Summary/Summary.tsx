import { useAtomValue } from 'jotai';
import {
  AnalyticalCardHeader,
  Card,
  NumericSideIndicator,
} from '@ui5/webcomponents-react';
import config from '../../config.json';
import {
  canScaleAtom,
  costRangeAtom,
  poolCostsAtom,
  totalCostsAtom,
} from '../../state/costState';
import { poolsLoadLabel } from '../../state/nodes/loadProfiles';
import { baselineState } from '../../state/baselineState';
import { formatCost, formatCU, formatCurrency } from '../../utils/format';
import CostBar from './CostBar';
import BaselineControls from './BaselineControls';
import ExportButtons from './ExportButtons';
import CalculationPanel from './CalculationPanel';
import CostRange from './CostRange';
import './Summary.css';

function trend(current: number, baseline?: number) {
  if (baseline === undefined || current === baseline) return 'None';
  return current > baseline ? 'Up' : 'Down';
}

// Kept short so the total, its make-up and the comparison stay visible
// together; every charge is in the cost flow and in the exports.
export default function Summary() {
  const totalCosts = useAtomValue(totalCostsAtom);
  const baseline = useAtomValue(baselineState);
  const canScale = useAtomValue(canScaleAtom);
  const range = useAtomValue(costRangeAtom);
  const pools = useAtomValue(poolCostsAtom);
  const subtitle = canScale
    ? `Load: ${poolsLoadLabel(pools.map(({ machine }) => machine))} · up to ${formatCurrency(range.max.CC)} with autoscaling`
    : 'Pools have a fixed size';

  return (
    <Card
      id="cost-summary"
      className="summary"
      accessibleName="Cost estimate"
      header={
        <AnalyticalCardHeader
          id="total-in-currency"
          titleText="Estimated monthly cost"
          subtitleText={subtitle}
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
        <CostRange />
        <CalculationPanel />
        <section aria-label="Cost by category" className="summary-composition">
          <CostBar />
        </section>
        <section aria-label="Compare with a baseline">
          <BaselineControls />
        </section>
        <section aria-label="Export">
          <ExportButtons />
        </section>
      </div>
    </Card>
  );
}
