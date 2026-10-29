import { atom } from 'jotai';
import {
  additionalCostsAtom,
  poolCostsAtom,
  storageCostBreakdownAtom,
} from '../../state/costState';
import { redisState } from '../../state/additionalConfig/redisState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../state/storage/snapshotGiBQuantityState';
import { vmSizeLabel } from '../Configurator/PoolPanel';
import { CATEGORY_COLORS } from '../common/categoryColors';
import { CostCategory } from './costCategories';

export interface CostLine {
  text: string;
  // For narrow layouts where the full text does not fit.
  shortText?: string;
  description: string;
  cu: number;
  // OKLCH lightness offset from the category colour, see spreadShade.
  shade: number;
}

export interface CostLineGroup {
  id: CostCategory['id'];
  header: string;
  color: string;
  lines: CostLine[];
}

// Items of one category share its hue and differ in lightness, darkest first.
const SHADE_RANGE = 0.24;

export function spreadShade(index: number, count: number) {
  return count < 2 ? 0 : SHADE_RANGE * (index / (count - 1) - 0.5);
}

// Every billed item, grouped like the configuration sections, as shown in the
// cost flow.
export const costLineGroupsAtom = atom<CostLineGroup[]>((get) => {
  const storage = get(storageCostBreakdownAtom);
  const redis = get(redisState);
  const redisCosts = get(additionalCostsAtom);
  const pools = get(poolCostsAtom);
  // Fixed per storage kind, so a kind keeps its shade when others are empty.
  const storageShade = (index: number) => spreadShade(index, 4);

  return [
    {
      id: 'nodes-cost',
      header: 'Worker node pools',
      color: CATEGORY_COLORS.nodes,
      lines: pools.map(({ machine, computeCosts }, index) => ({
        text: index === 0 ? 'Base pool' : `Worker node pool ${index}`,
        description: `${machine.minAutoscaler} × ${vmSizeLabel(machine)}`,
        cu: computeCosts,
        shade: spreadShade(index, pools.length),
      })),
    },
    {
      id: 'storage-cost',
      header: 'Storage',
      color: CATEGORY_COLORS.storage,
      lines: [
        {
          text: 'Persistent volumes',
          description: `${get(GiBQuantityState)} GiB`,
          cu: storage.standard,
          shade: storageShade(0),
        },
        {
          text: 'Shared file storage (NFS)',
          shortText: 'Shared files (NFS)',
          description: `${get(nfsGiBQuantityState)} GiB`,
          cu: storage.nfs,
          shade: storageShade(1),
        },
        {
          text: 'Volume snapshots',
          description: `${get(snapshotGiBQuantityState)} GiB`,
          cu: storage.snapshot,
          shade: storageShade(2),
        },
        {
          text: 'Extra node disk',
          description: 'From worker node pools',
          cu: storage.nodeVolume,
          shade: storageShade(3),
        },
      ].filter(({ cu }) => cu > 0),
    },
    {
      id: 'additional-cost',
      header: 'Additional services',
      color: CATEGORY_COLORS.services,
      lines:
        redisCosts > 0
          ? [
              {
                text: 'Redis',
                description: `${redis.tier} · ${redis.storageGib} GiB`,
                cu: redisCosts,
                shade: 0,
              },
            ]
          : [],
    },
  ];
});
costLineGroupsAtom.debugLabel = 'costLineGroupsAtom';
