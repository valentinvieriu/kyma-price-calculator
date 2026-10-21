import { formatCU } from '../../utils/format';
import './Formula.css';

export interface FormulaLine {
  label?: string;
  expression: string;
  // Omitted for descriptive lines, e.g. what a node provides.
  result?: number;
  note?: string;
}

// Shows how a cost is derived, right next to the inputs that drive it, or
// plain detail lines in the same style.
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
            {result === undefined ? (
              expression
            ) : (
              <>
                <span className="formula-expression">{expression} =</span>{' '}
                <strong>{formatCU(result)}</strong>
              </>
            )}
            {note && <span className="formula-note"> · {note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
