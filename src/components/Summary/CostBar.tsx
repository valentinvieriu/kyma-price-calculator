import { useAtomValue } from 'jotai';
import { formatCost, formatPercent } from '../../utils/format';
import { costCategoriesAtom } from './costCategories';
import './CostBar.css';

// Share of the total per category: a stacked bar plus a legend with values.
export default function CostBar() {
  const categories = useAtomValue(costCategoriesAtom);
  const total = categories.reduce((sum, { cu }) => sum + cu, 0);
  const share = (cu: number) => (total > 0 ? cu / total : 0);

  return (
    <div className="cost-bar">
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
    </div>
  );
}
