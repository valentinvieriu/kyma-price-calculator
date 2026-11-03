import { useAtomValue } from 'jotai';
import {
  canScaleAtom,
  costRangeAtom,
  poolCostsAtom,
} from '../../state/costState';
import { poolsLoadLabel } from '../../state/nodes/loadProfiles';
import { formatCU, formatCurrency, formatNumber } from '../../utils/format';

// How far the bill can move when the autoscaler adds nodes: from every pool
// at its minimum to every pool at its maximum, with the estimate marked.
export default function CostRange() {
  const range = useAtomValue(costRangeAtom);
  const canScale = useAtomValue(canScaleAtom);
  const pools = useAtomValue(poolCostsAtom);
  if (!canScale) return null;

  const { min, estimated, max } = range;
  const load = poolsLoadLabel(pools.map(({ machine }) => machine));
  const width = (cc: number) => `${max.CC > 0 ? (cc / max.CC) * 100 : 0}%`;
  const factor = min.CC > 0 ? max.CC / min.CC : 1;

  return (
    <section
      id="cost-range"
      className="cost-range"
      aria-label="Cost range with autoscaling"
    >
      <div className="cost-range-head">
        <span className="cost-range-title">With autoscaling</span>
        <span className="cost-range-load">
          Estimated load: {load} · set in each pool
        </span>
      </div>
      <div className="cost-range-track" aria-hidden="true">
        <div className="cost-range-min" style={{ width: width(min.CC) }} />
        <div
          className="cost-range-scale-out"
          style={{ width: width(estimated.CC - min.CC) }}
        />
        <div
          className="cost-range-marker"
          style={{ left: width(estimated.CC) }}
        />
      </div>
      <dl className="cost-range-labels">
        <div id="cost-range-min">
          <dt>Minimum</dt>
          <dd className="cost-range-value">{formatCurrency(min.CC)}</dd>
          <dd className="cost-range-detail">{formatCU(min.CU)}</dd>
        </div>
        <div id="cost-range-estimated">
          <dt>Estimated</dt>
          <dd className="cost-range-value">{formatCurrency(estimated.CC)}</dd>
          <dd className="cost-range-detail">{formatCU(estimated.CU)}</dd>
        </div>
        <div id="cost-range-max">
          <dt>Maximum</dt>
          <dd className="cost-range-value">{formatCurrency(max.CC)}</dd>
          <dd className="cost-range-detail">
            {formatNumber(factor, 1)}× the minimum
          </dd>
        </div>
      </dl>
    </section>
  );
}
