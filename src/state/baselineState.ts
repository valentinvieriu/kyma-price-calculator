import { atom } from 'jotai';
import { ConfigSnapshot } from './configSnapshot';
import { TotalCosts } from '../calculatorFunctions/totalCosts/calculateTotalCosts';

// A pinned estimate to compare against while experimenting, and restore later.
export interface Baseline {
  snapshot: ConfigSnapshot;
  totalCosts: TotalCosts;
}

export const baselineState = atom<Baseline | null>(null);
baselineState.debugLabel = 'baselineState';

export type BaselineChange =
  'configuration' | 'running hours' | 'conversion rate';

// What differs from the baseline, so a price difference can be attributed to
// the cluster itself or to the billing assumptions.
export function describeChanges(
  baseline: ConfigSnapshot,
  current: ConfigSnapshot,
): BaselineChange[] {
  const cluster = ({ pools, storage, redisTier }: ConfigSnapshot) =>
    JSON.stringify({ pools, storage, redisTier });

  const changes: BaselineChange[] = [];
  if (cluster(baseline) !== cluster(current)) changes.push('configuration');
  if (baseline.hoursPerMonth !== current.hoursPerMonth) {
    changes.push('running hours');
  }
  if (baseline.conversionRate !== current.conversionRate) {
    changes.push('conversion rate');
  }
  return changes;
}
