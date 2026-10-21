import { useState } from 'react';
import Configurator from '../Configurator/Configurator';
import Summary from '../Summary/Summary';
import PageHeader from './PageHeader';
import AssumptionsPanel from './AssumptionsPanel';
import MobileTotalBar from './MobileTotalBar';
import BillingSettingEditor from './BillingSettingEditor';
import scrollToElement from '../../utils/scrollTo';
import './MainContentContainer.css';

export default function MainContentContainer() {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const showAssumptions = () => {
    setAssumptionsOpen(true);
    // Wait for React and then the panel itself to render the expanded content,
    // otherwise the page is not yet tall enough to scroll the panel to the top.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        scrollToElement('assumptions', { block: 'start' }),
      ),
    );
  };

  return (
    <main className="page">
      <PageHeader onShowAssumptions={showAssumptions} />
      <div className="page-grid">
        <div className="page-config">
          <Configurator />
          <AssumptionsPanel
            open={assumptionsOpen}
            onOpenChange={setAssumptionsOpen}
          />
        </div>
        <aside className="page-summary">
          <Summary />
        </aside>
      </div>
      <MobileTotalBar summaryId="cost-summary" />
      <BillingSettingEditor />
    </main>
  );
}
