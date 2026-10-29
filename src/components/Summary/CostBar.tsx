import { useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  Bar,
  Button,
  Dialog,
  SegmentedButton,
  SegmentedButtonItem,
} from '@ui5/webcomponents-react';
import { formatCost, formatPercent } from '../../utils/format';
import { costCategoriesAtom } from './costCategories';
import CostSankey from './CostSankey';
import './CostBar.css';

type View = 'share' | 'flow';

// Share of the total per category, either as a stacked bar or as the flow of
// every charge into its category, plus a legend with values.
export default function CostBar() {
  const categories = useAtomValue(costCategoriesAtom);
  const [view, setView] = useState<View>('flow');
  const [flowOpen, setFlowOpen] = useState(false);
  const total = categories.reduce((sum, { cu }) => sum + cu, 0);
  const share = (cu: number) => (total > 0 ? cu / total : 0);

  return (
    <div className="cost-bar">
      <div className="cost-bar-toolbar">
        <span className="cost-bar-caption">
          {view === 'flow' ? 'Where the cost comes from' : 'Share by category'}
        </span>
        <SegmentedButton
          accessibleName="Cost chart"
          onSelectionChange={(event) => {
            const selected = event.detail.selectedItems[0]?.dataset.view;
            if (selected) setView(selected as View);
          }}
        >
          <SegmentedButtonItem
            data-view="flow"
            icon="org-chart"
            tooltip="Where the cost comes from"
            selected={view === 'flow'}
          />
          <SegmentedButtonItem
            data-view="share"
            icon="horizontal-stacked-chart"
            tooltip="Share by category"
            selected={view === 'share'}
          />
        </SegmentedButton>
        <Button
          design="Transparent"
          icon="full-screen"
          tooltip="Show the full cost flow"
          onClick={() => setFlowOpen(true)}
        />
      </div>
      {view === 'flow' ? (
        <CostSankey detail="compact" />
      ) : (
        <div className="cost-bar-track" aria-hidden="true">
          {categories.map(({ id, cu, color }) =>
            cu > 0 ? (
              <div
                key={id}
                className="cost-bar-segment"
                style={{ flexGrow: cu, background: color }}
              />
            ) : null,
          )}
        </div>
      )}
      <ul className="cost-bar-legend">
        {categories.map(({ id, label, cu, color }) => (
          <li key={id} id={id}>
            <span className="cost-bar-dot" style={{ background: color }} />
            <span className="cost-bar-label">{label}</span>
            <span className="cost-bar-share">{formatPercent(share(cu))}</span>
            <span className="value">{formatCost(cu)} CU</span>
          </li>
        ))}
      </ul>
      <Dialog
        className="cost-flow-dialog"
        open={flowOpen}
        headerText="Where the cost comes from"
        onClose={() => setFlowOpen(false)}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setFlowOpen(false)}>
                Close
              </Button>
            }
          />
        }
      >
        {flowOpen && <CostSankey detail="full" />}
      </Dialog>
    </div>
  );
}
