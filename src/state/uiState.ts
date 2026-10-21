import { atom } from 'jotai';

// Which billing assumption is being edited, and the element the editor opens
// next to. Shared so the equation, the summary and the notes can all open it.
export type BillingSetting = 'hours' | 'rate';

export interface BillingEditor {
  setting: BillingSetting;
  opener: string;
}

export const billingEditorState = atom<BillingEditor | null>(null);
billingEditorState.debugLabel = 'billingEditorState';

// Ids of the equation terms for each setting, used as editor openers.
export const EQUATION_TERM_IDS: Record<BillingSetting, string> = {
  hours: 'hours-term',
  rate: 'rate-term',
};
