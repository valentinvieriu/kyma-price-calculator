import { describe, expect, test } from 'vitest';
import billedSizeNote from './billedSizeNote';

describe('billedSizeNote', () => {
  test('explains rounding up to whole blocks', () => {
    expect(billedSizeNote(33)).toBe('Billed as 64 GiB (2 blocks)');
    expect(billedSizeNote(1)).toBe('Billed as 32 GiB (1 block)');
  });

  test('stays silent for block-aligned sizes', () => {
    expect(billedSizeNote(0)).toBeNull();
    expect(billedSizeNote(64)).toBeNull();
  });
});
