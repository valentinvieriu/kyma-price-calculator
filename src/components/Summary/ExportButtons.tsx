import { useStore } from 'jotai';
import { Button } from '@ui5/webcomponents-react';
import exportToFile, { ExportFormat } from './exportToFile';
import { costReportAtom } from '../../state/costState';

export default function ExportButtons() {
  // Read on click rather than subscribing, so the buttons don't re-render on
  // every input change.
  const store = useStore();

  return (
    <div className="summary-actions">
      {[ExportFormat.CSV, ExportFormat.XLSX].map((format) => (
        <Button
          key={format}
          icon="download"
          design="Transparent"
          onClick={() => exportToFile(store.get(costReportAtom), format)}
        >
          Export as {format}
        </Button>
      ))}
    </div>
  );
}
