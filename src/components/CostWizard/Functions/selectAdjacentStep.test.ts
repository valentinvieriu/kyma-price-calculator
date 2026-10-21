// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest';
import selectAdjacentStep from './selectAdjacentStep';

type Step = HTMLElement & { selected: boolean; disabled: boolean };

let steps: Step[];

beforeEach(() => {
  document.body.innerHTML = `
    <ui5-wizard-step></ui5-wizard-step>
    <ui5-wizard-step><button></button></ui5-wizard-step>
    <ui5-wizard-step></ui5-wizard-step>
  `;
  steps = Array.from(document.querySelectorAll('ui5-wizard-step')) as Step[];
  steps.forEach((step, i) => {
    step.selected = i === 1;
    step.disabled = i === 2;
  });
});

const buttonInMiddleStep = () => steps[1].querySelector('button')!;

test('next selects and enables the following step', () => {
  selectAdjacentStep(buttonInMiddleStep(), 'next');

  expect(steps.map((s) => s.selected)).toEqual([false, false, true]);
  expect(steps[2].disabled).toBe(false);
});

test('previous selects the preceding step', () => {
  selectAdjacentStep(buttonInMiddleStep(), 'previous');

  expect(steps.map((s) => s.selected)).toEqual([true, false, false]);
});

test('does nothing at the edge of the wizard', () => {
  const lastButton = document.createElement('button');
  steps[2].appendChild(lastButton);

  selectAdjacentStep(lastButton, 'next');

  expect(steps.map((s) => s.selected)).toEqual([false, true, false]);
});

test('does nothing when the button is outside a wizard step', () => {
  const orphan = document.createElement('button');
  document.body.appendChild(orphan);

  expect(() => selectAdjacentStep(orphan, 'next')).not.toThrow();
  expect(steps[1].selected).toBe(true);
});
