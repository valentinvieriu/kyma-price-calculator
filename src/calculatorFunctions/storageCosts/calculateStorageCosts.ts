import config from '../../config.json';
import { toBillableBlocks } from './storageBlocks';

export interface StorageCostProps {
  GiBQuantity: number;
  nfsGiBQuantity: number;
  snapshotGiBQuantity: number;
  timeConsumption: number;
}

export default function calculateStorageCosts(props: StorageCostProps): number {
  const { GiBQuantity, nfsGiBQuantity, snapshotGiBQuantity, timeConsumption } =
    props;

  // Standard storage gets a fixed number of free blocks before billing; NFS and
  // snapshot do not, but are priced at a multiple of the standard block rate.
  const standardBlocks = Math.max(
    0,
    toBillableBlocks(GiBQuantity) - config.Storage.FreeStorageBlocks,
  );
  const weightedBlocks =
    standardBlocks +
    config.NFSStorage.multiplier * toBillableBlocks(nfsGiBQuantity) +
    config.SnapshotStorage.multiplier * toBillableBlocks(snapshotGiBQuantity);

  return weightedBlocks * config.Storage.PricePerUnit * timeConsumption;
}
