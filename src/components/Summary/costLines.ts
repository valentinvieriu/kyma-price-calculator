import { atom } from 'jotai';
import {
  additionalCostsAtom,
  CostScenario,
  PoolCosts,
  poolCostsAtom,
  storageCostBreakdownAtom,
} from '../../state/costState';
import { redisState } from '../../state/additionalConfig/redisState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { nfsGiBQuantityState } from '../../state/storage/nfsGiBQuantityState';
import { snapshotGiBQuantityState } from '../../state/storage/snapshotGiBQuantityState';
import { vmSizeLabel } from '../Configurator/PoolPanel';
import { CATEGORY_COLORS } from '../common/categoryColors';
import { formatNumber } from '../../utils/format';
import { CostCategory } from './costCategories';

export interface CostLine {
  text: string;
  // For narrow layouts where the full text does not fit.
  shortText?: string;
  description: string;
  cu: number;
  // OKLCH lightness offset from the category colour, see spreadShade.
  shade: number;
  // Cost of nodes the autoscaler adds on top of a pool's minimum.
  scaleOut?: boolean;
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

// Scale-out is drawn lighter than the minimum it adds to.
export const SCALE_OUT_SHADE = 0.18;

const poolName = (index: number) =>
  index === 0 ? 'Base pool' : `Worker node pool ${index}`;

// Each pool as its minimum and the nodes the autoscaler adds on average
// under its load profile, so the chart shows what load adds to the bill.
function poolLines(pools: PoolCosts[]): CostLine[] {
  return pools.flatMap(({ machine, scenarios }, index) => {
    const shade = spreadShade(index, pools.length);
    const { min, estimated } = scenarios;
    const extraNodes = estimated.nodes - min.nodes;
    const lines: CostLine[] = [
      {
        text: poolName(index),
        description: `${min.nodes} × ${vmSizeLabel(machine)}`,
        cu: min.compute,
        shade,
      },
    ];
    if (extraNodes > 0) {
      lines.push({
        text: `${poolName(index)} scale-out`,
        shortText: `${poolName(index)} +${formatNumber(extraNodes, 1)}`,
        description: `+${formatNumber(extraNodes, 2)} nodes on average`,
        cu: estimated.compute - min.compute,
        shade: shade + SCALE_OUT_SHADE,
        scaleOut: true,
      });
    }
    return lines;
  });
}

// Every billed item, grouped like the configuration sections, as shown in the
// cost flow, in the estimate.
export const costLineGroupsAtom = atom<CostLineGroup[]>((get) => {
  const storage = get(storageCostBreakdownAtom);
  const redis = get(redisState);
  const redisCosts = get(additionalCostsAtom);
  const pools = get(poolCostsAtom);
  const nodeVolume = (at: CostScenario) =>
    pools.reduce((sum, { scenarios }) => sum + scenarios[at].volume, 0);
  // Fixed per storage kind, so a kind keeps its shade when others are empty.
  const storageShade = (index: number) => spreadShade(index, 4);

  return [
    {
      id: 'nodes-cost',
      header: 'Worker node pools',
      color: CATEGORY_COLORS.nodes,
      lines: poolLines(pools),
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
          cu: nodeVolume('min'),
          shade: storageShade(3),
        },
        {
          text: 'Extra node disk scale-out',
          shortText: 'Extra disk scale-out',
          description: 'Disks of the added nodes',
          cu: nodeVolume('estimated') - nodeVolume('min'),
          shade: storageShade(3) + SCALE_OUT_SHADE,
          scaleOut: true,
        },
      ].filter(({ cu }) => cu > 1e-9),
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
