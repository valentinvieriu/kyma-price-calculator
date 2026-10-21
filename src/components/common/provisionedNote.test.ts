import { describe, expect, test } from 'vitest';
import provisionedNote from './provisionedNote';

describe('provisionedNote', () => {
  test('explains rounding up to whole blocks', () => {
    expect(provisionedNote(33)).toBe('Provisioned as 64 GiB (2 blocks)');
    expect(provisionedNote(1)).toBe('Provisioned as 32 GiB (1 block)');
  });

  test('stays silent for block-aligned sizes', () => {
    expect(provisionedNote(0)).toBeNull();
    expect(provisionedNote(64)).toBeNull();
  });
});
