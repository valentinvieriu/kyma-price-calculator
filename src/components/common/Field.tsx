import { ReactNode } from 'react';
import { Label } from '@ui5/webcomponents-react';
import './Field.css';

interface Props {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  // Short, value-dependent remark shown above the hint.
  note?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}

// Label above a control, with an always-visible hint explaining how the value
// is billed.
export default function Field({
  label,
  htmlFor,
  hint,
  note,
  wide,
  children,
}: Props) {
  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <Label for={htmlFor} wrappingType="Normal">
        {label}
      </Label>
      {children}
      {note && <div className="field-note">{note}</div>}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
