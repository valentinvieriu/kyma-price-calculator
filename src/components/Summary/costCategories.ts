import { atom } from 'jotai';
import {
  additionalCostsAtom,
  nodeConfigCostsAtom,
  storageCostsAtom,
} from '../../state/costState';
import { CATEGORY_COLORS } from '../common/categoryColors';

export interface CostCategory {
  // Also used as the DOM id of the category's summary row.
  id: 'nodes-cost' | 'storage-cost' | 'additional-cost';
  label: string;
  cu: number;
  color: string;
}

export const costCategoriesAtom = atom<CostCategory[]>((get) => [
  {
    id: 'nodes-cost',
    label: 'Worker node pools',
    cu: get(nodeConfigCostsAtom),
    color: CATEGORY_COLORS.nodes,
  },
  {
    id: 'storage-cost',
    label: 'Storage',
    cu: get(storageCostsAtom),
    color: CATEGORY_COLORS.storage,
  },
  {
    id: 'additional-cost',
    label: 'Additional services',
    cu: get(additionalCostsAtom),
    color: CATEGORY_COLORS.services,
  },
]);
