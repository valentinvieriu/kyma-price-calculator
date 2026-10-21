import { useAtom, useAtomValue } from 'jotai';
import { Option, Select } from '@ui5/webcomponents-react';
import config from '../../config.json';
import { redisState } from '../../state/additionalConfig/redisState';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import { additionalCostsAtom } from '../../state/costState';
import calculateAdditionalCosts from '../../calculatorFunctions/additionalConfig/calculateAdditionalCosts';
import { STORAGE_BLOCK_HOURLY_RATE } from '../../calculatorFunctions/rates';
import { STORAGE_BLOCK_SIZE_GIB } from '../../calculatorFunctions/storageCosts/storageBlocks';
import { formatCU, formatNumber } from '../../utils/format';
import Field from '../common/Field';
import Formula from '../common/Formula';
import HelpLink from '../common/HelpLink';
import Section from '../common/Section';
import './ServicesSection.css';

const tiers = config.RedisCosts.Tiers;

export default function ServicesSection() {
  const [redis, setRedis] = useAtom(redisState);
  const hours = useAtomValue(timeConsumptionState);
  const subtotal = useAtomValue(additionalCostsAtom);
  const blocks = redis.storageGib / STORAGE_BLOCK_SIZE_GIB;

  return (
    <Section
      id="services-section"
      title="Additional services"
      subtitle="Managed services are priced by their provisioned size."
      subtotal={subtotal}
      optional
    >
      <Field
        label="Cloud-managed Redis cache"
        htmlFor="redis-select"
        hint={`A Redis instance managed by your cloud provider, provisioned with the Cloud Manager module. Priced like storage: the tier size in ${STORAGE_BLOCK_SIZE_GIB} GiB blocks at ${formatNumber(STORAGE_BLOCK_HOURLY_RATE)} CU/h per block.`}
      >
        <div className="services-control">
          <Select
            id="redis-select"
            className="redis-select"
            value={redis.tier}
            onChange={(event) => {
              const tier = tiers.find(
                ({ key }) => key === event.detail.selectedOption.value,
              );
              if (tier)
                setRedis({ tier: tier.key, storageGib: tier.storageGib });
            }}
          >
            {tiers.map(({ key, storageGib }) => (
              <Option
                key={key}
                value={key}
                additionalText={
                  storageGib
                    ? `${storageGib} GiB · ${formatCU(calculateAdditionalCosts({ redisStorageGib: storageGib, timeConsumption: hours }))}`
                    : undefined
                }
              >
                {key}
              </Option>
            ))}
          </Select>
          <HelpLink docKey="redis">Redis tiers</HelpLink>
        </div>
      </Field>
      {redis.storageGib > 0 && (
        <Formula
          lines={[
            {
              label: 'Redis',
              expression: `${redis.storageGib} GiB ÷ ${STORAGE_BLOCK_SIZE_GIB} = ${formatNumber(blocks, 2)} blocks × ${formatNumber(STORAGE_BLOCK_HOURLY_RATE)} CU/h × ${hours} h`,
              result: subtotal,
            },
          ]}
        />
      )}
    </Section>
  );
}
