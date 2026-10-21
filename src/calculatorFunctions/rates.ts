import config from '../config.json';
import { STORAGE_BLOCK_SIZE_GIB } from './storageCosts/storageBlocks';

// Hourly unit prices in CU, as shown to users next to their inputs. The cost
// functions apply the same factors; these only exist to explain the result.

export function nodeHourlyRate(
  computeUnits: number,
  machineTypeFactor: number,
): number {
  return computeUnits * config.nodeConfig.PricePerUnit * machineTypeFactor;
}

// Standard storage block; NFS and snapshot apply their multiplier on top.
export const STORAGE_BLOCK_HOURLY_RATE = config.Storage.PricePerUnit;

export const NODE_VOLUME_BLOCK_HOURLY_RATE =
  config.nodeConfig.AdditionalNodeVolume.PricePerUnit * STORAGE_BLOCK_SIZE_GIB;
