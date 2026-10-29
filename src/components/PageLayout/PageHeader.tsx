import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { Button, Link, Text, Title, Toast } from '@ui5/webcomponents-react';
import {
  configSnapshotAtom,
  DEFAULT_SNAPSHOT,
} from '../../state/configSnapshot';
import HelpLink from '../common/HelpLink';
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
      <div className="page-header-content">
        <div className="page-header-top">
          <div>
            <Title
              level="H1"
              size="H3"
              wrappingType="Normal"
              className="page-header-title"
            >
              Estimate the costs for your SAP BTP, Kyma runtime
            </Title>
            <div className="page-header-subline">
              <Text className="page-header-subtitle">
                Configure your cluster and see how each choice affects the
                monthly price.
              </Text>
              <div className="page-header-links">
                <HelpLink docKey="metering" subtle>
                  How Capacity Units are calculated
                </HelpLink>
                <Link design="Subtle" onClick={onShowAssumptions}>
                  Assumptions and notes
                </Link>
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <Button icon="chain-link" design="Transparent" onClick={copyLink}>
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
      </div>
      <Toast open={toast !== null} onClose={() => setToast(null)}>
        {toast}
      </Toast>
    </header>
  );
}
