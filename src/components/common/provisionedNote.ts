import {
  STORAGE_BLOCK_SIZE_GIB,
  toBillableBlocks,
} from '../../calculatorFunctions/storageCosts/storageBlocks';
import { plural } from '../../utils/format';

// Explains block rounding for a requested size, e.g. "Provisioned as 64 GiB
// (2 blocks)". Null when the size is already a whole number of blocks.
export default function provisionedNote(gib: number): string | null {
  const blocks = toBillableBlocks(gib);
  if (blocks * STORAGE_BLOCK_SIZE_GIB === gib) return null;
  return `Provisioned as ${blocks * STORAGE_BLOCK_SIZE_GIB} GiB (${plural(blocks, 'block')})`;
}
