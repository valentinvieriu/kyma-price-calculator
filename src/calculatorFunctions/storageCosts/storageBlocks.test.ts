import { STORAGE_BLOCK_SIZE_GIB, toBillableBlocks } from './storageBlocks';
import { expect, test } from 'vitest';

test('block size is 32 GiB', () => {
  expect(STORAGE_BLOCK_SIZE_GIB).toBe(32);
});

test.each([
  [0, 0],
  [1, 1],
  [31, 1],
  [32, 1],
  [33, 2],
  [64, 2],
  [65, 3],
  [3200, 100],
])('%i GiB → %i billable blocks', (gib, blocks) => {
  expect(toBillableBlocks(gib)).toBe(blocks);
});

test('negative sizes bill nothing', () => {
  expect(toBillableBlocks(-10)).toBe(0);
});
