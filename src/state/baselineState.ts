import { atom } from 'jotai';
import { ConfigSnapshot } from './configSnapshot';
import { TotalCosts } from '../calculatorFunctions/totalCosts/calculateTotalCosts';
import type { CostRange } from './costState';

// A pinned estimate to compare against while experimenting, and restore later.
export interface Baseline {
  snapshot: ConfigSnapshot;
  totalCosts: TotalCosts;
  costRange: CostRange;
}

export const baselineState = atom<Baseline | null>(null);
baselineState.debugLabel = 'baselineState';

export type BaselineChange =
  'configuration' | 'load profile' | 'running hours' | 'conversion rate';

// What differs from the baseline, so a price difference can be attributed to
// the cluster itself or to the billing assumptions.
export function describeChanges(
  baseline: ConfigSnapshot,
  current: ConfigSnapshot,
): BaselineChange[] {
  // The load profile is an assumption about usage, not about the cluster.
  const cluster = ({ pools, storage, redisTier }: ConfigSnapshot) =>
    JSON.stringify({
      pools: pools.map(({ loadPercent: _, ...pool }) => pool),
      storage,
      redisTier,
    });
  const loads = ({ pools }: ConfigSnapshot) =>
    pools.map(({ loadPercent }) => loadPercent).join();

  const changes: BaselineChange[] = [];
  if (cluster(baseline) !== cluster(current)) changes.push('configuration');
  if (loads(baseline) !== loads(current)) changes.push('load profile');
  if (baseline.hoursPerMonth !== current.hoursPerMonth) {
    changes.push('running hours');
  }
  if (baseline.conversionRate !== current.conversionRate) {
    changes.push('conversion rate');
  }
  return changes;
}
