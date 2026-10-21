import config from '../../config.json';

// Disk storage is provisioned and billed in fixed-size blocks.
export const STORAGE_BLOCK_SIZE_GIB = config.Storage.Step;

// Number of blocks billed for a requested size: partial blocks round up (see
// consumption-reporter getSizeRoundedToBlockSize).
export function toBillableBlocks(gib: number): number {
  return Math.ceil(Math.max(0, gib) / STORAGE_BLOCK_SIZE_GIB);
}
