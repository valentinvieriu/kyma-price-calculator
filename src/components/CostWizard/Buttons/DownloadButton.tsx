import { useStore } from 'jotai';
import { Button, Icon } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/download.js';
import './DownloadButton.css';
import exportToFile, { ExportFormat } from '../Functions/exportToFile';
import { costReportAtom } from '../../../state/costState';

interface Props {
  format: ExportFormat;
}

export default function DownloadButton({ format }: Props) {
  // Read on click rather than subscribing, so the button doesn't re-render on
  // every input change.
  const store = useStore();

  return (
    <Button
      className="DownloadButton"
      design="Emphasized"
      onClick={() => exportToFile(store.get(costReportAtom), format)}
    >
      Export as {format}
      <Icon className="download-icon" design="Contrast" name="download" />
    </Button>
  );
}
