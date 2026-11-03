import { useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  Bar,
  Button,
  Dialog,
  SegmentedButton,
  SegmentedButtonItem,
} from '@ui5/webcomponents-react';
import { formatCU, formatCost, formatPercent } from '../../utils/format';
import { costCategoriesAtom } from './costCategories';
import CostSankey from './CostSankey';
import './CostBar.css';

type ChartView = 'flow' | 'share';

const VIEWS: Record<ChartView, { icon: string; title: string }> = {
  flow: { icon: 'org-chart', title: 'Where the cost comes from' },
  share: { icon: 'horizontal-stacked-chart', title: 'Share by category' },
};

// The bar spans the cost at maximum: each category's minimum, then what
// scaling adds to it in the estimate, then the headroom left.
function ShareBar() {
  const categories = useAtomValue(costCategoriesAtom);
  const shown = categories.reduce((sum, { cu }) => sum + cu, 0);
  const max = categories.reduce((sum, { maxCu }) => sum + maxCu, 0);

  return (
    <div className="cost-bar-track" aria-hidden="true">
      {categories.flatMap(({ id, cu, minCu, color }) => [
        minCu > 0 && (
          <div
            key={id}
            className="cost-bar-segment"
            style={{ flexGrow: minCu, background: color }}
          />
        ),
        cu > minCu && (
          <div
            key={`${id}-scale-out`}
            className="cost-bar-segment cost-bar-segment--scale-out"
            style={{ flexGrow: cu - minCu, background: color }}
          />
        ),
      ])}
      {max > shown && (
        <div
          className="cost-bar-segment cost-bar-segment--headroom"
          style={{ flexGrow: max - shown }}
        />
      )}
    </div>
  );
}

// Share of the estimated total per category, as the flow of every charge into
// its category or a stacked bar, plus a legend with values. Hatched parts are
// what scaling out adds to the minimum.
export default function CostBar() {
  const categories = useAtomValue(costCategoriesAtom);
  const [view, setView] = useState<ChartView>('flow');
  const [fullOpen, setFullOpen] = useState(false);
  const total = categories.reduce((sum, { cu }) => sum + cu, 0);
  const share = (cu: number) => (total > 0 ? cu / total : 0);

  return (
    <div className="cost-bar">
      <div className="cost-bar-toolbar">
        <span className="cost-bar-caption">{VIEWS[view].title}</span>
        <SegmentedButton
          accessibleName="Cost chart"
          onSelectionChange={(event) => {
            const selected = event.detail.selectedItems[0]?.dataset.view;
            if (selected) setView(selected as ChartView);
          }}
        >
          {(Object.keys(VIEWS) as ChartView[]).map((key) => (
            <SegmentedButtonItem
              key={key}
              data-view={key}
              icon={VIEWS[key].icon}
              tooltip={VIEWS[key].title}
              selected={view === key}
            />
          ))}
        </SegmentedButton>
        <Button
          design="Transparent"
          icon="full-screen"
          tooltip="Show the cost flow in full"
          onClick={() => setFullOpen(true)}
        />
      </div>
      {view === 'flow' && <CostSankey detail="compact" />}
      {view === 'share' && <ShareBar />}
      <ul className="cost-bar-legend">
        {categories.map(({ id, label, cu, minCu, maxCu, color }) => (
          <li key={id} id={id}>
            <span className="cost-bar-dot" style={{ background: color }} />
            <span className="cost-bar-label">
              {label}
              {maxCu > minCu && (
                <span className="cost-bar-range">
                  {formatCost(minCu)} – {formatCU(maxCu)} with scaling
                </span>
              )}
            </span>
            <span className="cost-bar-share">{formatPercent(share(cu))}</span>
            <span className="value">{formatCost(cu)} CU</span>
          </li>
        ))}
      </ul>
      <Dialog
        className="cost-flow-dialog"
        open={fullOpen}
        headerText={VIEWS.flow.title}
        onClose={() => setFullOpen(false)}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setFullOpen(false)}>
                Close
              </Button>
            }
          />
        }
      >
        {fullOpen && <CostSankey detail="full" />}
      </Dialog>
    </div>
  );
}
