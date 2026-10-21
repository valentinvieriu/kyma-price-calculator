import { ReactNode } from 'react';
import { Card, CardHeader, Tag } from '@ui5/webcomponents-react';
import { formatCU } from '../../utils/format';
import './Section.css';

interface Props {
  id: string;
  title: string;
  subtitle: string;
  subtotal: number;
  // Marks sections a cluster can do without, e.g. storage and services.
  optional?: boolean;
  children: ReactNode;
}

// A configuration area whose header always shows what it adds to the total.
export default function Section({
  id,
  title,
  subtitle,
  subtotal,
  optional,
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
            <span className="section-action">
              {optional && (
                <Tag design="Neutral" hideStateIcon>
                  Optional
                </Tag>
              )}
              <span className="section-subtotal">
                {formatCU(subtotal)}
                <span className="section-subtotal-unit"> / month</span>
              </span>
            </span>
          }
        />
      }
    >
      <div className="section-content">{children}</div>
    </Card>
  );
}
