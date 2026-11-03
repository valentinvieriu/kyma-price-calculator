import config from '../../config.json';
import { STORAGE_BLOCK_SIZE_GIB, toBillableBlocks } from './storageBlocks';

export interface AdditionalNodeVolumeCostProps {
  additionalVolumeGib: number;
  // May be fractional: the average node count of an autoscaling pool.
  nodes: number;
  timeConsumption: number;
}

// Each node's extra volume is rounded up to whole storage blocks before pricing.
export default function calculateAdditionalNodeVolumeCosts(
  props: AdditionalNodeVolumeCostProps,
): number {
  const { additionalVolumeGib, nodes, timeConsumption } = props;
  const billedExtraPerNode =
    toBillableBlocks(additionalVolumeGib) * STORAGE_BLOCK_SIZE_GIB;

  return (
    billedExtraPerNode *
    config.nodeConfig.AdditionalNodeVolume.PricePerUnit *
    nodes *
    timeConsumption
  );
}
