import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { Button, Text, Title, Toast } from '@ui5/webcomponents-react';
import {
  configSnapshotAtom,
  DEFAULT_SNAPSHOT,
} from '../../state/configSnapshot';
import PricingModel from './PricingModel';
import './PageHeader.css';

interface Props {
  onShowAssumptions: () => void;
}

export default function PageHeader({ onShowAssumptions }: Props) {
  const setSnapshot = useSetAtom(configSnapshotAtom);
  const [toast, setToast] = useState<string | null>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast('Link to this estimate copied');
    } catch {
      setToast('Copy the link from the address bar to share this estimate');
    }
  };

  return (
    <header className="page-header">
      <div className="page-header-top">
        <div>
          <Title
            level="H1"
            size="H2"
            wrappingType="Normal"
            className="page-header-title"
          >
            Estimate the costs for your SAP BTP, Kyma runtime
          </Title>
          <Text className="page-header-subtitle">
            Configure your cluster and see how each choice affects the monthly
            price.
          </Text>
        </div>
        <div className="page-header-actions">
          <Button icon="chain-link" onClick={copyLink}>
            Copy link
          </Button>
          <Button
            icon="reset"
            design="Transparent"
            onClick={() => setSnapshot(DEFAULT_SNAPSHOT)}
          >
            Reset
          </Button>
        </div>
      </div>
      <PricingModel onShowAssumptions={onShowAssumptions} />
      <Toast open={toast !== null} onClose={() => setToast(null)}>
        {toast}
      </Toast>
    </header>
  );
}
