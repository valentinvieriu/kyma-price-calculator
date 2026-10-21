import { ReactNode } from 'react';
import { Card, CardHeader } from '@ui5/webcomponents-react';
import { formatCU } from '../../utils/format';
import './Section.css';

interface Props {
  id: string;
  title: string;
  subtitle: string;
  subtotal: number;
  children: ReactNode;
}

// A configuration area whose header always shows what it adds to the total.
export default function Section({
  id,
  title,
  subtitle,
  subtotal,
  children,
}: Props) {
  return (
    <Card
      id={id}
      className="section"
      accessibleName={title}
      header={
        <CardHeader
          titleText={title}
          subtitleText={subtitle}
          action={
            <span className="section-subtotal">
              {formatCU(subtotal)}
              <span className="section-subtotal-unit"> / month</span>
            </span>
          }
        />
      }
    >
      <div className="section-content">{children}</div>
    </Card>
  );
}
