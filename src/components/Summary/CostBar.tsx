import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { formatCU, formatCost, formatPercent } from '../../utils/format';
import { costCategoriesAtom } from './costCategories';
import CostSankey from './CostSankey';
import './CostBar.css';

const TITLE = 'Breakdown of the estimate';

// The flow of every charge into its category, summed up to the total, with a
// full-size version in a dialog. The chart's captions are hidden from screen
// readers, so the same figures are also in a list only they read.
export default function CostBar() {
  const categories = useAtomValue(costCategoriesAtom);
  const [fullOpen, setFullOpen] = useState(false);
  const total = categories.reduce((sum, { cu }) => sum + cu, 0);
  const share = (cu: number) => (total > 0 ? cu / total : 0);

  return (
    <div className="cost-bar">
      <div className="cost-bar-toolbar">
        <span className="cost-bar-caption">{TITLE}</span>
        <Button
          design="Transparent"
          icon="full-screen"
          tooltip="Show the cost flow in full"
          onClick={() => setFullOpen(true)}
        />
      </div>
      <CostSankey detail="compact" />
      <ul className="cost-bar-legend">
        {categories.map(({ id, label, cu, minCu, maxCu }) => (
          <li key={id} id={id}>
            {label}
            {maxCu > minCu &&
              `, ${formatCost(minCu)} – ${formatCU(maxCu)} with scaling`}
            : <span className="value">{formatCost(cu)} CU</span>,{' '}
            {formatPercent(share(cu))}
          </li>
        ))}
        <li id="total-cost">
          Total: <span className="value">{formatCost(total)} CU</span>
        </li>
      </ul>
      <Dialog
        className="cost-flow-dialog"
        open={fullOpen}
        headerText={TITLE}
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
