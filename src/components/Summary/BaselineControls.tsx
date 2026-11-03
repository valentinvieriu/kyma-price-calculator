import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button, ObjectStatus, Text } from '@ui5/webcomponents-react';
import { baselineState, describeChanges } from '../../state/baselineState';
import { configSnapshotAtom } from '../../state/configSnapshot';
import { costRangeAtom, totalCostsAtom } from '../../state/costState';
import { formatCU, formatCurrency, formatPercent } from '../../utils/format';

const signed = (delta: number, format: (n: number) => string) =>
  `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${format(Math.abs(delta))}`;

// Pin an estimate, keep experimenting, and see the difference to it.
export default function BaselineControls() {
  const [baseline, setBaseline] = useAtom(baselineState);
  const snapshot = useAtomValue(configSnapshotAtom);
  const totalCosts = useAtomValue(totalCostsAtom);
  const costRange = useAtomValue(costRangeAtom);
  const restore = useSetAtom(configSnapshotAtom);

  if (!baseline) {
    return (
      <div className="summary-baseline summary-baseline--empty">
        <Text className="summary-hint">
          Pin this estimate, then change the configuration to compare.
        </Text>
        <Button
          icon="pushpin-off"
          design="Transparent"
          onClick={() => setBaseline({ snapshot, totalCosts, costRange })}
        >
          Pin as baseline
        </Button>
      </div>
    );
  }

  // Compare what is paid (€) first; CU shows whether the cluster itself changed.
  const deltaCC = totalCosts.CC - baseline.totalCosts.CC;
  const deltaCU = totalCosts.CU - baseline.totalCosts.CU;
  const relative =
    baseline.totalCosts.CC > 0 ? deltaCC / baseline.totalCosts.CC : 0;
  const changes = describeChanges(baseline.snapshot, snapshot);
  // The ceiling can move even when the expected total does not, for example
  // after raising a pool's maximum.
  const baselineMax = baseline.costRange.max.CC;
  const showMax =
    costRange.max.CC !== totalCosts.CC ||
    baselineMax !== baseline.totalCosts.CC;

  return (
    <div className="summary-baseline">
      <div className="summary-baseline-values">
        <ObjectStatus
          id="baseline-delta"
          state={deltaCC > 0 ? 'Critical' : deltaCC < 0 ? 'Positive' : 'None'}
          stateAnnouncementText={
            deltaCC > 0
              ? 'more expensive than baseline'
              : deltaCC < 0
                ? 'cheaper than baseline'
                : 'same as baseline'
          }
        >
          {`${signed(deltaCC, formatCurrency)} (${signed(relative, formatPercent)})`}
        </ObjectStatus>
        <Text>{signed(deltaCU, formatCU)}</Text>
      </div>
      {showMax && (
        <Text id="baseline-max-delta" className="summary-hint">
          At maximum: {signed(costRange.max.CC - baselineMax, formatCurrency)}{' '}
          (baseline {formatCurrency(baselineMax)})
        </Text>
      )}
      <Text className="summary-hint">
        {changes.length > 0
          ? `Changed: ${changes.join(', ')}.`
          : 'No changes since pinning.'}{' '}
        Baseline {formatCurrency(baseline.totalCosts.CC)} ·{' '}
        {formatCU(baseline.totalCosts.CU)}
      </Text>
      <div className="summary-actions">
        <Button icon="undo" onClick={() => restore(baseline.snapshot)}>
          Restore baseline
        </Button>
        <Button
          icon="decline"
          design="Transparent"
          onClick={() => setBaseline(null)}
        >
          Unpin
        </Button>
      </div>
    </div>
  );
}
