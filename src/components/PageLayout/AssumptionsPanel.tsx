import { ReactNode } from 'react';
import { useSetAtom } from 'jotai';
import { Icon, Link, Panel, Title } from '@ui5/webcomponents-react';
import config from '../../config.json';
import { STORAGE_BLOCK_SIZE_GIB } from '../../calculatorFunctions/storageCosts/storageBlocks';
import scrollToElement from '../../utils/scrollTo';
import HelpLink from '../common/HelpLink';
import {
  BillingSetting,
  billingEditorState,
  BILLING_OPENER_IDS,
} from '../../state/uiState';
import './AssumptionsPanel.css';

const FREE_GIB = config.Storage.FreeStorageBlocks * STORAGE_BLOCK_SIZE_GIB;

// Opens the editor for a billing assumption next to its value in the summary.
// Scrolls instantly so the popover opens next to its (already visible) link.
function SettingLink({
  setting,
  children,
}: {
  setting: BillingSetting;
  children: string;
}) {
  const edit = useSetAtom(billingEditorState);
  return (
    <Link
      onClick={() => {
        scrollToElement('cost-summary', {
          block: 'start',
          behavior: 'instant',
        });
        edit({ setting, opener: BILLING_OPENER_IDS[setting] });
      }}
    >
      {children}
    </Link>
  );
}

interface Group {
  icon: string;
  title: string;
  items: ReactNode[];
}

const groups: Group[] = [
  {
    icon: 'money-bills',
    title: 'How you are billed',
    items: [
      <>
        Usage is metered every hour in Capacity Units (CU), starting once the
        Kyma environment has been created.
      </>,
      <>
        Monthly figures assume {config.TimeConsumption.Default} hours. Lower the{' '}
        <SettingLink setting="hours">running hours</SettingLink> for clusters
        that don't run all month.
      </>,
      <>
        The <SettingLink setting="rate">conversion rate</SettingLink> turns CU
        into {config.CurrencyCode} and reflects your discount, if any.
      </>,
    ],
  },
  {
    icon: 'database',
    title: 'Storage',
    items: [
      <>
        The first {FREE_GIB} GiB are included at no cost. They hold the
        cluster's operational data.
      </>,
      <>
        Storage is provisioned in {STORAGE_BLOCK_SIZE_GIB} GiB blocks, and a
        partly used block counts as a full one: a volume claim of{' '}
        {STORAGE_BLOCK_SIZE_GIB + 1}–{2 * STORAGE_BLOCK_SIZE_GIB} GiB uses two
        blocks.
      </>,
      <>
        Some Kyma modules create their own volumes. These are billed as
        additional storage.
      </>,
    ],
  },
  {
    icon: 'performance',
    title: "What the estimate doesn't cover",
    items: [
      <>
        Every managed Kyma module runs in your cluster and uses part of its
        capacity. Size your nodes with{' '}
        <HelpLink docKey="module-sizing">Module Sizing</HelpLink> in mind.
      </>,
      <>
        Real consumption grows with how you use the cluster, for example the
        number and complexity of deployments, connected systems and traffic
        through the API Gateway.
      </>,
    ],
  },
  {
    icon: 'globe',
    title: 'Limits and availability',
    items: [
      <>
        A cluster runs at most {config.nodeConfig.AutoScalerMin.Max} virtual
        machines in total, across the base pool and all worker node pools.
      </>,
      <>
        Machine types other than General Purpose are not available with every
        cloud provider, region, VM size or availability zone. Check{' '}
        <HelpLink docKey="regions">Kyma regions</HelpLink>.
      </>,
      <>EU Access landscapes are available at the same price.</>,
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssumptionsPanel({ open, onOpenChange }: Props) {
  return (
    <Panel
      id="assumptions"
      className="assumptions"
      headerText="Assumptions and notes"
      headerLevel="H3"
      collapsed={!open}
      noAnimation
      onToggle={(event) => onOpenChange(!event.target.collapsed)}
    >
      <div className="assumptions-groups">
        {groups.map(({ icon, title, items }) => (
          <section key={title} className="assumptions-group">
            <div className="assumptions-group-title">
              <Icon name={icon} mode="Decorative" />
              <Title level="H4" size="H6">
                {title}
              </Title>
            </div>
            <ul>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="assumptions-disclaimer">
        This estimator is a free tool. It estimates the Capacity Units and{' '}
        {config.CurrencyCode} for SAP Business Technology Platform, Kyma runtime
        based on the assumptions above. Actual pricing and consumption for your
        specific use may vary.
      </p>
    </Panel>
  );
}
