import { atom } from 'jotai';
import { scenarioCategoriesAtom } from '../../state/costState';
import { CATEGORY_COLORS } from '../common/categoryColors';

export interface CostCategory {
  // Also used as the DOM id of the category's summary row.
  id: 'nodes-cost' | 'storage-cost' | 'additional-cost';
  label: string;
  // In the estimate.
  cu: number;
  // With every pool at its minimum and at its maximum.
  minCu: number;
  maxCu: number;
  color: string;
}

export const costCategoriesAtom = atom<CostCategory[]>((get) => {
  const categories = get(scenarioCategoriesAtom);
  const category = (
    id: CostCategory['id'],
    label: string,
    key: 'nodeConfigCosts' | 'storageCosts' | 'additionalCosts',
    color: string,
  ): CostCategory => ({
    id,
    label,
    cu: categories.estimated[key],
    minCu: categories.min[key],
    maxCu: categories.max[key],
    color,
  });
  return [
    category(
      'nodes-cost',
      'Worker node pools',
      'nodeConfigCosts',
      CATEGORY_COLORS.nodes,
    ),
    category(
      'storage-cost',
      'Storage',
      'storageCosts',
      CATEGORY_COLORS.storage,
    ),
    category(
      'additional-cost',
      'Additional services',
      'additionalCosts',
      CATEGORY_COLORS.services,
    ),
  ];
});
