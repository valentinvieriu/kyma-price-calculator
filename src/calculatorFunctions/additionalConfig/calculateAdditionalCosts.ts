import config from '../../config.json';
import { STORAGE_BLOCK_SIZE_GIB } from '../storageCosts/storageBlocks';

interface Props {
  redisStorageGib: number;
  timeConsumption: number;
}

// Redis is priced at the storage block rate. Tier sizes are fixed and not
// block-aligned, so the block count is intentionally fractional here.
export default function calculateAdditionalCosts(props: Props): number {
  const { redisStorageGib, timeConsumption } = props;

  const redisStorageBlocks = redisStorageGib / STORAGE_BLOCK_SIZE_GIB;

  return redisStorageBlocks * config.Storage.PricePerUnit * timeConsumption;
}
