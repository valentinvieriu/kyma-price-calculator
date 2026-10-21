import { useAtomValue } from 'jotai';
import {
  List,
  ListItemGroup,
  ListItemStandard,
} from '@ui5/webcomponents-react';
import {
  additionalCostsAtom,
  poolCostsAtom,
  storageCostBreakdownAtom,
} from '../../state/costState';
import { redisState } from '../../state/additionalConfig/redisState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../state/storage/snapshotGiBQuantityState';
import { formatCU } from '../../utils/format';
import { vmSizeLabel } from '../Configurator/PoolPanel';

interface Line {
  text: string;
  description: string;
  cu: number;
}

// Every billed item, grouped like the configuration sections.
export default function CostBreakdown() {
  const pools = useAtomValue(poolCostsAtom);
  const storage = useAtomValue(storageCostBreakdownAtom);
  const redis = useAtomValue(redisState);
  const redisCosts = useAtomValue(additionalCostsAtom);
  const gib = {
    standard: useAtomValue(GiBQuantityState),
    nfs: useAtomValue(nfsGiBQuantityState),
    snapshot: useAtomValue(snapshotGiBQuantityState),
  };

  const groups: { header: string; lines: Line[] }[] = [
    {
      header: 'Worker node pools',
      lines: pools.map(({ machine, computeCosts }, index) => ({
        text: index === 0 ? 'Base pool' : `Worker node pool ${index}`,
        description: `${machine.minAutoscaler} × ${vmSizeLabel(machine)}`,
        cu: computeCosts,
      })),
    },
    {
      header: 'Storage',
      lines: [
        {
          text: 'Standard storage',
          description: `${gib.standard} GiB`,
          cu: storage.standard,
        },
        { text: 'NFS storage', description: `${gib.nfs} GiB`, cu: storage.nfs },
        {
          text: 'Snapshot storage',
          description: `${gib.snapshot} GiB`,
          cu: storage.snapshot,
        },
        {
          text: 'Extra node disks',
          description: 'From worker node pools',
          cu: storage.nodeVolume,
        },
      ].filter(({ cu }) => cu > 0),
    },
    {
      header: 'Additional services',
      lines:
        redisCosts > 0
          ? [
              {
                text: 'Redis',
                description: `${redis.tier} · ${redis.storageGib} GiB`,
                cu: redisCosts,
              },
            ]
          : [],
    },
  ];

  return (
    <List accessibleName="Cost breakdown" separators="Inner">
      {groups
        .filter(({ lines }) => lines.length > 0)
        .map(({ header, lines }) => (
          <ListItemGroup key={header} headerText={header}>
            {lines.map(({ text, description, cu }) => (
              <ListItemStandard
                key={text}
                type="Inactive"
                text={text}
                description={description}
                additionalText={formatCU(cu)}
              />
            ))}
          </ListItemGroup>
        ))}
    </List>
  );
}
