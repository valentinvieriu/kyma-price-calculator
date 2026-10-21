import { CSSProperties, ReactNode, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Button, Icon, Link, Title } from '@ui5/webcomponents-react';
import config from '../../config.json';
import {
  additionalCostsAtom,
  machineSetupsAtom,
  nodeConfigCostsAtom,
  storageCostsAtom,
  totalCostsAtom,
} from '../../state/costState';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';
import { redisState } from '../../state/additionalConfig/redisState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../state/storage/snapshotGiBQuantityState';
import { billingEditorState, EQUATION_TERM_IDS } from '../../state/uiState';
import {
  formatCU,
  formatCost,
  formatCurrency,
  formatNumber,
  plural,
} from '../../utils/format';
import scrollToElement from '../../utils/scrollTo';
import { CATEGORY_COLORS } from '../common/categoryColors';
import HelpLink from '../common/HelpLink';
import './PricingModel.css';

// Hourly prices are multiples of 0.12, 0.02 and 0.000625 CU, so six decimals
// show them exactly and the equation multiplies out to the displayed total.
const exactPerHour = (cu: number) => `${formatNumber(cu, 6)} CU/h`;

interface TermProps {
  id?: string;
  // Shown in the compact phone layout, where terms are listed as rows.
  operator?: string;
  title: string;
  detail: string;
  value: string;
  onSelect: () => void;
  color?: string;
  editable?: boolean;
  result?: boolean;
}

// One factor of the pricing equation; selecting it jumps to, or opens, the
// place where it is configured.
function Term({
  id,
  operator,
  title,
  detail,
  value,
  onSelect,
  color,
  editable,
  result,
}: TermProps) {
  const className = [
    'pricing-term',
    editable && 'pricing-term--editable',
    result && 'pricing-term--result',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      id={id}
      type="button"
      className={className}
      style={color ? ({ '--term-color': color } as CSSProperties) : undefined}
      onClick={onSelect}
    >
      <span className="pricing-term-operator" aria-hidden="true">
        {operator}
      </span>
      <span className="pricing-term-title">{title}</span>
      <span className="pricing-term-detail">{detail}</span>
      <span className="pricing-term-value">
        {value}
        {editable && (
          <Icon name="edit" className="pricing-term-edit" mode="Decorative" />
        )}
      </span>
    </button>
  );
}

const Operator = ({ children }: { children: ReactNode }) => (
  <span className="pricing-operator" aria-hidden="true">
    {children}
  </span>
);

interface Props {
  onShowAssumptions: () => void;
}

