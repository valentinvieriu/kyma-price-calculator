import { useAtom } from 'jotai';
import { Option, Select } from '@ui5/webcomponents-react';
import config from '../../../../config.json';
import { redisState } from '../../../../state/additionalConfig/redisState';
import SubHeader from '../../common/SubHeader';
import './RedisSelect.css';

const tiers = config.RedisCosts.Tiers;

export default function RedisSelect() {
  const [redis, setRedis] = useAtom(redisState);

  return (
    <div>
      <SubHeader title="Cloud-managed Redis cache" docKey="redis" />
      <Select
        className="redis-select"
        id="redis-select"
        value={redis.tier}
        onChange={(event) => {
          const tier = tiers.find(
            ({ key }) => key === event.detail.selectedOption.value,
          );
          if (tier) setRedis({ tier: tier.key, storageGib: tier.storageGib });
        }}
      >
        {tiers.map(({ key }) => (
          <Option key={key} value={key}>
            {key}
          </Option>
        ))}
      </Select>
    </div>
  );
}
