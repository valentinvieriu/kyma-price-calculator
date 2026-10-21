import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '@ui5/webcomponents-react';
import { totalCostsAtom } from '../../state/costState';
import { formatCU, formatCurrency } from '../../utils/format';
import './MobileTotalBar.css';

// On narrow screens the summary sits below the configuration; keep the total
// visible while editing, until the summary itself scrolls into view.
export default function MobileTotalBar({ summaryId }: { summaryId: string }) {
  const totalCosts = useAtomValue(totalCostsAtom);
  const [summaryVisible, setSummaryVisible] = useState(false);

  useEffect(() => {
    const summary = document.getElementById(summaryId);
    if (!summary) return;
    const observer = new IntersectionObserver(([entry]) =>
      setSummaryVisible(entry.isIntersecting),
    );
    observer.observe(summary);
    return () => observer.disconnect();
  }, [summaryId]);

  return (
    <div className="mobile-total-bar" hidden={summaryVisible}>
      <div>
        <div className="mobile-total-bar-value">
          ≈ {formatCurrency(totalCosts.CC)} / month
        </div>
        <div className="mobile-total-bar-cu">{formatCU(totalCosts.CU)}</div>
      </div>
      <Button
        design="Emphasized"
        onClick={() =>
          document
            .getElementById(summaryId)
            ?.scrollIntoView({ behavior: 'smooth' })
        }
      >
        Breakdown
      </Button>
    </div>
  );
}