// The pricing formula, filled in with the current configuration.
export default function PricingModel({ onShowAssumptions }: Props) {
  const hours = useAtomValue(timeConsumptionState);
  const rate = useAtomValue(applyConversionRateState);
  const nodes = useAtomValue(nodeConfigCostsAtom);
  const storage = useAtomValue(storageCostsAtom);
  const services = useAtomValue(additionalCostsAtom);
  const total = useAtomValue(totalCostsAtom);
  const machines = useAtomValue(machineSetupsAtom);
  const redis = useAtomValue(redisState);
  const volumesGib =
    useAtomValue(GiBQuantityState) +
    useAtomValue(nfsGiBQuantityState) +
    useAtomValue(snapshotGiBQuantityState);
  const [editing, editBilling] = useAtom(billingEditorState);
  // Phones show a one-line summary until expanded; wider screens always show
  // the full equation.
  const [expanded, setExpanded] = useState(false);
  // An editor opened from elsewhere needs its term on screen.
  const showDetails =
    expanded ||
    Object.values(EQUATION_TERM_IDS).includes(editing?.opener ?? '');

  const nodeCount = machines.reduce((sum, m) => sum + m.minAutoscaler, 0);
  const nodeDiskGib = machines.reduce(
    (sum, m) => sum + m.minAutoscaler * m.additionalVolumeGib,
    0,
  );
  const perHour = (monthly: number) => exactPerHour(monthly / hours);
  const rateLabel = `${formatCost(rate)} ${config.CurrencyCode}/CU`;

  return (
    <section
      id="pricing-model"
      className={`pricing-model${showDetails ? ' pricing-model--expanded' : ''}`}
      aria-labelledby="pricing-model-title"
    >
      <div className="pricing-model-header">
        <Title id="pricing-model-title" level="H2" size="H5">
          How pricing works
        </Title>
        <div className="pricing-model-links">
          <HelpLink docKey="metering" subtle>
            How Capacity Units are calculated
          </HelpLink>
          <Link design="Subtle" onClick={onShowAssumptions}>
            Assumptions and notes
          </Link>
        </div>
      </div>

      <button
        type="button"
        className="pricing-model-summary"
        aria-expanded={showDetails}
        aria-controls="pricing-equation"
        onClick={() => setExpanded(true)}
      >
        <span>
          {perHour(total.CU)} × {hours} h × {rateLabel} ={' '}
          <strong>{formatCurrency(total.CC)}</strong>
        </span>
        <span className="pricing-model-summary-action">
          How is this calculated?
        </span>
      </button>

      <div className="pricing-model-details">
        <p className="pricing-model-lead">
          Everything is metered hourly in Capacity Units (CU), starting when
          your Kyma environment is created. Select a part to change it.
        </p>

        <div id="pricing-equation" className="pricing-equation">
          <div className="pricing-group">
            <div className="pricing-group-terms">
              <Term
                title="All worker nodes"
                detail={plural(nodeCount, 'node')}
                value={perHour(nodes)}
                onSelect={() => scrollToElement('node-pools-section')}
                color={CATEGORY_COLORS.nodes}
              />
              <Operator>+</Operator>
              <Term
                operator="+"
                title="Your storage"
                detail={`${formatNumber(volumesGib + nodeDiskGib)} GiB requested`}
                value={perHour(storage)}
                onSelect={() => scrollToElement('storage-section')}
                color={CATEGORY_COLORS.storage}
              />
              <Operator>+</Operator>
              <Term
                operator="+"
                title="Your services"
                detail={redis.storageGib > 0 ? `Redis ${redis.tier}` : 'None'}
                value={perHour(services)}
                onSelect={() => scrollToElement('services-section')}
                color={CATEGORY_COLORS.services}
              />
            </div>
            <span className="pricing-group-caption">
              <span className="pricing-term-operator" aria-hidden="true">
                =
              </span>
              <span>Your cluster</span>
              <span className="pricing-group-caption-value">
                {perHour(total.CU)}
              </span>
            </span>
          </div>
          <Operator>×</Operator>
          <Term
            id={EQUATION_TERM_IDS.hours}
            operator="×"
            title="Running hours"
            detail="per month"
            value={`${hours} h`}
            onSelect={() =>
              editBilling({ setting: 'hours', opener: EQUATION_TERM_IDS.hours })
            }
            editable
          />
          <Operator>=</Operator>
          <Term
            operator="="
            title="Monthly usage"
            detail="Capacity Units"
            value={formatCU(total.CU)}
            onSelect={() => scrollToElement('cost-summary')}
          />
          <Operator>×</Operator>
          <Term
            id={EQUATION_TERM_IDS.rate}
            operator="×"
            title="Conversion rate"
            detail="your price per CU"
            value={rateLabel}
            onSelect={() =>
              editBilling({ setting: 'rate', opener: EQUATION_TERM_IDS.rate })
            }
            editable
          />
          <Operator>=</Operator>
          <Term
            operator="="
            title="Monthly cost"
            detail="at minimum node count"
            value={formatCurrency(total.CC)}
            onSelect={() => scrollToElement('cost-summary')}
            result
          />
        </div>

        <Button
          className="pricing-model-collapse"
          design="Transparent"
          icon="slim-arrow-up"
          onClick={() => setExpanded(false)}
        >
          Show less
        </Button>
      </div>
    </section>
  );
}
