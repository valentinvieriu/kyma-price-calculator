// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import SpinnerInput, { SpinnerInputProps } from './SpinnerInput';

afterEach(cleanup);

type HarnessProps = Partial<SpinnerInputProps> & {
  onValue?: (value: number) => void;
};

// Owns the value like a jotai atom would, and reports every update.
function Harness({ value: initial = 0, onValue, ...props }: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <SpinnerInput
      min={0}
      max={100}
      step={1}
      {...props}
      value={value}
      setValue={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

function setup(props: HarnessProps = {}) {
  const onValue = vi.fn();
  render(<Harness {...props} onValue={onValue} />);
  return {
    user: userEvent.setup(),
    input: screen.getByRole('textbox') as HTMLInputElement,
    decrease: screen.getByRole('button', { name: 'Decrease' }),
    increase: screen.getByRole('button', { name: 'Increase' }),
    onValue,
    lastValue: () => onValue.mock.lastCall?.[0],
  };
}

describe('buttons', () => {
  test('step the value and disable at the bounds', async () => {
    const { user, input, decrease, increase } = setup({
      value: 32,
      min: 0,
      max: 64,
      step: 32,
    });

    await user.click(increase);
    expect(input.value).toBe('64');
    expect((increase as HTMLButtonElement).disabled).toBe(true);

    await user.click(decrease);
    await user.click(decrease);
    expect(input.value).toBe('0');
    expect((decrease as HTMLButtonElement).disabled).toBe(true);
  });

  test('step fractional values without float noise', async () => {
    const { user, input, increase } = setup({
      value: 0.06,
      min: 0.01,
      max: 1.2,
      step: 0.01,
      decimals: 2,
    });

    await user.click(increase);
    expect(input.value).toBe('0.07');
  });
});

describe('typing', () => {
  test('updates the value while typing within range', async () => {
    const { user, input, lastValue } = setup({ value: 5 });

    await user.clear(input);
    await user.type(input, '42');

    expect(lastValue()).toBe(42);
  });

  test('clamps to max as soon as the value exceeds it', async () => {
    const { user, input, lastValue } = setup({ max: 300 });

    await user.clear(input);
    await user.type(input, '999');

    expect(input.value).toBe('300');
    expect(lastValue()).toBe(300);
  });

  test('ignores non-numeric keys', async () => {
    const { user, input } = setup({ value: 7 });

    await user.type(input, 'abc-');

    expect(input.value).toBe('7');
  });

  test('allows a single decimal point when decimals are enabled', async () => {
    const { user, input } = setup({
      value: 1,
      max: 2,
      step: 0.01,
      decimals: 2,
    });

    await user.clear(input);
    await user.type(input, '0.5.5');

    expect(input.value).toBe('0.55');
  });
});

describe('blur', () => {
  test('snaps to the nearest step', async () => {
    const { user, input, lastValue } = setup({ max: 3200, step: 32 });

    await user.clear(input);
    await user.type(input, '40');
    await user.tab();

    expect(input.value).toBe('32');
    expect(lastValue()).toBe(32);
  });

  test('resets empty or too-small input to min', async () => {
    const { user, input, lastValue } = setup({ value: 10, min: 3 });

    await user.clear(input);
    await user.tab();

    expect(input.value).toBe('3');
    expect(lastValue()).toBe(3);
  });

  test('formats to the configured decimals', async () => {
    const { user, input, lastValue } = setup({
      value: 1,
      min: 0.01,
      max: 1.2,
      step: 0.01,
      decimals: 2,
    });

    await user.clear(input);
    await user.type(input, '0.257');
    await user.tab();

    expect(input.value).toBe('0.26');
    expect(lastValue()).toBe(0.26);
  });
});

test('reflects external value changes when not focused', () => {
  const { rerender } = render(
    <SpinnerInput value={1} setValue={() => {}} min={0} max={10} step={1} />,
  );
  rerender(
    <SpinnerInput value={8} setValue={() => {}} min={0} max={10} step={1} />,
  );

  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('8');
});

test('renders the unit and label when given', () => {
  render(
    <SpinnerInput
      value={1}
      setValue={() => {}}
      min={0}
      max={10}
      step={1}
      unit="GiB"
      label="Size"
    />,
  );

  expect(screen.getByText('GiB')).toBeTruthy();
  expect(screen.getByText('Size')).toBeTruthy();
});
