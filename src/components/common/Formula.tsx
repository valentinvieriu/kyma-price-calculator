import { formatCU } from '../../utils/format';
import './Formula.css';

export interface FormulaLine {
  label?: string;
  expression: string;
  result: number;
  note?: string;
}

// Shows how a cost is derived, right next to the inputs that drive it.
export default function Formula({ lines }: { lines: FormulaLine[] }) {
  if (lines.length === 0) return null;

  return (
    <dl className="formula">
      {lines.map(({ label, expression, result, note }, index) => (
        <div
          className={`formula-line${label ? '' : ' formula-line--unlabeled'}`}
          key={index}
        >
          {label && <dt>{label}</dt>}
          <dd>
            <span className="formula-expression">{expression} =</span>{' '}
            <strong>{formatCU(result)}</strong>
            {note && <span className="formula-note"> · {note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
