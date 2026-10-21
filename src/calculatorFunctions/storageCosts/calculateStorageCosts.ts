import config from '../../config.json';
import { toBillableBlocks } from './storageBlocks';

export interface StorageCostProps {
  GiBQuantity: number;
  nfsGiBQuantity: number;
  snapshotGiBQuantity: number;
  timeConsumption: number;
}

export interface StorageBlocks {
  standard: number;
  nfs: number;
  snapshot: number;
}

// Billed block count per storage type, before the NFS/snapshot multipliers.
// Standard storage gets a fixed number of free blocks before billing; NFS and
// snapshot do not.
export function billableStorageBlocks(
  props: Omit<StorageCostProps, 'timeConsumption'>,
): StorageBlocks {
  return {
    standard: Math.max(
      0,
      toBillableBlocks(props.GiBQuantity) - config.Storage.FreeStorageBlocks,
    ),
    nfs: toBillableBlocks(props.nfsGiBQuantity),
    snapshot: toBillableBlocks(props.snapshotGiBQuantity),
  };
}

// Cost of each storage type; NFS and snapshot are priced at a multiple of the
// standard block rate.
export function calculateStorageCostBreakdown(
  props: StorageCostProps,
): StorageBlocks {
  const blocks = billableStorageBlocks(props);
  const blockCost = config.Storage.PricePerUnit * props.timeConsumption;

  return {
    standard: blocks.standard * blockCost,
    nfs: config.NFSStorage.multiplier * blocks.nfs * blockCost,
    snapshot: config.SnapshotStorage.multiplier * blocks.snapshot * blockCost,
  };
}

export default function calculateStorageCosts(props: StorageCostProps): number {
  const blocks = billableStorageBlocks(props);
  const weightedBlocks =
    blocks.standard +
    config.NFSStorage.multiplier * blocks.nfs +
    config.SnapshotStorage.multiplier * blocks.snapshot;

  return weightedBlocks * config.Storage.PricePerUnit * props.timeConsumption;
}
